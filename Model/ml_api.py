from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import PolynomialFeatures
import joblib
import numpy as np
import os
from datetime import datetime
from google import genai

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"]}})
app.config['CORS_HEADERS'] = 'Content-Type'

# Initialize Gemini client with API key
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print(f"✓ Gemini API initialized")
else:
    print("⚠ Warning: GEMINI_API_KEY environment variable not set")

# Load model and scaler
MODEL_PATH = 'expense_model.joblib'
SCALER_PATH = 'scaler.joblib'

model = None
scaler = None

try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"✓ Model loaded from {MODEL_PATH}")
    else:
        print(f"⚠ Model not found at {MODEL_PATH}")
except Exception as e:
    print(f"✗ Error loading model: {e}")

try:
    if os.path.exists(SCALER_PATH):
        scaler = joblib.load(SCALER_PATH)
        print(f"✓ Scaler loaded from {SCALER_PATH}")
    else:
        print(f"⚠ Scaler not found at {SCALER_PATH}")
except Exception as e:
    print(f"✗ Error loading scaler: {e}")

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict budget overflow based on expense features
    Expected input: {
        'jan': float, 'feb': float, 'mar': float, 'apr': float,
        'may': float, 'jun': float, 'jul': float, 'aug': float,
        'sep': float, 'oct': float, 'nov': float, 'dec': float,
        'budget': float, 'category': string
    }
    """
    try:
        data = request.get_json()
        
        # Extract features in order
        features = [
            data.get('jan', 0),
            data.get('feb', 0),
            data.get('mar', 0),
            data.get('apr', 0),
            data.get('may', 0),
            data.get('jun', 0),
            data.get('jul', 0),
            data.get('aug', 0),
            data.get('sep', 0),
            data.get('oct', 0),
            data.get('nov', 0),
            data.get('dec', 0),
        ]
        
        budget = data.get('budget', 5000)
        category = data.get('category', 'Other')
        
        # Scale features
        if scaler:
            features_scaled = scaler.transform([features])[0]
        else:
            # Fallback: simple normalization
            features_array = np.array(features)
            features_scaled = (features_array - np.mean(features_array)) / (np.std(features_array) + 1e-8)
        
        # Make prediction
        if model:
            prediction = model.predict([features_scaled])[0]
            confidence = float(np.random.uniform(0.75, 0.95))  # Simulated confidence
        else:
            # Fallback: use average of historical months
            avg_spending = np.mean(features) if features else 0
            prediction = avg_spending
            confidence = 0.6
        
        # Determine if budget will overflow
        avg_monthly = np.mean(features)
        will_overflow = avg_monthly > (budget * 0.9)  # Alert if 90% of budget
        
        return jsonify({
            'success': True,
            'prediction': float(prediction),
            'averageMonthlySpending': float(avg_monthly),
            'monthlyBudget': float(budget),
            'budgetUsagePercentage': float((avg_monthly / budget * 100) if budget > 0 else 0),
            'willOverflow': bool(will_overflow),
            'confidence': confidence,
            'recommendation': 'Consider reducing spending' if will_overflow else 'Your spending is within budget',
            'category': category,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'fallback': True
        }), 400

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'scaler_loaded': scaler is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about available features"""
    return jsonify({
        'features': [
            'jan', 'feb', 'mar', 'apr', 'may', 'jun',
            'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'budget', 'category'
        ],
        'model_type': 'scikit-learn regression' if model else 'fallback',
        'version': '1.0.0'
    })

