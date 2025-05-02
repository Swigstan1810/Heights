from langchain_community.tools import WikipediaQueryRun, DuckDuckGoSearchRun
from langchain_community.utilities import WikipediaAPIWrapper
from langchain.tools import Tool
from datetime import datetime
import sqlite3
import json
import requests
import os

def save_to_txt(data: str, filename: str = "research_output.txt"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_text = f"--- Research Output ---\nTimestamp: {timestamp}\n\n{data}\n\n"

    with open(filename, "a", encoding="utf-8") as f:
        f.write(formatted_text)
    
    return f"Data successfully saved to {filename}"

def save_to_database(data_str: str):
    """Save data to SQLite database"""
    try:
        # Parse the input JSON
        data = json.loads(data_str)
        
        # Connect to database
        conn = sqlite3.connect("trading_data.db")
        cursor = conn.cursor()
        
        # Determine which table to insert into based on data structure
        if "symbol" in data and "open" in data:
            # This is market data
            cursor.execute(
                '''
                INSERT INTO market_data 
                (symbol, date, open, high, low, close, volume, source, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s','now'))
                ''',
                (
                    data["symbol"],
                    data.get("date", datetime.now().strftime("%Y-%m-%d")),
                    data.get("open", 0),
                    data.get("high", 0),
                    data.get("low", 0),
                    data.get("close", 0),
                    data.get("volume", 0),
                    data.get("source", "manual_entry")
                )
            )
        
        conn.commit()
        conn.close()
        return f"Successfully saved data to database for {data.get('symbol')}"
    except Exception as e:
        return f"Error saving to database: {str(e)}"

def fetch_market_data(query: str):
    """Fetch market data for a symbol"""
    # This would normally use a proper API, but for a free solution,
    # we'll simulate with placeholder functionality
    
    # Extract symbol from query
    words = query.split()
    symbol = None
    for word in words:
        if word.isupper() and len(word) <= 5:
            symbol = word
            break
    
    if not symbol:
        return "No valid stock symbol found in query"
    
    # Check if we have data in the database first
    conn = sqlite3.connect("trading_data.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM market_data WHERE symbol = ? ORDER BY date DESC LIMIT 30",
        (symbol,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    if rows:
        # Return data from database
        result = f"Found {len(rows)} records for {symbol} in database.\n"
        result += "Latest data:\n"
        latest = rows[0]
        result += f"Date: {latest[2]}, Open: {latest[3]}, Close: {latest[6]}, Volume: {latest[7]}"
        return result
    
    # For demonstration, return simulated data
    # In a real application, you would connect to a free API like Alpha Vantage or Yahoo Finance
    return f"""Simulated market data for {symbol}:
Date: {datetime.now().strftime('%Y-%m-%d')}
Open: 150.25
High: 152.75
Low: 149.50
Close: 151.30
Volume: 3245600
Note: This is simulated data. In a production system, connect to Alpha Vantage, Yahoo Finance, or another free financial API."""

# Define tools
save_tool = Tool(
    name="save_text_to_file",
    func=save_to_txt,
    description="Saves structured research data to a text file.",
)

save_to_db_tool = Tool(
    name="save_to_database",
    func=save_to_database,
    description="Saves market data or predictions to the SQLite database. Input should be a JSON string with appropriate fields.",
)

fetch_market_data_tool = Tool(
    name="fetch_market_data",
    func=fetch_market_data,
    description="Fetches market data for a given stock symbol. Input should include the stock symbol (e.g., AAPL, MSFT).",
)

search = DuckDuckGoSearchRun()
search_tool = Tool(
    name="search",
    func=search.run,
    description="Search the web for information",
)

api_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=100)
wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)
wiki_tool = Tool(
    name="wikipedia",
    func=wiki_tool.run,
    description="Search Wikipedia for information about companies, markets, and trading concepts",
)