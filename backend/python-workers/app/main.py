import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid

# Import task handlers
from app.tasks.data_processor import process_data
from app.utils.logger import setup_logger
from app.utils.redis_client import redis_client

# Setup logger
logger = setup_logger(__name__)

app = Flask(__name__)
CORS(app)

# Store task results (in production, use Redis or database)
task_store = {}

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'service': 'Python Workers',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@app.route('/tasks', methods=['POST'])
def submit_task():
    """Submit a task to be processed"""
    try:
        data = request.get_json()
        task_type = data.get('taskType')
        task_data = data.get('data')

        if not task_type or not task_data:
            return jsonify({'error': 'taskType and data are required'}), 400

        task_id = str(uuid.uuid4())
        
        # Process task based on type
        if task_type == 'data_processing':
            result = process_data(task_data)
        else:
            return jsonify({'error': f'Unknown task type: {task_type}'}), 400

        # Store result
        task_store[task_id] = {
            'taskId': task_id,
            'taskType': task_type,
            'status': 'completed',
            'result': result,
            'createdAt': datetime.utcnow().isoformat()
        }

        logger.info(f'Task {task_id} completed successfully')

        return jsonify({
            'taskId': task_id,
            'status': 'submitted'
        }), 200

    except Exception as e:
        logger.error(f'Error submitting task: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/tasks/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """Get status of a submitted task"""
    try:
        if task_id in task_store:
            return jsonify(task_store[task_id]), 200
        else:
            return jsonify({'error': 'Task not found'}), 404
    except Exception as e:
        logger.error(f'Error getting task status: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/tasks', methods=['GET'])
def list_tasks():
    """List all tasks"""
    try:
        tasks = list(task_store.values())
        return jsonify({
            'total': len(tasks),
            'tasks': tasks
        }), 200
    except Exception as e:
        logger.error(f'Error listing tasks: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.errorhandler(Exception)
def handle_error(error):
    """Global error handler"""
    logger.error(f'Unhandled error: {str(error)}')
    return jsonify({
        'error': str(error),
        'timestamp': datetime.utcnow().isoformat()
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
