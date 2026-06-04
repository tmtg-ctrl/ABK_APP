const app = require('./app');

const PORT = process.env.PORT || 3000;

// Debug: Check environment variables
console.log('=== Environment Variables ===');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Loaded' : '✗ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('==============================');

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

module.exports = app;
