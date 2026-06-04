"""
Redis client configuration for Python workers
"""
import redis
import os
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

try:
    redis_client = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', 6379)),
        db=int(os.getenv('REDIS_DB', 0)),
        decode_responses=True
    )
    redis_client.ping()
    logger.info('Redis connection established')
except Exception as e:
    logger.warning(f'Redis connection failed: {str(e)}. Using fallback mode.')
    redis_client = None