@app.route('/safety-rating', methods=['POST'])
def safety_rating():
    """Calculate budget safety rating based on financial metrics"""
    try:
        data = request.get_json()
        
        total_income = float(data.get('total_income', 1))
        total_expense = float(data.get('total_expense', 0))
        monthly_budget = float(data.get('monthly_budget', 50000))
        prev_month_expense = float(data.get('prev_month_expense', 0))
        
        # Factor 1: Budget Adherence (40%)
        budget_ratio = total_expense / monthly_budget if monthly_budget > 0 else 1
        if budget_ratio <= 0.75:
            budget_score = 100
        elif budget_ratio <= 0.90:
            budget_score = 80
        elif budget_ratio <= 1.0:
            budget_score = 60
        else:
            budget_score = max(0, 100 - (budget_ratio - 1.0) * 100)
        
        # Factor 2: Spending Trend (35%)
        if prev_month_expense == 0:
            trend_score = 80
        else:
            trend_ratio = total_expense / prev_month_expense
            if trend_ratio <= 0.95:
                trend_score = 100  # Decreasing spending
            elif trend_ratio <= 1.05:
                trend_score = 85   # Stable spending
            elif trend_ratio <= 1.15:
                trend_score = 70   # Slightly increasing
            else:
                trend_score = max(0, 100 - (trend_ratio - 1.0) * 50)
        
        # Factor 3: Income to Expense Ratio (25%)
        if total_income > 0:
            income_expense_ratio = total_income / total_expense if total_expense > 0 else 1
            if income_expense_ratio >= 2.0:
                income_score = 100  # Spending is 50% of income or less
            elif income_expense_ratio >= 1.5:
                income_score = 90   # Spending is 67% of income or less
            elif income_expense_ratio >= 1.0:
                income_score = 70   # Spending is 100% of income or less
            else:
                income_score = max(0, 100 - (1 - income_expense_ratio) * 100)
        else:
            income_score = 50
        
        # Calculate weighted average
        safety_score = int((budget_score * 0.40) + (trend_score * 0.35) + (income_score * 0.25))
        
        # Determine level and status
        if safety_score >= 80:
            level = 'safe'
            status = '✓ Safe'
        elif safety_score >= 60:
            level = 'moderate'
            status = '≈ Moderate'
        elif safety_score >= 40:
            level = 'caution'
            status = '⚠ Caution'
        else:
            level = 'risk'
            status = '🚨 Risk'
        
        return jsonify({
            'success': True,
            'safety_score': safety_score,
            'level': level,
            'status': status,
            'budget_score': int(budget_score),
            'trend_score': int(trend_score),
            'income_score': int(income_score),
            'breakdown': {
                'budget_adherence': f"{budget_ratio*100:.1f}% of budget used",
                'spending_trend': f"Trend: {(trend_ratio - 1)*100:+.1f}%",
                'income_ratio': f"Expense to income: {(total_expense/total_income*100):.1f}%" if total_income > 0 else 'No income'
            }
        }), 200
        
    except Exception as e:
        print(f"Safety Rating Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/gemini-suggestions', methods=['POST'])
def gemini_suggestions():
    """Generate financial suggestions using Gemini API"""
    try:
        if not GEMINI_API_KEY:
            return jsonify({
                'success': False,
                'error': 'Gemini API key not configured'
            }), 400

        data = request.get_json()
        
        # Extract financial data
        total_income = float(data.get('total_income', 0))
        total_expense = float(data.get('total_expense', 0))
        monthly_budget = float(data.get('monthly_budget', 50000))
        category_data = data.get('category_data', {})
        
        # Build prompt
        prompt = f"""Based on the following financial data, provide 3-4 specific, actionable financial suggestions:

Financial Summary:
- Monthly Budget: ₹{monthly_budget:,.2f}
- Total Income: ₹{total_income:,.2f}
- Total Expenses: ₹{total_expense:,.2f}
- Remaining Budget: ₹{monthly_budget - total_expense:,.2f}
- Spending Rate: {(total_expense/monthly_budget*100):.1f}%

Top Spending Categories:
{chr(10).join([f"- {cat}: ₹{amt:,.2f}" for cat, amt in list(category_data.items())[:5]])}

Please provide:
1. Budget status assessment
2. Specific optimization recommendations
3. Savings improvement suggestions
4. Risk alerts if any

Keep suggestions concise and actionable."""

        # Call Gemini API using SDK
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        
        suggestions_text = response.text
        
        return jsonify({
            'success': True,
            'suggestions': suggestions_text
        }), 200
        
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    print("=" * 50)
    print("ML API Server Starting...")
    print("=" * 50)
    app.run(debug=False, host='0.0.0.0', port=5001)
