import sqlite3
import pandas as pd
import numpy as np
import joblib
import os
import argparse
from datetime import datetime, timedelta
import glob

def get_latest_model():
    """Get the latest trained model"""
    model_files = glob.glob("models/*.joblib")
    
    if not model_files:
        raise FileNotFoundError("No trained models found. Run train_model.py first.")
    
    # Filter for only model files (not scaler or feature files)
    model_files = [f for f in model_files if not (f.startswith("models/scaler_") or f.startswith("models/features_"))]
    
    if not model_files:
        raise FileNotFoundError("No trained models found. Run train_model.py first.")
    
    # Get the latest model
    latest_model = max(model_files, key=os.path.getctime)
    
    # Get matching scaler and feature files
    timestamp = latest_model.split('_', 1)[1].rsplit('.', 1)[0]
    scaler_file = f"models/scaler_{timestamp}.joblib"
    feature_file = f"models/features_{timestamp}.txt"
    
    if not os.path.exists(scaler_file) or not os.path.exists(feature_file):
        raise FileNotFoundError(f"Missing scaler or feature file for model {latest_model}")
    
    # Load model, scaler and features
    model = joblib.load(latest_model)
    scaler = joblib.load(scaler_file)
    
    with open(feature_file, 'r') as f:
        features = f.read().split(',')
    
    model_name = os.path.basename(latest_model).split('_')[0]
    
    return model, scaler, features, model_name

def get_market_data(symbol):
    """Get market data for a symbol from the database"""
    conn = sqlite3.connect("trading_data.db")
    
    # Get the last 30 days of data
    query = f"""
    SELECT * FROM market_data 
    WHERE symbol = ? 
    ORDER BY date DESC 
    LIMIT 30
    """
    
    df = pd.read_sql_query(query, conn, params=(symbol,))
    conn.close()
    
    if df.empty:
        raise ValueError(f"No data found for symbol {symbol}")
    
    # Sort by date (oldest first)
    df = df.sort_values('date')
    
    return df

def preprocess_data(df):
    """Preprocess data for prediction"""
    # Convert date to datetime
    df['date'] = pd.to_datetime(df['date'])
    
    # Calculate technical indicators
    # Moving averages
    df['ma5'] = df['close'].rolling(window=5).mean()
    df['ma20'] = df['close'].rolling(window=20).mean()
    
    # Price momentum
    df['price_momentum'] = df['close'].pct_change(5)
    
    # Volatility
    df['volatility'] = df['close'].rolling(window=10).std()
    
    # Drop NaN values
    df = df.dropna()
    
    return df

def make_prediction(symbol, days=1):
    """Make a prediction for a symbol"""
    try:
        # Get the latest trained model
        model, scaler, features, model_name = get_latest_model()
        
        # Get market data
        df = get_market_data(symbol)
        
        # Preprocess data
        df = preprocess_data(df)
        
        if df.empty:
            return {"error": "Not enough data after preprocessing"}
        
        # Prepare features
        X = df[features].iloc[-1:].values
        
        # Scale features
        X_scaled = scaler.transform(X)
        
        # Make prediction
        prediction = model.predict(X_scaled)[0]
        
        # Calculate confidence (simplified)
        last_close = df['close'].iloc[-1]
        change = prediction - last_close
        percent_change = (change / last_close) * 100
        
        # Determine confidence based on model and prediction characteristics
        # This is a simple heuristic - in reality, you'd want something more sophisticated
        confidence = min(0.9, max(0.1, 0.5 + abs(percent_change) / 20))
        
        # Format prediction results
        result = {
            "symbol": symbol,
            "current_price": round(last_close, 2),
            "predicted_price": round(prediction, 2),
            "change": round(change, 2),
            "percent_change": round(percent_change, 2),
            "confidence": round(confidence, 2),
            "prediction_date": (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d'),
            "model_used": model_name,
            "prediction_type": "next_day_close" if days == 1 else f"{days}_day_close"
        }
        
        # Save prediction to database
        conn = sqlite3.connect("trading_data.db")
        cursor = conn.cursor()
        cursor.execute(
            '''
            INSERT INTO predictions 
            (symbol, date, prediction_type, predicted_value, confidence, model_version, timestamp)
            VALUES (?, date('now'), ?, ?, ?, ?, strftime('%s','now'))
            ''',
            (
                symbol,
                result["prediction_type"],
                result["predicted_price"],
                result["confidence"],
                model_name
            )
        )
        conn.commit()
        conn.close()
        
        return result
    
    except Exception as e:
        return {"error": str(e)}

def main():
    parser = argparse.ArgumentParser(description="Make trading predictions using trained models")
    parser.add_argument('--symbol', type=str, required=True, help='Stock symbol to predict')
    parser.add_argument('--days', type=int, default=1, help='Number of days ahead to predict')
    
    args = parser.parse_args()
    
    try:
        result = make_prediction(args.symbol.upper(), args.days)
        
        if "error" in result:
            print(f"Error making prediction: {result['error']}")
        else:
            print("\n===== PREDICTION RESULTS =====")
            print(f"Symbol: {result['symbol']}")
            print(f"Current Price: ${result['current_price']}")
            print(f"Predicted Price ({result['prediction_date']}): ${result['predicted_price']}")
            print(f"Change: ${result['change']} ({result['percent_change']}%)")
            print(f"Confidence: {result['confidence'] * 100:.1f}%")
            print(f"Model Used: {result['model_used']}")
            print(f"Prediction Type: {result['prediction_type']}")
            print("\nNOTE: This is for educational purposes only. Do not use for actual trading decisions.")
    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()