import re
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Employee, Attendance, Leave, Project, EmployeeProject, Salary, Performance, AILog, Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']

class EmployeeSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Employee
        fields = '__all__'

    def validate_first_name(self, value):
        if not re.match(r'^[A-Za-z\s]+$', value.strip()):
            raise serializers.ValidationError("First name must contain letters and spaces only.")
        return value.strip()

    def validate_last_name(self, value):
        if not re.match(r'^[A-Za-z\s]+$', value.strip()):
            raise serializers.ValidationError("Last name must contain letters and spaces only.")
        return value.strip()

    def validate_email(self, value):
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, value.strip()):
            raise serializers.ValidationError("Please enter a valid email address (e.g. name@company.com).")
        return value.strip().lower()

    def validate_phone(self, value):
        if value and not re.match(r'^\d+$', value.strip().replace('-', '').replace(' ', '')):
            raise serializers.ValidationError("Phone number must contain digits only.")
        return value

    def validate_salary_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Base salary must be a positive number.")
        return value

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = '__all__'

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}" if obj.employee else ""

class LeaveSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Leave
        fields = '__all__'

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}" if obj.employee else ""

    def get_approved_by_name(self, obj):
        return f"{obj.approved_by.first_name} {obj.approved_by.last_name}" if obj.approved_by else "N/A"

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class EmployeeProjectSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    project_name = serializers.ReadOnlyField(source='project.name')

    class Meta:
        model = EmployeeProject
        fields = '__all__'

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}" if obj.employee else ""

class SalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Salary
        fields = '__all__'

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}" if obj.employee else ""

class PerformanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Performance
        fields = '__all__'

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}" if obj.employee else ""

    def get_reviewed_by_name(self, obj):
        return f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}" if obj.reviewed_by else "N/A"

class AILogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = AILog
        fields = '__all__'

