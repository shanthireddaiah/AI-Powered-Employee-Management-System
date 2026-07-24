from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmployeeViewSet, AttendanceViewSet, LeaveViewSet,
    ProjectViewSet, EmployeeProjectViewSet, SalaryViewSet,
    PerformanceViewSet, AILogViewSet, NotificationViewSet, login_view, change_password_view,
    signup_view, forgot_password_view, send_otp_view, verify_otp_view,
    reset_password_otp_view, one_time_login_view,
    analytics_dashboard, predict_performance_api, predict_attrition_api,
    agentic_ai_query, seed_database, ai_log_history,
    export_employees_csv, export_payroll_csv, export_attendance_csv, export_performance_csv,
    approve_leave_api, reject_leave_api, mark_notification_read, mark_all_notifications_read
)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'leaves', LeaveViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'employee-projects', EmployeeProjectViewSet)
router.register(r'salary', SalaryViewSet)
router.register(r'performance', PerformanceViewSet)
router.register(r'ai-logs', AILogViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('auth/login/', login_view, name='login'),
    path('auth/signup/', signup_view, name='signup'),
    path('auth/forgot-password/', forgot_password_view, name='forgot_password'),
    path('auth/send-otp/', send_otp_view, name='send_otp'),
    path('auth/verify-otp/', verify_otp_view, name='verify_otp'),
    path('auth/reset-password-otp/', reset_password_otp_view, name='reset_password_otp'),
    path('auth/one-time-login/', one_time_login_view, name='one_time_login'),
    path('auth/change-password/', change_password_view, name='change_password'),
    path('notifications/mark-all-read/', mark_all_notifications_read, name='mark_all_notifications_read'),
    path('notifications/<int:pk>/mark-read/', mark_notification_read, name='mark_notification_read'),
    path('', include(router.urls)),
    path('analytics/dashboard/', analytics_dashboard, name='analytics_dashboard'),


    path('predict/performance/', predict_performance_api, name='predict_performance'),
    path('predict/attrition/', predict_attrition_api, name='predict_attrition'),
    path('ai/agent/', agentic_ai_query, name='agentic_ai_query'),
    path('ai/logs/history/', ai_log_history, name='ai_log_history'),
    path('leaves/<int:pk>/approve/', approve_leave_api, name='approve_leave'),
    path('leaves/<int:pk>/reject/', reject_leave_api, name='reject_leave'),
    path('exports/employees/', export_employees_csv, name='export_employees_csv'),
    path('exports/payroll/', export_payroll_csv, name='export_payroll_csv'),
    path('exports/attendance/', export_attendance_csv, name='export_attendance_csv'),
    path('exports/performance/', export_performance_csv, name='export_performance_csv'),
    path('seed/', seed_database, name='seed_database'),
]



