from dotenv import load_dotenv # type: ignore
from pydantic import BaseModel
from langchain_openai import ChatOpenAI # type: ignore
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain.agents import create_tool_calling_agent, AgentExecutor
from tools import search_tool, wiki_tool, save_tool, fetch_market_data_tool, save_to_db_tool
import sqlite3
import os

load_dotenv()

# Create database if it doesn't exist
def initialize_database():
    db_path = "trading_data.db"
    if not os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create tables for storing market data
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS market_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            date TEXT NOT NULL,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume INTEGER,
            timestamp INTEGER,
            source TEXT
        )
        ''')
        
        # Create table for predictions
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            date TEXT NOT NULL,
            prediction_type TEXT NOT NULL,
            predicted_value REAL,
            confidence REAL,
            actual_value REAL NULL,
            accuracy REAL NULL,
            model_version TEXT,
            timestamp INTEGER
        )
        ''')
        
        conn.commit()
        conn.close()
        print("Database initialized successfully")
    return db_path

# Define output structure for trading predictions
class TradingPrediction(BaseModel):
    symbol: str
    prediction_type: str
    predicted_value: float
    confidence: float
    analysis_summary: str
    indicators_used: list[str]
    timeframe: str
    sources: list[str]
    tools_used: list[str]

# Initialize database
db_path = initialize_database()

# Set up the LLM and parser
llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")
parser = PydanticOutputParser(pydantic_object=TradingPrediction)

# Create the prompt template
trading_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
            You are an AI trading assistant that helps analyze market data and make predictions.
            Use the available tools to fetch data, analyze patterns, and generate predictions.
            
            When making predictions:
            1. Use historical data analysis
            2. Consider multiple technical indicators
            3. Clearly state the confidence level and timeframe
            4. Cite sources and methodology
            
            Wrap the output in this format and provide no other text\n{format_instructions}
            """,
        ),
        ("placeholder", "{chat_history}"),
        ("human", "{query}"),
        ("placeholder", "{agent_scratchpad}"),
    ]
).partial(format_instructions=parser.get_format_instructions())

# Set up tools and agent
tools = [search_tool, wiki_tool, save_tool, fetch_market_data_tool, save_to_db_tool]
agent = create_tool_calling_agent(
    llm=llm,
    prompt=trading_prompt,
    tools=tools
)

agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

def main():
    print("Trading Prediction AI Assistant")
    print("--------------------------------")
    print("Type 'exit' to quit")
    
    while True:
        query = input("\nWhat trading prediction can I help you with? ")
        if query.lower() == 'exit':
            break
            
        try:
            raw_response = agent_executor.invoke({"query": query})
            try:
                structured_response = parser.parse(raw_response.get("output")[0]["text"])
                print("\n===== PREDICTION RESULTS =====")
                print(f"Symbol: {structured_response.symbol}")
                print(f"Prediction: {structured_response.predicted_value} ({structured_response.prediction_type})")
                print(f"Confidence: {structured_response.confidence * 100:.1f}%")
                print(f"Timeframe: {structured_response.timeframe}")
                print(f"Analysis Summary: {structured_response.analysis_summary}")
                print(f"Indicators Used: {', '.join(structured_response.indicators_used)}")
                print(f"Sources: {', '.join(structured_response.sources)}")
                
                # Save prediction to database
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute(
                    '''
                    INSERT INTO predictions 
                    (symbol, date, prediction_type, predicted_value, confidence, model_version, timestamp)
                    VALUES (?, date('now'), ?, ?, ?, ?, strftime('%s','now'))
                    ''',
                    (
                        structured_response.symbol, 
                        structured_response.prediction_type,
                        structured_response.predicted_value,
                        structured_response.confidence,
                        "claude-3-5-sonnet-20241022"
                    )
                )
                conn.commit()
                conn.close()
                
            except Exception as e:
                print("Error parsing response:", e)
                print("Raw Response:", raw_response)
        except Exception as e:
            print(f"Error processing request: {e}")

if __name__ == "__main__":
    main()