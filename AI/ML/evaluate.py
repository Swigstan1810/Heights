import sqlite3
import pandas as pd # type: ignore
import numpy as np # type: ignore
from datetime import datetime, timedelta
import os
import glob
import joblib # type: ignore
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score # type: ignore

def update_prediction_accuracy():
    """Update prediction accuracy by comparing with actual values"""
    conn = sqlite3.connect("trading_data.db")
    
    # Get predictions that don't have accuracy calculated yet
    query = """
    SELECT p.id, p.symbol, p.date, p.prediction_type, p.predicted_value 
    FROM predictions p
    WHERE p.accuracy IS NULL
    """
    
    predictions_df = pd.read_sql_query(query, conn)
    
    if predictions_df.empty:
        print("No predictions to evaluate")
        conn.close()
        return
    
    updated_count = 0
    
    for _, row in predictions_df.iterrows():
        prediction_id = row['id']
        symbol = row['symbol']
        prediction_date = row['date']
        predicted_value = row['predicted_value']
        prediction_type = row['prediction_type']
        
        # Parse prediction type to determine how many days ahead
        days_ahead = 1  # default
        if prediction_type != "next_day_close":
            try:
                days_ahead = int(prediction_type.split('_')[0])
            except:
                pass
                
        # Calculate the target date
        prediction_date = datetime.strptime(prediction_date, '%Y-%m-%d')
        target_date = prediction_date + timedelta(days=days_ahead)
        target_date_str = target_date.strftime('%Y-%m-%d')
        
        # Get actual value from market_data
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT close FROM market_data
            WHERE symbol = ? AND date = ?
            """,
            (symbol, target_date_str)
        )
        result = cursor.fetchone()
        
        if result:
            actual_value = result[0]
            
            # Calculate accuracy (as percentage error)
            error = abs(predicted_value - actual_value) / actual_value
            accuracy = max(0, 1 - error)  # Clamp between 0 and 1
            
            # Update prediction record
            cursor.execute(
                """
                UPDATE predictions
                SET actual_value = ?, accuracy = ?
                WHERE id = ?
                """,
                (actual_value, accuracy, prediction_id)
            )
            conn.commit()
            updated_count += 1
    
    conn.close()
    
    if updated_count > 0:
        print(f"Updated accuracy for {updated_count} predictions")
    else:
        print("No predictions could be evaluated (no matching actual data found)")

def evaluate_models():
    """Evaluate all trained models on the most recent data"""
    # Get all model files
    model_files = glob.glob("models/*.joblib")
    model_files = [f for f in model_files if not (f.startswith("models/scaler_") or f.startswith("models/features_"))]
    
    if not model_files:
        print("No trained models found")
        return
    
    # Get market data
    conn = sqlite3.connect("trading_data.db")
    query = """
    SELECT * FROM market_data
    ORDER BY date DESC
    LIMIT 500
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    if df.empty:
        print("No market data found")
        return
    
    # Group by symbol
    symbols = df['symbol'].unique()
    
    results = []
    
    for model_file in model_files:
        model_name = os.path.basename(model_file).split('_')[0]
        timestamp = model_file.split('_', 1)[1].rsplit('.', 1)[0]
        
        scaler_file = f"models/scaler_{timestamp}.joblib"
        feature_file = f"models/features_{timestamp}.txt"
        
        if not os.path.exists(scaler_file) or not os.path.exists(feature_file):
            print(f"Missing scaler or feature file for model {model_file}")
            continue
        
        # Load model, scaler and features
        model = joblib.load(model_file)
        scaler = joblib.load(scaler_file)
        
        with open(feature_file, 'r') as f:
            features = f.read().split(',')
        
        # Evaluate for each symbol
        for symbol in symbols:
            symbol_df = df[df['symbol'] == symbol].copy()
            
            # Sort by date
            symbol_df = symbol_df.sort_values('date')
            
            # Skip if not enough data
            if len(symbol_df) < 30:
                continue
                
            # Preprocess data
            symbol_df['date'] = pd.to_datetime(symbol_df['date'])
            symbol_df['ma5'] = symbol_df['close'].rolling(window=5).mean()
            symbol_df['ma20'] = symbol_df['close'].rolling(window=20).mean()
            symbol_df['price_momentum'] = symbol_df['close'].pct_change(5)
            symbol_df['volatility'] = symbol_df['close'].rolling(window=10).std()
            symbol_df['target'] = symbol_df['close'].shift(-1)
            symbol_df = symbol_df.dropna()
            
            # Skip if not enough data after preprocessing
            if len(symbol_df) < 20:
                continue
            
            # Split into training and testing
            train_size = int(0.8 * len(symbol_df))
            train_df = symbol_df.iloc[:train_size]
            test_df = symbol_df.iloc[train_size:]
            
            # Skip if test set is too small
            if len(test_df) < 5:
                continue
                
            # Prepare features
            X_test = test_df[features].values
            y_test = test_df['target'].values
            
            # Scale features
            X_test_scaled = scaler.transform(X_test)
            
            # Make predictions
            y_pred = model.predict(X_test_scaled)
            
            # Calculate metrics
            mse = mean_squared_error(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            # Calculate average percentage error
            percent_errors = []
            for i in range(len(y_test)):
                if y_test[i] != 0:
                    percent_error = abs(y_pred[i] - y_test[i]) / y_test[i]
                    percent_errors.append(percent_error)
            
            avg_percent_error = np.mean(percent_errors) if percent_errors else float('nan')
            
            results.append({
                'model': model_name,
                'symbol': symbol,
                'mse': mse,
                'mae': mae,
                'r2': r2,
                'avg_percent_error': avg_percent_error,
                'test_size': len(test_df)
            })
    
    if not results:
        print("No evaluation results (not enough data)")
        return
        
    # Convert to DataFrame for easy analysis
    results_df = pd.DataFrame(results)
    
    # Print summary
    print("\nModel Evaluation Summary")
    print("=======================")
    
    # Average across all symbols by model
    model_summary = results_df.groupby('model').agg({
        'mse': 'mean',
        'mae': 'mean',
        'r2': 'mean',
        'avg_percent_error': 'mean'
    }).reset_index()
    
    for _, row in model_summary.iterrows():
        print(f"\nModel: {row['model']}")
        print(f"  Mean Squared Error: {row['mse']:.4f}")
        print(f"  Mean Absolute Error: {row['mae']:.4f}")
        print(f"  R² Score: {row['r2']:.4f}")
        print(f"  Avg Percent Error: {row['avg_percent_error'] * 100:.2f}%")
    
    # Best model by mean absolute error
    best_model = model_summary.loc[model_summary['mae'].idxmin()]['model']
    print(f"\nBest model by MAE: {best_model}")
    
    # Symbol-specific performance for best model
    best_model_results = results_df[results_df['model'] == best_model].sort_values('mae')
    
    print("\nBest model performance by symbol:")
    for _, row in best_model_results.iterrows():
        print(f"  {row['symbol']}: MAE={row['mae']:.4f}, Error={row['avg_percent_error']*100:.2f}%")

def main():
    print("Trading Model Evaluation")
    print("=======================")
    
    # Update prediction accuracy
    print("\nUpdating prediction accuracy...")
    update_prediction_accuracy()
    
    # Evaluate models
    print("\nEvaluating model performance...")
    evaluate_models()
    
    # Print prediction statistics
    conn = sqlite3.connect("trading_data.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM predictions")
    prediction_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM predictions WHERE accuracy IS NOT NULL")
    evaluated_count = cursor.fetchone()[0]
    
    if evaluated_count > 0:
        cursor.execute("SELECT AVG(accuracy) FROM predictions WHERE accuracy IS NOT NULL")
        avg_accuracy = cursor.fetchone()[0]
        
        print(f"\nPrediction Statistics:")
        print(f"  Total Predictions: {prediction_count}")
        print(f"  Evaluated Predictions: {evaluated_count}")
        print(f"  Average Accuracy: {avg_accuracy * 100:.2f}%")
        
        # Show accuracy by model
        cursor.execute("""
        SELECT model_version, AVG(accuracy) as avg_accuracy, COUNT(*) as count
        FROM predictions 
        WHERE accuracy IS NOT NULL
        GROUP BY model_version
        ORDER BY avg_accuracy DESC
        """)
        
        model_stats = cursor.fetchall()
        
        if model_stats:
            print("\nAccuracy by Model:")
            for model, accuracy, count in model_stats:
                print(f"  {model}: {accuracy * 100:.2f}% (from {count} predictions)")
    
    conn.close()

if __name__ == "__main__":
    main()