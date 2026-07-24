import datetime
from datetime import timedelta
import random
import re
import csv

from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Q
from django.http import HttpResponse

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Employee, Attendance, Leave, Project, EmployeeProject,
    Salary, Performance, AILog, Notification, PasswordResetOTP
)
from .serializers import (
    EmployeeSerializer, AttendanceSerializer, LeaveSerializer,
    ProjectSerializer, EmployeeProjectSerializer, SalarySerializer,
    PerformanceSerializer, AILogSerializer, UserSerializer, NotificationSerializer
)
from .agentic_ai import ai_engine


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Notification.objects.all()

        employee = getattr(user, 'employee_profile', None)
        role = employee.role if employee else ('Admin' if user.is_staff or user.username == 'admin' else 'Employee')

        if role == 'Admin' or user.is_staff or user.username == 'admin':
            return Notification.objects.all()

        if role == 'HR':
            return Notification.objects.filter(
                Q(recipient_role__in=['HR', 'All']) |
                Q(user=user) |
                (Q(employee=employee) if employee else Q())
            ).distinct()

        if role == 'Manager':
            return Notification.objects.filter(
                Q(recipient_role__in=['Manager', 'All']) |
                Q(user=user) |
                (Q(employee=employee) if employee else Q())
            ).distinct()

        # ROLE: Employee - Strict Account Privacy
        # An Employee must ONLY see notifications related strictly to their own account!
        qs = Notification.objects.filter(
            Q(user=user) | (Q(employee=employee) if employee else Q())
        )
        return qs.distinct()



@api_view(['POST'])
@permission_classes([AllowAny])
def mark_notification_read(request, pk):
    """Mark a specific notification as read."""
    try:
        notif = Notification.objects.get(pk=pk)
        notif.is_read = True
        notif.save()
        return Response({'message': 'Notification marked as read', 'id': pk})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([AllowAny])
def mark_all_notifications_read(request):
    """Mark all notifications as read."""
    Notification.objects.filter(is_read=False).update(is_read=True)
    return Response({'message': 'All notifications marked as read'})


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    def get_queryset(self):
        if Employee.objects.count() == 0:
            try:
                run_auto_seed()
            except Exception as e:
                print("Auto seed exception:", e)
        return Employee.objects.all()

    def perform_create(self, serializer):
        # Auto-create Django User credentials for newly added employees
        employee_code = serializer.validated_data.get('employee_code')
        email = serializer.validated_data.get('email')
        first_name = serializer.validated_data.get('first_name', '')
        last_name = serializer.validated_data.get('last_name', '')

        user = None
        if employee_code and not User.objects.filter(username=employee_code).exists():
            # Create Django user with default initial password
            temp_password = f"{employee_code}123"
            user = User.objects.create_user(
                username=employee_code,
                email=email,
                password=temp_password,
                first_name=first_name,
                last_name=last_name
            )
        serializer.save(user=user)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated:
            employee = getattr(user, 'employee_profile', None)
            role = employee.role if employee else ('Admin' if user.is_staff or user.username == 'admin' else 'Employee')
            if role == 'Employee' and employee:
                # Employee Privacy: Only return leaves belonging to this employee
                return Leave.objects.filter(employee=employee)
        return Leave.objects.all()

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class EmployeeProjectViewSet(viewsets.ModelViewSet):
    queryset = EmployeeProject.objects.all()
    serializer_class = EmployeeProjectSerializer

class SalaryViewSet(viewsets.ModelViewSet):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer

class PerformanceViewSet(viewsets.ModelViewSet):
    queryset = Performance.objects.all()
    serializer_class = PerformanceSerializer

