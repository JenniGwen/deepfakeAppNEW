FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7860

# Setting PYTHONPATH so python can find the BackEnd modules
ENV PYTHONPATH=/app/BackEnd
CMD ["python", "BackEnd/run.py"]