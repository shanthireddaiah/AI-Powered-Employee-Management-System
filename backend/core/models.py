from django.db import models
from django.contrib.auth.models import User

class Employee(models.Model):
    ROLE_CHOICES = (
        ('Admin', 'Admin'),
        ('HR', 'HR Manager'),
        ('Manager', 'Project Manager'),
        ('Employee', 'Employee'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile', null=True, blank=True)
    employee_code = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    country_code = models.CharField(max_length=10, default='+91')
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Employee')
    date_of_joining = models.DateField()
    salary_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)


    class Meta:
        db_table = 'employees'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_code})"


class Attendance(models.Model):
    STATUS_CHOICES = (
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Half-Day', 'Half-Day'),
        ('Late', 'Late'),
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    work_hours = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Present')

    class Meta:
        db_table = 'attendance'
        unique_together = ('employee', 'date')

    def __str__(self):
        return f"{self.employee} - {self.date} - {self.status}"


class Leave(models.Model):
    LEAVE_TYPES = (
        ('Casual', 'Casual Leave (GL)'),
        ('Earned', 'Earned Leave (EL)'),
        ('Festival', 'Festival Leave (FL)'),
        ('Medical', 'Medical Leave (SL)'),
        ('Paid', 'Paid Leave'),
        ('Unpaid', 'Unpaid Leave'),
        ('Maternity', 'Maternity Leave'),
        ('Paternity', 'Paternity Leave'),
        ('WFH', 'Work From Home'),
        ('HalfDay', 'Half Day Leave'),
    )

    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leaves')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'leaves'

    def __str__(self):
        return f"{self.employee} - {self.leave_type} ({self.status})"


class Project(models.Model):
    STATUS_CHOICES = (
        ('Planning', 'Planning'),
        ('In-Progress', 'In-Progress'),
        ('Completed', 'Completed'),
        ('On-Hold', 'On-Hold'),
    )

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    client_name = models.CharField(max_length=100, blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='In-Progress')

    class Meta:
        db_table = 'projects'

    def __str__(self):
        return self.name


class EmployeeProject(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='project_assignments')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='team_members')
    role_in_project = models.CharField(max_length=100, default='Team Member')
    assigned_date = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'employee_projects'
        unique_together = ('employee', 'project')

    def __str__(self):
        return f"{self.employee.first_name} -> {self.project.name}"


class Salary(models.Model):
    PAYMENT_STATUS = (
        ('Paid', 'Paid'),
        ('Pending', 'Pending'),
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salaries')
    month = models.CharField(max_length=20)
    year = models.IntegerField()
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    bonuses = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='Pending')
    paid_on = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'salary'

    def __str__(self):
        return f"{self.employee} - {self.month} {self.year}: ${self.net_salary}"


class Performance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_reviews')
    review_period = models.CharField(max_length=50) # e.g. "Q1 2026", "2025 Annual"
    rating = models.IntegerField() # 1 to 5
    kpi_score = models.FloatField(default=0.0) # 0 to 100
    feedback = models.TextField()
    predicted_score = models.FloatField(null=True, blank=True) # Scikit-Learn predicted rating
    reviewed_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews_given')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'performance'

    def __str__(self):
        return f"{self.employee} - {self.review_period} Rating: {self.rating}"


class AILog(models.Model):
    AGENT_TYPES = (
        ('Attendance', 'Attendance Agent'),
        ('Leave', 'Leave Agent'),
        ('Payroll', 'Payroll Agent'),
        ('Performance', 'Performance Agent'),
        ('General', 'General AI Assistant'),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ai_queries')
    prompt = models.TextField()
    response = models.TextField()
    agent_type = models.CharField(max_length=30, choices=AGENT_TYPES, default='General')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_logs'

    def __str__(self):
        return f"[{self.agent_type}] {self.timestamp.strftime('%Y-%m-%d %H:%M')}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    recipient_role = models.CharField(max_length=20, default='All', blank=True, null=True) # 'Employee', 'HR', 'Manager', 'Admin', 'All'
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default='system')
    link = models.CharField(max_length=100, default='/leaves')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title} (Role: {self.recipient_role}, Read: {self.is_read})"


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_otps', null=True, blank=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='reset_otps', null=True, blank=True)
    email = models.EmailField()
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    attempt_count = models.IntegerField(default=0)

    class Meta:
        db_table = 'password_reset_otps'
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.email}: {self.otp_code} (Used: {self.used})"