class AILogViewSet(viewsets.ModelViewSet):
    queryset = AILog.objects.all().order_by('-timestamp')
    serializer_class = AILogSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """User Login endpoint returning JWT Token and employee role profile."""
    username_input = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()
    
    if not username_input or not password:
        return Response({'error': 'Please provide both username and password.'}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Attempt direct authentication by username
    user = authenticate(username=username_input, password=password)

    # 2. If not authenticated, attempt email lookup
    if not user and '@' in username_input:
        user_obj = User.objects.filter(email=username_input).first()
        if user_obj:
            user = authenticate(username=user_obj.username, password=password)

    # 3. Initial Bootstrapping: If database has no users, create default admin user
    if not user and User.objects.count() == 0 and username_input == 'admin':
        user = User.objects.create_superuser(username='admin', email='admin@hrms.com', password=password or 'admin123')
        # Create corresponding Admin Employee Profile
        Employee.objects.get_or_create(
            employee_code='EMP001',
            defaults={
                'user': user,
                'first_name': 'System',
                'last_name': 'Administrator',
                'email': 'admin@hrms.com',
                'department': 'Administration',
                'designation': 'HR Admin',
                'role': 'Admin',
                'date_of_joining': datetime.date.today(),
                'salary_amount': 120000.00
            }
        )

    if not user:
        return Response({'error': 'Invalid username/email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    employee = getattr(user, 'employee_profile', None)

    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name or (employee.first_name if employee else 'User'),
            'last_name': user.last_name or (employee.last_name if employee else ''),
            'role': employee.role if employee else ('Admin' if user.is_staff else 'Employee'),
            'employee_code': employee.employee_code if employee else 'EMP001',
            'department': employee.department if employee else 'Administration',
            'designation': employee.designation if employee else 'Administrator'
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def change_password_view(request):
    """Allows an employee to change their initial temporary password."""
    username = request.data.get('username', '').strip()
    old_password = request.data.get('old_password', '').strip()
    new_password = request.data.get('new_password', '').strip()

    if not username or not old_password or not new_password:
        return Response({'error': 'All fields (username, old password, new password) are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=old_password)
    if not user:
        return Response({'error': 'Invalid username or old password.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({'message': f'Password changed successfully for user {username}. Please login with your new password.'})

@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    """Allows a new employee to sign up and create an account."""
    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '').strip()
    department = request.data.get('department', 'General').strip()
    designation = request.data.get('designation', 'Staff').strip()

    if not first_name or not last_name or not email or not password:
        return Response({'error': 'First name, last name, email, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'An account with this email address already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    next_num = Employee.objects.count() + 1
    emp_code = f"EMP{str(next_num).zfill(3)}"

    user = User.objects.create_user(
        username=emp_code,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )

    Employee.objects.create(
        user=user,
        employee_code=emp_code,
        first_name=first_name,
        last_name=last_name,
        email=email,
        department=department or 'General',
        designation=designation or 'Staff',
        role='Employee',
        date_of_joining=datetime.date.today(),
        salary_amount=50000.00
    )

    return Response({'message': f'Account created successfully! Your Employee Code is {emp_code}. Please sign in.'})

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    """Allows resetting password via username or email."""
    username_or_email = request.data.get('username_or_email', '').strip()
    new_password = request.data.get('new_password', '').strip()

    if not username_or_email or not new_password:
        return Response({'error': 'Please provide username/email and a new password.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(Q(username__iexact=username_or_email) | Q(email__iexact=username_or_email)).first()
    if not user:
        return Response({'error': 'No account found with this username or email address.'}, status=status.HTTP_404_NOT_FOUND)

    user.set_password(new_password)
    user.save()
    return Response({'message': f'Password for account "{user.username}" reset successfully! Please sign in with your new password.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp_view(request):
    """Generates and sends a 6-digit OTP to the user's registered email address."""
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Registered Email Address is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Lookup user by email or username
    user = User.objects.filter(Q(email__iexact=email) | Q(username__iexact=email)).first()
    employee = None
    if user:
        employee = getattr(user, 'employee_profile', None)
    else:
        employee = Employee.objects.filter(email__iexact=email).first()
        if employee and employee.user:
            user = employee.user

    # 2. If user is not found, link to admin/EMP001 profile or create user cleanly
    if not user:
        user = User.objects.filter(username__in=['admin', 'EMP001']).first()
        if user:
            user.email = email
            user.save()
            emp_prof = getattr(user, 'employee_profile', None)
            if emp_prof:
                emp_prof.email = email
                emp_prof.save()
        else:
            uname = f"user_{random.randint(10000, 99999)}"
            user = User.objects.create_user(username=uname, email=email, password='Password123!', first_name='Shanthi', last_name='Reddaiah')

    # 3. Generate 6-digit OTP code
    otp_code = f"{random.randint(100000, 999999)}"
    now = timezone.now()
    expires_at = now + timedelta(minutes=10)

    # Invalidate previous unused OTPs for this email
    PasswordResetOTP.objects.filter(email__iexact=email, used=False).update(used=True)

    # Create new OTP record
    PasswordResetOTP.objects.create(
        user=user,
        employee=employee,
        email=email,
        otp_code=otp_code,
        expires_at=expires_at,
        used=False,
        attempt_count=0
    )

    # Send OTP Email
    full_name = f"{user.first_name} {user.last_name}".strip() if (user and user.first_name) else "Valued Employee"
    subject = "HRMS Smart AI - Password Reset Verification Code"
    body = f"Hello {full_name},\n\nWe received a request to reset your password.\n\nYour verification code is: {otp_code}\n\nThis code will expire in 10 minutes.\n\nRegards,\nHRMS Smart AI Team"

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            recipient_list=[email],
            fail_silently=True
        )
    except Exception as e:
        print("Email dispatch exception:", e)

    print(f"\n==========================================")
    print(f"[HRMS OTP SENT] Email: {email} | Code: {otp_code}")
    print(f"==========================================\n")

    return Response({
        'message': f'Verification code has been sent to {email}.',
        'email': email
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    """Verifies a 6-digit OTP code with attempt counting and expiration check."""
    email = request.data.get('email', '').strip().lower()
    otp_code = request.data.get('otp_code', '').strip()

    if not email or not otp_code:
        return Response({'error': 'Email address and Verification Code are required.'}, status=status.HTTP_400_BAD_REQUEST)

    otp_record = PasswordResetOTP.objects.filter(email__iexact=email, used=False).order_by('-created_at').first()

    if not otp_record:
        return Response({'error': 'No active verification code found. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check max attempts (3 max)
    if otp_record.attempt_count >= 3:
        return Response({'error': 'Maximum invalid attempts reached (3/3). Please request a new verification code.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check expiry (10 mins)
    if timezone.now() > otp_record.expires_at:
        return Response({'error': 'Verification code has expired. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify code match
    if otp_record.otp_code != otp_code:
        otp_record.attempt_count += 1
        otp_record.save()
        if otp_record.attempt_count >= 3:
            return Response({'error': 'Maximum invalid attempts reached (3/3). Please request a new verification code.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'success': True, 'message': 'Verification code verified successfully.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_otp_view(request):
    """Resets password using verified OTP with strict complexity enforcement."""
    email = request.data.get('email', '').strip().lower()
    otp_code = request.data.get('otp_code', '').strip()
    new_password = request.data.get('new_password', '')
    confirm_password = request.data.get('confirm_password', '')

    if not new_password or not confirm_password:
        return Response({'error': 'New Password and Confirm Password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if new_password != confirm_password:
        return Response({'error': 'Confirm Password must match New Password.'}, status=status.HTTP_400_BAD_REQUEST)

    # Complexity checks
    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
    if not re.search(r'[A-Z]', new_password):
        return Response({'error': 'Password must contain at least one uppercase letter (A-Z).'}, status=status.HTTP_400_BAD_REQUEST)
    if not re.search(r'[a-z]', new_password):
        return Response({'error': 'Password must contain at least one lowercase letter (a-z).'}, status=status.HTTP_400_BAD_REQUEST)
    if not re.search(r'[0-9]', new_password):
        return Response({'error': 'Password must contain at least one number (0-9).'}, status=status.HTTP_400_BAD_REQUEST)
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_+\-=\[\];\']', new_password):
        return Response({'error': 'Password must contain at least one special character.'}, status=status.HTTP_400_BAD_REQUEST)

    otp_record = PasswordResetOTP.objects.filter(email__iexact=email, otp_code=otp_code, used=False).order_by('-created_at').first()
    if not otp_record:
        return Response({'error': 'Invalid or expired verification session. Please restart password reset.'}, status=status.HTTP_400_BAD_REQUEST)

    if timezone.now() > otp_record.expires_at:
        return Response({'error': 'Verification code has expired. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

    user = otp_record.user or User.objects.filter(email__iexact=email).first()
    if not user:
        return Response({'error': 'User account not found.'}, status=status.HTTP_400_BAD_REQUEST)

    # Hash new password
    user.set_password(new_password)
    user.save()

    # Mark OTP as Used
    otp_record.used = True
    otp_record.save()

    return Response({'message': 'Your password has been updated successfully.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def one_time_login_view(request):
    """Allows one-time login using verified OTP."""
    email = request.data.get('email', '').strip().lower()
    otp_code = request.data.get('otp_code', '').strip()
    skip_password_change = request.data.get('skip_password_change', True)

    otp_record = PasswordResetOTP.objects.filter(email__iexact=email, otp_code=otp_code, used=False).order_by('-created_at').first()
    if not otp_record:
        return Response({'error': 'Invalid or expired verification code.'}, status=status.HTTP_400_BAD_REQUEST)

    if timezone.now() > otp_record.expires_at:
        return Response({'error': 'Verification code has expired.'}, status=status.HTTP_400_BAD_REQUEST)

    user = otp_record.user or User.objects.filter(email__iexact=email).first()
    if not user:
        return Response({'error': 'User account not found.'}, status=status.HTTP_400_BAD_REQUEST)

    # Mark OTP as Used
    otp_record.used = True
    otp_record.save()

    # Issue JWT token
    refresh = RefreshToken.for_user(user)
    employee = getattr(user, 'employee_profile', None)

    user_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': employee.role if employee else ('Admin' if user.is_staff else 'Employee'),
        'employee_code': employee.employee_code if employee else user.username,
        'force_password_change': not skip_password_change
    }

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': user_data,
        'message': 'Login successful.'
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def analytics_dashboard(request):
    """Analytics endpoint returning Pandas/NumPy aggregations."""
    from .analytics import get_overall_dashboard_analytics
    data = get_overall_dashboard_analytics()
    return Response(data)

@api_view(['POST'])
@permission_classes([AllowAny])
def predict_performance_api(request):
    """Scikit-Learn ML Performance Prediction endpoint."""
    from .ml_model import predict_employee_performance
    kpi = float(request.data.get('kpi_score', 85))
    attendance_pct = float(request.data.get('attendance_pct', 95))
    avg_hours = float(request.data.get('avg_hours', 8.0))
    
    predicted_rating = predict_employee_performance(kpi, attendance_pct, avg_hours)
    return Response({
        'kpi_score': kpi,
        'attendance_pct': attendance_pct,
        'avg_hours': avg_hours,
        'predicted_rating': predicted_rating
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def predict_attrition_api(request):
    """Scikit-Learn ML Attrition Risk Prediction endpoint."""
    from .ml_model import predict_employee_attrition
    salary = float(request.data.get('salary', 50000))
    tenure = float(request.data.get('tenure_years', 2.0))
    rating = float(request.data.get('rating', 4.0))
    
    attrition_res = predict_employee_attrition(salary, tenure, rating)
    return Response(attrition_res)

@api_view(['POST'])
@permission_classes([AllowAny])
def agentic_ai_query(request):
    """Agentic AI LLM Multi-agent endpoint."""
    prompt = request.data.get('prompt', '')
    res = ai_engine.process_query(prompt, request.user)
    return Response(res)

def run_auto_seed():
    """Seed initial sample HRMS data for demo."""
    def ensure_user_account(emp_code, email, first_name, last_name):
        u = User.objects.filter(username=emp_code).first()
        if not u:
            u = User.objects.create_user(
                username=emp_code, email=email, password=f"{emp_code}123",
                first_name=first_name, last_name=last_name
            )
        else:
            u.set_password(f"{emp_code}123")
            u.save()
        return u

    u1 = ensure_user_account('EMP001', 'shanthireddaiahreddaiah@gmail.com', 'Shanthi', 'Reddaiah')
    emp1, _ = Employee.objects.get_or_create(
        employee_code='EMP001',
        defaults={
            'user': u1, 'first_name': 'Shanthi', 'last_name': 'Reddaiah',
            'email': 'shanthireddaiahreddaiah@gmail.com', 'country_code': '+91', 'phone': '9876543210',
            'department': 'Engineering', 'designation': 'Senior Fullstack Engineer', 'role': 'Admin',
            'date_of_joining': '2023-01-15', 'salary_amount': 120000.00
        }
    )
    if emp1.email != 'shanthireddaiahreddaiah@gmail.com':
        emp1.email = 'shanthireddaiahreddaiah@gmail.com'
        emp1.save()
    if u1 and u1.email != 'shanthireddaiahreddaiah@gmail.com':
        u1.email = 'shanthireddaiahreddaiah@gmail.com'
        u1.save()
    if emp1.first_name != 'Shanthi':
        emp1.first_name = 'Shanthi'
        emp1.last_name = 'Reddaiah'
        emp1.user = u1
        emp1.save()

    u2 = ensure_user_account('EMP002', 'collin.bruno@company.com', 'Collin', 'Bruno')
    emp2, _ = Employee.objects.get_or_create(
        employee_code='EMP002',
        defaults={
            'user': u2, 'first_name': 'Collin', 'last_name': 'Bruno',
            'email': 'collin.bruno@company.com', 'country_code': '+1', 'phone': '5550198822',
            'department': 'Human Resources', 'designation': 'HR Manager', 'role': 'HR',
            'date_of_joining': '2023-03-01', 'salary_amount': 95000.00
        }
    )

    u3 = ensure_user_account('EMP003', 'elon.musk@company.com', 'Elon', 'Musk')
    emp3, _ = Employee.objects.get_or_create(
        employee_code='EMP003',
        defaults={
            'user': u3, 'first_name': 'Elon', 'last_name': 'Musk',
            'email': 'elon.musk@company.com', 'country_code': '+1', 'phone': '5550193344',
            'department': 'Engineering', 'designation': 'VP Engineering', 'role': 'Manager',
            'date_of_joining': '2023-06-10', 'salary_amount': 180000.00
        }
    )

    u4 = ensure_user_account('EMP004', 'sundar.pichai@company.com', 'Sundar', 'Pichai')
    emp4, _ = Employee.objects.get_or_create(
        employee_code='EMP004',
        defaults={
            'user': u4, 'first_name': 'Sundar', 'last_name': 'Pichai',
            'email': 'sundar.pichai@company.com', 'country_code': '+91', 'phone': '9876543211',
            'department': 'Product Design', 'designation': 'Product Lead', 'role': 'Employee',
            'date_of_joining': '2023-08-01', 'salary_amount': 150000.00
        }
    )

    u5 = ensure_user_account('EMP005', 'satya.nadella@company.com', 'Satya', 'Nadella')
    emp5, _ = Employee.objects.get_or_create(
        employee_code='EMP005',
        defaults={
            'user': u5, 'first_name': 'Satya', 'last_name': 'Nadella',
            'email': 'satya.nadella@company.com', 'country_code': '+91', 'phone': '9876543212',
            'department': 'Engineering', 'designation': 'Cloud Architect', 'role': 'Employee',
            'date_of_joining': '2023-09-15', 'salary_amount': 160000.00
        }
    )

    today = datetime.date.today()
    Attendance.objects.get_or_create(
        employee=emp1, date=today,
        defaults={'check_in': '09:00:00', 'check_out': '17:30:00', 'work_hours': 8.5, 'status': 'Present'}
    )
    Attendance.objects.get_or_create(
        employee=emp2, date=today,
        defaults={'check_in': '09:15:00', 'check_out': '17:15:00', 'work_hours': 8.0, 'status': 'Present'}
    )
    Attendance.objects.get_or_create(
        employee=emp3, date=today,
        defaults={'check_in': '09:30:00', 'check_out': '17:30:00', 'work_hours': 8.0, 'status': 'Late'}
    )

    Leave.objects.get_or_create(
        employee=emp3, start_date=today + datetime.timedelta(days=5),
        end_date=today + datetime.timedelta(days=7),
        defaults={'leave_type': 'Earned Leave (EL)', 'reason': 'Family vacation and personal leave', 'status': 'Pending'}
    )

    proj1, _ = Project.objects.get_or_create(
        name='HRMS Agentic AI Platform',
        defaults={
            'description': 'Building next-gen AI powered Employee Management System with Django, Scikit-Learn and React',
            'client_name': 'Enterprise Global Tech', 'start_date': '2026-01-01', 'status': 'In-Progress'
        }
    )

    EmployeeProject.objects.get_or_create(
        employee=emp1, project=proj1,
        defaults={'role_in_project': 'Lead Fullstack Architect'}
    )

    Salary.objects.get_or_create(
        employee=emp1, month='July', year=2026,
        defaults={'base_salary': 120000.00, 'bonuses': 10000.00, 'deductions': 5000.00, 'net_salary': 125000.00, 'payment_status': 'Paid'}
    )
    Salary.objects.get_or_create(
        employee=emp2, month='July', year=2026,
        defaults={'base_salary': 95000.00, 'bonuses': 5000.00, 'deductions': 3000.00, 'net_salary': 97000.00, 'payment_status': 'Paid'}
    )
    Salary.objects.get_or_create(
        employee=emp3, month='July', year=2026,
        defaults={'base_salary': 180000.00, 'bonuses': 1500.00, 'deductions': 8000.00, 'net_salary': 187000.00, 'payment_status': 'Paid'}
    )

    Performance.objects.get_or_create(
        employee=emp1, review_period='Q2 2026',
        defaults={'rating': 5, 'kpi_score': 98.0, 'feedback': 'Exceeded all quarter targets and led Agentic AI implementation.', 'predicted_score': 4.9}
    )
    Performance.objects.get_or_create(
        employee=emp2, review_period='Q2 2026',
        defaults={'rating': 4, 'kpi_score': 90.0, 'feedback': 'Outstanding recruitment metrics and employee engagement.', 'predicted_score': 4.5}
    )

    Notification.objects.filter(user__isnull=True, employee__isnull=True).delete()
    Notification.objects.get_or_create(
        title='Earned Leave Request', user=u2,
        defaults={'employee': emp2, 'recipient_role': 'HR', 'message': 'Elon Musk applied for Earned Leave (EL) starting next week.', 'notification_type': 'leave', 'link': '/leaves', 'is_read': False}
    )
    Notification.objects.get_or_create(
        title='Clock In Alert', user=u2,
        defaults={'employee': emp2, 'recipient_role': 'HR', 'message': 'Collin Bruno checked in at 09:15 AM today.', 'notification_type': 'attendance', 'link': '/attendance', 'is_read': False}
    )

@api_view(['POST'])
@permission_classes([AllowAny])
def seed_database(request):
    """Seed initial sample HRMS data for demo."""
    run_auto_seed()
    return Response({'message': 'Database seeded successfully with realistic HRMS employee data and notifications!'})


@api_view(['GET'])
@permission_classes([AllowAny])
def ai_log_history(request):
    """Retrieve full audit trajectory of agent queries and sub-agent responses."""
    logs = AILog.objects.all().order_by('-timestamp')[:50]
    serializer = AILogSerializer(logs, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def export_employees_csv(request):
    """Export employee directory as CSV attachment."""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="employees_directory_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['Employee Code', 'First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Designation', 'Role', 'Joining Date', 'Salary'])

    for emp in Employee.objects.all():
        writer.writerow([
            emp.employee_code, emp.first_name, emp.last_name, emp.email, emp.phone or '',
            emp.department, emp.designation, emp.role, emp.date_of_joining, emp.salary_amount
        ])
    return response

@api_view(['GET'])
@permission_classes([AllowAny])
def export_payroll_csv(request):
    """Export salary and payroll records as CSV attachment."""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="payroll_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['Employee Code', 'Employee Name', 'Department', 'Month', 'Year', 'Base Salary', 'Bonuses', 'Deductions', 'Net Salary', 'Payment Status'])

    for sal in Salary.objects.select_related('employee').all():
        writer.writerow([
            sal.employee.employee_code, f"{sal.employee.first_name} {sal.employee.last_name}",
            sal.employee.department, sal.month, sal.year, sal.base_salary, sal.bonuses,
            sal.deductions, sal.net_salary, sal.payment_status
        ])
    return response

@api_view(['GET'])
@permission_classes([AllowAny])
def export_attendance_csv(request):
    """Export attendance logs as CSV attachment."""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="attendance_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['Employee Code', 'Employee Name', 'Department', 'Date', 'Check In', 'Check Out', 'Work Hours', 'Status'])

    for att in Attendance.objects.select_related('employee').all():
        writer.writerow([
            att.employee.employee_code, f"{att.employee.first_name} {att.employee.last_name}",
            att.employee.department, att.date, att.check_in or '', att.check_out or '',
            att.work_hours, att.status
        ])
    return response

@api_view(['GET'])
@permission_classes([AllowAny])
def export_performance_csv(request):
    """Export performance metrics and rating predictions as CSV attachment."""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="performance_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['Employee Code', 'Employee Name', 'Review Period', 'Rating (1-5)', 'KPI Score', 'Predicted Score', 'Feedback'])

    for perf in Performance.objects.select_related('employee').all():
        writer.writerow([
            perf.employee.employee_code, f"{perf.employee.first_name} {perf.employee.last_name}",
            perf.review_period, perf.rating, perf.kpi_score, perf.predicted_score or '', perf.feedback
        ])
    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def approve_leave_api(request, pk):
    """Approve a pending leave request and send notification alert."""
    leave = Leave.objects.filter(pk=pk).first()
    if not leave:
        return Response({'error': 'Leave request not found.'}, status=status.HTTP_404_NOT_FOUND)
    leave.status = 'Approved'
    leave.save()

    Notification.objects.create(
        user=leave.employee.user,
        title='Leave Request Approved',
        message=f'Your {leave.leave_type} request from {leave.start_date} to {leave.end_date} has been Approved.',
        notification_type='leave',
        link='/leaves',
        is_read=False
    )
    return Response({'message': f'Leave request #{pk} for {leave.employee.first_name} has been Approved.'})

@api_view(['POST'])
@permission_classes([AllowAny])
def reject_leave_api(request, pk):
    """Reject a pending leave request and send notification alert."""
    leave = Leave.objects.filter(pk=pk).first()
    if not leave:
        return Response({'error': 'Leave request not found.'}, status=status.HTTP_404_NOT_FOUND)
    leave.status = 'Rejected'
    leave.save()

    Notification.objects.create(
        user=leave.employee.user,
        title='Leave Request Rejected',
        message=f'Your {leave.leave_type} request from {leave.start_date} to {leave.end_date} has been Rejected.',
        notification_type='leave',
        link='/leaves',
        is_read=False
    )
    return Response({'message': f'Leave request #{pk} for {leave.employee.first_name} has been Rejected.'})




