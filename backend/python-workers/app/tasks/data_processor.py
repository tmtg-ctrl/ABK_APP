"""
Data processing tasks for Python workers
"""
import logging

logger = logging.getLogger(__name__)

def process_data(data):
    """
    Process data task
    
    Args:
        data: Dictionary containing data to process
        
    Returns:
        Processed result
    """
    try:
        # Example: simple data transformation
        result = {
            'original': data,
            'processed': True,
            'itemCount': len(data) if isinstance(data, (list, dict)) else 0,
            'message': 'Data processed successfully'
        }
        
        logger.info(f'Data processing completed: {result}')
        return result
        
    except Exception as e:
        logger.error(f'Error processing data: {str(e)}')
        raise

def heavy_computation(parameters):
    """
    Example heavy computation task
    """
    try:
        # Add your heavy computation logic here
        result = sum(parameters.get('values', []))
        return {'result': result}
    except Exception as e:
        logger.error(f'Error in heavy computation: {str(e)}')
        raise
