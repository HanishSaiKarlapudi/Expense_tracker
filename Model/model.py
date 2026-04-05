import pandas as pd

df = pd.read_csv("C:\\Users\\hanis\\Downloads\\Personal_Finance_Dataset.csv")

# Convert Date to datetime (safe)
df['Date'] = pd.to_datetime(df['Date'], format='mixed', dayfirst=True)
# Create year and month columns
df['year'] = df['Date'].dt.year
df['month'] = df['Date'].dt.month

df = df[df['Type'] == 'Expense']

# monthly
monthly = df.groupby(['year', 'month'])['Amount'].sum().reset_index()
monthly.rename(columns={'Amount': 'total_expense'}, inplace=True)

monthly = monthly.sort_values(['year', 'month']).reset_index(drop=True)

# Enhanced lag features
monthly['prev_month_expense'] = monthly['total_expense'].shift(1)
monthly['prev_2_month_expense'] = monthly['total_expense'].shift(2)
monthly['prev_3_month_expense'] = monthly['total_expense'].shift(3)

# Rolling statistics
monthly['rolling_3_avg'] = monthly['total_expense'].rolling(3).mean()
monthly['rolling_6_avg'] = monthly['total_expense'].rolling(6).mean()
monthly['rolling_3_std'] = monthly['total_expense'].rolling(3).std()

# Trend feature
monthly['expense_diff'] = monthly['total_expense'].diff()
monthly['expense_pct_change'] = monthly['total_expense'].pct_change()

monthly = monthly.dropna().reset_index(drop=True)

# print(monthly.head())

#features and target
X = monthly[['month', 'prev_month_expense', 'prev_2_month_expense', 'prev_3_month_expense', 
             'rolling_3_avg', 'rolling_6_avg', 'rolling_3_std', 'expense_diff', 'expense_pct_change']]
y = monthly['total_expense']

#train test split
split_index = int(len(monthly) * 0.8)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]

#feature scaling
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# print(len(X_train), len(X_test))

#MODEL TRAINING
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.svm import SVR
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

# Test different models
best_r2 = -1
best_model_name = ""
results = []

# Polynomial degrees 3, 4
for degree in [3, 4]:
    poly = PolynomialFeatures(degree=degree)
    
    X_train_poly = poly.fit_transform(X_train_scaled)
    X_test_poly = poly.transform(X_test_scaled)
    
    model_poly = LinearRegression()
    model_poly.fit(X_train_poly, y_train)
    
    y_pred_poly = model_poly.predict(X_test_poly)
    
    mae = mean_absolute_error(y_test, y_pred_poly)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_poly))
    r2 = r2_score(y_test, y_pred_poly)
    
    model_name = f"Polynomial Degree {degree}"
    results.append({
        'model': model_name,
        'MAE': mae,
        'RMSE': rmse,
        'R2': r2
    })
    
    if r2 > best_r2:
        best_r2 = r2 
        best_model_name = model_name
    
    print(f"{model_name}")
    print(f"MAE: {mae}")
    print(f"RMSE: {rmse}")
    print(f"R2: {r2}")
    print()

# SVR
svr_model = SVR(kernel='rbf', C=1000, gamma='scale', epsilon=0.1)
svr_model.fit(X_train_scaled, y_train)
y_pred_svr = svr_model.predict(X_test_scaled)

mae_svr = mean_absolute_error(y_test, y_pred_svr)
rmse_svr = np.sqrt(mean_squared_error(y_test, y_pred_svr))
r2_svr = r2_score(y_test, y_pred_svr)

results.append({
    'model': 'SVR',
    'MAE': mae_svr,
    'RMSE': rmse_svr,
    'R2': r2_svr
})

if r2_svr > best_r2:
    best_r2 = r2_svr
    best_model_name = "SVR"

print("SVR")
print(f"MAE: {mae_svr}")
print(f"RMSE: {rmse_svr}")
print(f"R2: {r2_svr}")
print()

# GBR
gbr_model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.1, max_depth=5, random_state=42)
gbr_model.fit(X_train_scaled, y_train)
y_pred_gbr = gbr_model.predict(X_test_scaled)

mae_gbr = mean_absolute_error(y_test, y_pred_gbr)
rmse_gbr = np.sqrt(mean_squared_error(y_test, y_pred_gbr))
r2_gbr = r2_score(y_test, y_pred_gbr)

results.append({
    'model': 'GBR',
    'MAE': mae_gbr,
    'RMSE': rmse_gbr,
    'R2': r2_gbr
})

if r2_gbr > best_r2:
    best_r2 = r2_gbr
    best_model_name = "GBR"

print("GBR (Gradient Boosting Regression)")
print(f"MAE: {mae_gbr}")
print(f"RMSE: {rmse_gbr}")
print(f"R2: {r2_gbr}")
print()

print(f"Best Model: {best_model_name} with R2: {best_r2}")

import joblib

# Save the best model and scaler
if best_model_name == "Polynomial Degree 3":
    poly_best = PolynomialFeatures(degree=3)
    X_train_poly_best = poly_best.fit_transform(X_train_scaled)
    model_best = LinearRegression()
    model_best.fit(X_train_poly_best, y_train)
    joblib.dump(poly_best, 'poly_transformer.joblib')
    joblib.dump(model_best, 'expense_model.joblib')
    print(f"Saved: Polynomial Degree 3 model + poly transformer")
    
elif best_model_name == "Polynomial Degree 4":
    poly_best = PolynomialFeatures(degree=4)
    X_train_poly_best = poly_best.fit_transform(X_train_scaled)
    model_best = LinearRegression()
    model_best.fit(X_train_poly_best, y_train)
    joblib.dump(poly_best, 'poly_transformer.joblib')
    joblib.dump(model_best, 'expense_model.joblib')
    print(f"Saved: Polynomial Degree 4 model + poly transformer")
    
elif best_model_name == "SVR":
    joblib.dump(svr_model, 'expense_model.joblib')
    print(f"Saved: SVR model")
    
elif best_model_name == "GBR":
    joblib.dump(gbr_model, 'expense_model.joblib')
    print(f"Saved: GBR model")

# Always save the scaler
joblib.dump(scaler, 'scaler.joblib')
print("Saved: StandardScaler")
print("\nFiles saved: expense_model.joblib, scaler.joblib")
if best_model_name.startswith("Polynomial"):
    print("Also saved: poly_transformer.joblib (needed for polynomial models)")



