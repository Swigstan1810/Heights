
import sqlite3
import pandas as pd # type: ignore
import argparse
import os
from datetime import datetime

def initialize_database():
    """Initialize the SQLite database if it doesn't exist"""
    db_path = "trading_data.db"
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
    return db_path

def import_csv(file_path, symbol=None):
    """Import data from CSV file"""
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found")
        return False
    
    try:
        # Read CSV file
        df = pd.read_csv(file_path)
        
        # Detect CSV format
        required_columns = ['date']
        price_columns = ['open', 'high', 'low', 'close']
        
        # Check if any price column exists
        has_price_column = any(col.lower() in df.columns.str.lower() for col in price_columns)
        
        if not has_price_column:
            print(f"Error: CSV must contain at least one price column (open, high, low, close)")
            return False
        
        # Standardize column names (case-insensitive)
        column_mapping = {}
        for col in df.columns:
            col_lower = col.lower()
            if col_lower == 'date' or col_lower == 'time' or col_lower == 'datetime':
                column_mapping[col] = 'date'
            elif col_lower in ('open', 'high', 'low', 'close', 'volume', 'symbol'):
                column_mapping[col] = col_lower
                
        df = df.rename(columns=column_mapping)
        
        # If symbol not in CSV and not provided as argument
        if 'symbol' not in df.columns and not symbol:
            symbol = input("Symbol not found in CSV. Please enter the symbol for this data: ").upper()
            df['symbol'] = symbol
        elif 'symbol' not in df.columns and symbol:
            df['symbol'] = symbol
            
        # Ensure date is in the correct format
        try:
            df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
        except:
            print("Warning: Could not parse date column. Make sure it's in a standard date format.")
            return False
            
        # Fill missing columns with NaN
        for col in ['open', 'high', 'low', 'close', 'volume']:
            if col not in df.columns:
                df[col] = None
                
        # Connect to database
        conn = sqlite3.connect("trading_data.db")
        
        # Import data
        count = 0
        for _, row in df.iterrows():
            try:
                cursor = conn.cursor()
                cursor.execute(
                    '''
                    INSERT INTO market_data 
                    (symbol, date, open, high, low, close, volume, source, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s','now'))
                    ''',
                    (
                        row['symbol'],
                        row['date'],
                        row.get('open'),
                        row.get('high'),
                        row.get('low'),
                        row.get('close'),
                        row.get('volume'),
                        os.path.basename(file_path)
                    )
                )
                count += 1
            except Exception as e:
                print(f"Error importing row: {e}")
                
        conn.commit()
        conn.close()
        
        print(f"Successfully imported {count} records from {file_path}")
        return True
        
    except Exception as e:
        print(f"Error importing CSV: {e}")
        return False
        
def import_sample_data():
    """Import sample data for testing"""
    conn = sqlite3.connect("trading_data.db")
    cursor = conn.cursor()
    
    # Check if we already have sample data
    cursor.execute("SELECT COUNT(*) FROM market_data WHERE source = 'sample_data'")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"Sample data already exists ({count} records)")
        conn.close()
        return
    
    # Generate sample data for popular stocks
    symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']
    base_prices = {'AAPL': 170, 'MSFT': 330, 'GOOGL': 140, 'AMZN': 180, 'TSLA': 250}
    
    # Generate 60 days of data for each symbol
    import random
    import numpy as np # type: ignore
    from datetime import datetime, timedelta
    
    end_date = datetime.now()
    
    for symbol in symbols:
        base_price = base_prices[symbol]
        price = base_price
        
        for days_ago in range(60, 0, -1):
            date = (end_date - timedelta(days=days_ago)).strftime('%Y-%m-%d')
            
            # Generate realistic price movements
            daily_volatility = base_price * 0.02  # 2% volatility
            open_price = price
            close_price = max(0.1, price * (1 + random.uniform(-0.015, 0.015)))
            high_price = max(open_price, close_price) * (1 + random.uniform(0.001, 0.01))
            low_price = min(open_price, close_price) * (1 - random.uniform(0.001, 0.01))
            volume = int(random.uniform(0.8, 1.2) * 5000000)
            
            # Insert into database
            cursor.execute(
                '''
                INSERT INTO market_data 
                (symbol, date, open, high, low, close, volume, source, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s','now'))
                ''',
                (
                    symbol,
                    date,
                    round(open_price, 2),
                    round(high_price, 2),
                    round(low_price, 2),
                    round(close_price, 2),
                    volume,
                    'sample_data'
                )
            )
            
            # Update price for next day
            price = close_price
            
    conn.commit()
    conn.close()
    print(f"Successfully imported sample data for {len(symbols)} symbols (60 days each)")

def main():
    parser = argparse.ArgumentParser(description="Import market data into the trading database")
    parser.add_argument('--file', type=str, help='Path to CSV file containing market data')
    parser.add_argument('--symbol', type=str, help='Stock symbol if not included in the CSV')
    parser.add_argument('--sample', action='store_true', help='Import sample data for testing')
    
    args = parser.parse_args()
    
    # Initialize database
    initialize_database()
    
    if args.sample:
        import_sample_data()
    elif args.file:
        import_csv(args.file, args.symbol)
    else:
        print("Please provide either a file path (--file) or use --sample to import sample data")
        print("Example usage:")
        print("  python data_import.py --file stock_data.csv --symbol AAPL")
        print("  python data_import.py --sample")

if __name__ == "__main__":
    main()