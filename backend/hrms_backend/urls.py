from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root_view(request):
    return JsonResponse({
        "status": "online",
        "system": "AI-Powered Employee Management System API",
        "version": "1.0.0",
        "endpoints": {
            "api_root": "/api/",
            "admin": "/admin/",
            "analytics": "/api/analytics/dashboard/",
            "auth_login": "/api/auth/login/",
            "ai_agent": "/api/ai/agent/"
        }
    })

urlpatterns = [
    path('', api_root_view, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
]

