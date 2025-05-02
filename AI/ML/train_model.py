import sqlite3
import pandas as pd # type: ignore
import numpy as np # type: ignore
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
import os
import datetime

def load_data_from_db():
    """Load market data from SQLite database"""
    conn = sqlite3.connect("trading_data.db")
    
    # Check if the market_data table has enough data
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM market_data")
    count = cursor.fetchone()[0]
    
    if count < 30:
        print(f"Warning: Only {count} records in database. Consider importing more data for training.")
        
    # Load all data into a pandas dataframe
    query = "SELECT * FROM market_data ORDER BY date ASC"
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    return df

def preprocess_data(df):
    """Preprocess data for model training"""
    # Convert date to datetime
    df['date'] = pd.to_datetime(df['date'])
    
    # Group by symbol and date
    df = df.sort_values(['symbol', 'date'])
    
    # Feature engineering
    symbols = df['symbol'].unique()
    processed_dfs = []
    
    for symbol in symbols:
        symbol_df = df[df['symbol'] == symbol].copy()
        
        # Skip if not enough data
        if len(symbol_df) < 20:
            print(f"Skipping {symbol}: Not enough data points ({len(symbol_df)})")
            continue
            
        # Calculate technical indicators
        # Moving averages
        symbol_df['ma5'] = symbol_df['close'].rolling(window=5).mean()
        symbol_df['ma20'] = symbol_df['close'].rolling(window=20).mean()
        
        # Price momentum
        symbol_df['price_momentum'] = symbol_df['close'].pct_change(5)
        
        # Volatility
        symbol_df['volatility'] = symbol_df['close'].rolling(window=10).std()
        
        # Target: Next day's closing price
        symbol_df['target'] = symbol_df['close'].shift(-1)
        
        # Drop NaN values
        symbol_df = symbol_df.dropna()
        
        processed_dfs.append(symbol_df)
    
    if not processed_dfs:
        raise ValueError("Not enough data for any symbol after preprocessing")
        
    # Combine all processed dataframes
    processed_df = pd.concat(processed_dfs)
    
    return processed_df

def train_models(df):
    """Train prediction models"""
    # Prepare features and target
    features = ['open', 'high', 'low', 'close', 'volume', 'ma5', 'ma20', 'price_momentum', 'volatility']
    X = df[features]
    y = df['target']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train multiple models
    models = {
        'linear_regression': LinearRegression(),
        'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
        'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42)
    }
    
    results = {}
    
    # Create models directory if it doesn't exist
    os.makedirs('models', exist_ok=True)
    
    for name, model in models.items():
        # Train model
        model.fit(X_train_scaled, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test_scaled)
        
        # Evaluate model
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        results[name] = {
            'mse': mse,
            'mae': mae,
            'r2': r2
        }
        
        # Save model
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        model_filename = f"models/{name}_{timestamp}.joblib"
        joblib.dump(model, model_filename)
        
        # Save scaler
        scaler_filename = f"models/scaler_{timestamp}.joblib"
        joblib.dump(scaler, scaler_filename)
        
        # Save feature list
        feature_filename = f"models/features_{timestamp}.txt"
        with open(feature_filename, 'w') as f:
            f.write(','.join(features))
        
        print(f"Model {name} saved to {model_filename}")
        print(f"Performance: MSE={mse:.4f}, MAE={mae:.4f}, R²={r2:.4f}")
    
    return results, models

def main():
    print("Loading data from database...")
    try:
        df = load_data_from_db()
        print(f"Loaded {len(df)} records.")
        
        if len(df) < 100:
            print("Warning: Limited data available. Model quality may be affected.")
            proceed = input("Do you want to proceed with training? (y/n): ")
            if proceed.lower() != 'y':
                print("Training aborted.")
                return
        
        print("Preprocessing data...")
        processed_df = preprocess_data(df)
        print(f"Processed data shape: {processed_df.shape}")
        
        print("Training models...")
        results, models = train_models(processed_df)
        
        # Print summary
        print("\nTraining Summary:")
        print("-----------------")
        for name, metrics in results.items():
            print(f"Model: {name}")
            print(f"  Mean Squared Error: {metrics['mse']:.4f}")
            print(f"  Mean Absolute Error: {metrics['mae']:.4f}")
            print(f"  R² Score: {metrics['r2']:.4f}")
            print()
            
        print("Training complete! Models saved to 'models' directory.")
        
    except Exception as e:
        print(f"Error during training: {e}")

if __name__ == "__main__":
    main()