# Django Backend Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Expose Django port
EXPOSE 8000

# Launch command using Gunicorn for production
CMD ["gunicorn", "hrms_backend.wsgi:application", "--bind", "0.0.0.0:8000"]

