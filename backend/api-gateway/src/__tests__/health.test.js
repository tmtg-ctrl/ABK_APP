process.env.SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

const request = require('supertest');
const app = require('../app');

describe('GET /api/health', () => {
  it('should return 200 and service status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'OK',
      service: 'API Gateway'
    });
    expect(typeof response.body.timestamp).toBe('string');
  });
});
