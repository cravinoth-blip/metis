# Use a slim Python image for a smaller footprint
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install system dependencies (gcc is often needed for certain Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first to leverage Docker layer caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory
# This includes main.py, your templates/ folder, and any other subdirectories
COPY backend/ .

# Create the data directory and set up a non-root user for security
RUN mkdir -p /app/data && \
    useradd -m appuser && \
    chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

EXPOSE 8000

# Run the FastAPI server using Uvicorn
# Your templates will be accessible at /app/templates inside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
