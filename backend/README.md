# ABK Backend - Microservices Architecture

## Overview
This backend uses a microservices architecture with:
- **API Gateway**: Node.js/Express service handling HTTP requests
- **Python Workers**: Python/Flask service for heavy computations and data processing
- **Redis**: Message queue and caching layer

## Directory Structure
```
backend/
├── api-gateway/           # Node.js API Gateway
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Express middleware
│   │   └── utils/        # Utility functions
│   ├── config/           # Configuration files
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── python-workers/        # Python Workers Service
│   ├── app/
│   │   ├── tasks/        # Task handlers
│   │   ├── utils/        # Utility functions
│   │   └── main.py       # Flask app
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml     # Docker orchestration
└── README.md
```

## Quick Start

### Prerequisites
- Docker & Docker Compose (Recommended)
- Node.js 18+ (if running locally)
- Python 3.11+ (if running locally)
- Redis (if running locally)

### Using Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- API Gateway: http://localhost:3000
- Python Workers: http://localhost:5000
- Redis: localhost:6379

### Running Locally

#### 1. Start Redis
```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine
```

#### 2. Start Python Workers
```bash
cd python-workers
cp .env.example .env
pip install -r requirements.txt
python app/main.py
```

#### 3. Start API Gateway
```bash
cd api-gateway
cp .env.example .env
npm install
npm run dev
```

## API Endpoints

### Health Check
```bash
GET /api/health
```

### Submit Task
```bash
POST /api/tasks/submit
Content-Type: application/json

{
  "taskType": "data_processing",
  "data": {
    "key": "value"
  }
}
```

### Get Task Status
```bash
GET /api/tasks/{taskId}
```

### List All Tasks
```bash
GET /api/tasks
```

## Adding New Tasks

1. Create a new task handler in `python-workers/app/tasks/`
2. Update `app/main.py` to handle the new task type
3. Call it from the API Gateway

Example:
```python
# python-workers/app/tasks/analysis.py
def analyze_data(data):
    # Your analysis logic
    return result
```

Then in `main.py`:
```python
if task_type == 'analysis':
    result = analyze_data(task_data)
```

## Environment Variables

See `.env.example` files in each service directory for all available options.

## Scaling

- **Horizontal Scaling**: Use load balancers to distribute requests across multiple API Gateway instances
- **Task Queue**: Use Celery with Redis to distribute heavy tasks across multiple Python Workers
- **Caching**: Redis stores frequently accessed data
- **Database**: Add PostgreSQL/MongoDB for persistent data storage

## Development

### Format Code
```bash
# Node.js (API Gateway)
cd api-gateway && npm run lint

# Python (Workers)
cd python-workers && black app/ && flake8 app/
```

## Production Deployment

- Use managed services (AWS ECS, Google Cloud Run, Azure Container Instances)
- Implement monitoring (Prometheus, ELK Stack)
- Use CI/CD pipeline (GitHub Actions, GitLab CI)
- Enable SSL/TLS certificates
- Set up auto-scaling policies
- Use load balancing
- Implement proper logging and monitoring

## Troubleshooting

### Connection Refused
- Ensure Redis is running
- Check service names in docker-compose.yml match your setup

### Task Not Processing
- Check Python Workers logs: `docker-compose logs python-workers`
- Verify task type is handled in `main.py`

### High Memory Usage
- Monitor Redis memory
- Implement task cleanup policies
- Use connection pooling

## License
[Your License]
