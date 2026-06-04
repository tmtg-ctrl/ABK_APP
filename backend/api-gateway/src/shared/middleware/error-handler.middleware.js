const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Body must be valid JSON. In Postman, choose the method and URL above, then put only JSON in Body.',
        example: {
          email: 'test@example.com',
          password: '123456'
        },
        timestamp: new Date().toISOString()
      }
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: {
      status,
      message,
      requestedEmail: err.requestedEmail,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = errorHandler;
