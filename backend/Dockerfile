FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway 默认监听 8080 端口
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
