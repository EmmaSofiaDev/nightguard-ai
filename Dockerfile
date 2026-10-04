FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Generate sample dataset if not present
RUN python backend/synthetic_data.py

# Expose port (Render dynamically sets $PORT)
ENV PORT=8000
EXPOSE 8000

CMD ["python", "run.py"]
