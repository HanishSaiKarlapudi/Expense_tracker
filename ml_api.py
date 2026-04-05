from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"]}})
app.config['CORS_HEADERS'] = 'Content-Type'

# Load the trained models
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'expense_model.joblib')
SCALER_PATH = os.path.join(os.path.dirname(__file__), 'scaler.joblib')
POLY_TRANSFORMER_PATH = os.path.join(os.path.dirname(__file__), 'poly_transformer.joblib')

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    poly_transformer = None
    
    # Check if polynomial transformer exists (for polynomial models)
    if os.path.exists(POLY_TRANSFORMER_PATH):
        poly_transformer = joblib.load(POLY_TRANSFORMER_PATH)
    
    print(f"✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None
    scaler = None
    poly_transformer = None

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict monthly expense based on features
    
    Expected JSON format:
    {
        "month": int (1-12),
        "prev_month_expense": float,
        "prev_2_month_expense": float,
        "prev_3_month_expense": float,
        "rolling_3_avg": float,
        "rolling_6_avg": float,
        "rolling_3_std": float (optional),
        "expense_diff": float (optional),
        "expense_pct_change": float (optional)
    }
    """
    try:
        data = request.json
        
        # Extract features in the correct order
        features = np.array([[
            data.get('month', 1),
            data.get('prev_month_expense', 0),
            data.get('prev_2_month_expense', 0),
            data.get('prev_3_month_expense', 0),
            data.get('rolling_3_avg', 0),
            data.get('rolling_6_avg', 0),
            data.get('rolling_3_std', 0),
            data.get('expense_diff', 0),
            data.get('expense_pct_change', 0)
        ]])
        
        # Scale the features
        scaled_features = scaler.transform(features)
        
        # Apply polynomial transformation if available
        if poly_transformer is not None:
            scaled_features = poly_transformer.transform(scaled_features)
        
        # Make prediction
        prediction = model.predict(scaled_features)[0]
        
        # Ensure prediction is positive
        prediction = max(0, float(prediction))
        
        return jsonify({
            'success': True,
            'prediction': prediction,
            'confidence': 0.85
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'model_loaded': model is not None
    }), 200

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    return jsonify({
        'model_loaded': model is not None,
        'scaler_loaded': scaler is not None,
        'poly_transformer_loaded': poly_transformer is not None,
        'features': [
            'month',
            'prev_month_expense',
            'prev_2_month_expense',
            'prev_3_month_expense',
            'rolling_3_avg',
            'rolling_6_avg',
            'rolling_3_std',
            'expense_diff',
            'expense_pct_change'
        ]
    }), 200

@app.route('/safety-rating', methods=['POST'])
def safety_rating():
    """
    Calculate budget safety rating (0-100)
    
    Expected JSON format:
    {
        "total_income": float,
        "total_expense": float,
        "monthly_budget": float,
        "prev_month_expense": float (optional),
        "avg_expense": float (optional)
    }
    """
    try:
        data = request.json
        
        total_income = float(data.get('total_income', 0))
        total_expense = float(data.get('total_expense', 0))
        monthly_budget = float(data.get('monthly_budget', 1))
        prev_month_expense = float(data.get('prev_month_expense', 0))
        avg_expense = float(data.get('avg_expense', 0))
        
        # Initialize safety score
        safety_score = 100.0
        
        # Factor 1: Budget adherence (40% weight)
        # If spent < budget, high safety; if spent > budget, reduce safety
        budget_ratio = total_expense / monthly_budget if monthly_budget > 0 else 0
        
        if budget_ratio <= 0.7:
            budget_adherence = 100  # Excellent - only 70% of budget used
        elif budget_ratio <= 0.85:
            budget_adherence = 85   # Good - 70-85% used
        elif budget_ratio <= 0.95:
            budget_adherence = 70   # Fair - 85-95% used
        elif budget_ratio <= 1.0:
            budget_adherence = 50   # Poor - at or near budget
        else:
            budget_adherence = max(0, 100 - (budget_ratio - 1) * 100)  # Over budget
        
        budget_score = budget_adherence * 0.4
        
        # Factor 2: Spending trend (35% weight)
        # Compare current month to previous month
        trend_score = 80.0  # Neutral default
        
        if prev_month_expense > 0:
            expense_growth = ((total_expense - prev_month_expense) / prev_month_expense) * 100
            
            if expense_growth < -10:  # Decreasing - very good
                trend_score = 100 * 0.35
            elif expense_growth < 0:   # Slightly decreasing - good
                trend_score = 90 * 0.35
            elif expense_growth < 5:   # Stable - acceptable
                trend_score = 85 * 0.35
            elif expense_growth < 15:  # Moderate increase - needs attention
                trend_score = 70 * 0.35
            else:                      # High increase - warning
                trend_score = max(20, 100 - expense_growth) * 0.35
        else:
            trend_score = 85 * 0.35
        
        # Factor 3: Income vs Expense ratio (25% weight)
        # Ensure spending doesn't exceed income
        if total_income > 0:
            income_ratio = total_expense / total_income
            
            if income_ratio <= 0.5:
                income_safety = 100
            elif income_ratio <= 0.75:
                income_safety = 90
            elif income_ratio <= 0.9:
                income_safety = 75
            elif income_ratio <= 1.0:
                income_safety = 50
            else:
                income_safety = max(0, 100 - (income_ratio - 1) * 50)
        else:
            income_safety = 50
        
        income_score = income_safety * 0.25
        
        # Calculate final safety score
        total_safety_score = budget_score + trend_score + income_score
        total_safety_score = min(100, max(0, total_safety_score))
        
        # Determine safety status
        if total_safety_score >= 80:
            status = 'Excellent'
            level = 'safe'
        elif total_safety_score >= 60:
            status = 'Good'
            level = 'moderate'
        elif total_safety_score >= 40:
            status = 'Fair'
            level = 'caution'
        else:
            status = 'Poor'
            level = 'risk'
        
        return jsonify({
            'success': True,
            'safety_score': round(total_safety_score, 2),
            'status': status,
            'level': level,
            'breakdown': {
                'budget_adherence': round(budget_ratio * 100, 2),
                'budget_score': round(budget_score, 2),
                'trend_score': round(trend_score, 2),
                'income_score': round(income_score, 2)
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    app.run(debug=True, port=5001)
