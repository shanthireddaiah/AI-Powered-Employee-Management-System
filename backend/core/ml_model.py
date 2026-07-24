import numpy as np
from sklearn.linear_model import LinearRegression, LogisticRegression
from .models import Performance, Attendance, Employee, Salary

# Trained model cache
_performance_model = None
_attrition_model = None

def train_dummy_models():
    """Initializes standard ML models using Scikit-Learn for performance rating & attrition prediction."""
    global _performance_model, _attrition_model
    
    # Synthetic dataset for performance (Features: KPI Score 0-100, Attendance % 0-100, Work Hours 0-12 -> Target: Rating 1.0-5.0)
    X_perf = np.array([
        [98, 100, 8.5],
        [90, 95, 8.2],
        [85, 92, 8.0],
        [75, 88, 7.8],
        [65, 82, 7.5],
        [50, 70, 7.0],
        [40, 60, 6.0],
        [30, 50, 5.5],
        [95, 98, 9.0],
        [80, 90, 8.0]
    ])
    y_perf = np.array([5.0, 4.8, 4.4, 3.9, 3.3, 2.7, 2.1, 1.5, 4.9, 4.1])
    
    _performance_model = LinearRegression()
    _performance_model.fit(X_perf, y_perf)
    
    # Synthetic dataset for attrition risk (Features: Salary $, Tenure years, Rating 1-5 -> Target: 0 (Stay), 1 (Leave))
    X_attrition = np.array([
        [120000, 5.0, 4.8],
        [95000, 3.5, 4.5],
        [85000, 2.5, 4.2],
        [70000, 4.0, 3.8],
        [55000, 1.5, 3.5],
        [45000, 2.0, 2.5],
        [38000, 1.0, 2.0],
        [32000, 0.5, 1.5],
        [65000, 3.0, 4.0],
        [40000, 3.0, 2.2]
    ])
    y_attrition = np.array([0, 0, 0, 0, 0, 1, 1, 1, 0, 1])
    
    _attrition_model = LogisticRegression(solver='liblinear')
    _attrition_model.fit(X_attrition, y_attrition)

def predict_employee_performance(kpi_score: float, attendance_pct: float, avg_hours: float) -> float:
    """Predicts rating (1.0 to 5.0) based on KPI, attendance rate, and average hours."""
    global _performance_model
    if _performance_model is None:
        train_dummy_models()
    
    features = np.array([[kpi_score, attendance_pct, avg_hours]])
    prediction = _performance_model.predict(features)[0]
    return float(np.clip(round(prediction, 2), 1.0, 5.0))

def predict_employee_attrition(salary: float, tenure_years: float, rating: float) -> dict:
    """Predicts attrition risk probability (0 to 100%) using Scikit-Learn Logistic Regression."""
    global _attrition_model
    if _attrition_model is None:
        train_dummy_models()
    
    features = np.array([[salary, tenure_years, rating]])
    prob = _attrition_model.predict_proba(features)[0][1] # Probability of leaving
    risk_pct = round(float(prob * 100), 2)
    
    if risk_pct < 25.0:
        risk_level = "Low"
        recommendation = "Employee engagement is healthy. Continue standard growth pathways and annual compensation reviews."
        primary_factor = "High job satisfaction and competitive compensation structure."
    elif risk_pct < 35.0:
        risk_level = "Medium"
        recommendation = "Schedule a 1-on-1 check-in. Review career development milestones and salary adjustments."
        primary_factor = "Moderate tenure or salary alignment relative to market rate."
    else:
        risk_level = "High"
        recommendation = "Immediate retention action recommended! Discuss compensation adjustments and career advancement opportunities."
        primary_factor = "Compensation vs experience disparity or lower performance satisfaction rating."


    return {
        'salary': salary,
        'tenure_years': tenure_years,
        'rating': rating,
        'attrition_risk_pct': risk_pct,
        'risk_level': risk_level,
        'primary_factor': primary_factor,
        'recommendation': recommendation
    }

