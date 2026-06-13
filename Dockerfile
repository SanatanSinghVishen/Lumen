FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Use the PORT environment variable injected by Render, fallback to 8000 locally
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
