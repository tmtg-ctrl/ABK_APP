const createResponse = () => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
};

jest.mock('../modules/auth/auth.service', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  listEmployees: jest.fn()
}));

const authService = require('../modules/auth/auth.service');
const authController = require('../modules/auth/auth.controller');

describe('Auth Controller', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();
  });

  it('should return 400 if register data is missing', async () => {
    const req = { body: {} };
    const res = createResponse();

    await authController.register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email or phone and password are required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should register a user successfully', async () => {
    authService.registerUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      phone: '',
      app_metadata: { role: 'staff', department: 'marketing', position: 'Marketing Staff' },
      created_at: '2026-06-01T00:00:00Z'
    });
    const req = {
      body: {
        email: 'test@example.com',
        password: 'password123',
        department: 'marketing',
        position: 'Marketing Staff'
      }
    };
    const res = createResponse();

    await authController.register(req, res, next);

    expect(authService.registerUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      phone: undefined,
      password: 'password123',
      role: undefined,
      department: 'marketing',
      position: 'Marketing Staff'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User registered successfully',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        phone: '',
        role: 'staff',
        department: 'marketing',
        position: 'Marketing Staff',
        created_at: '2026-06-01T00:00:00Z'
      }
    });
  });

  it('should return 400 if login data is missing', async () => {
    const req = { body: {} };
    const res = createResponse();

    await authController.login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should login a user successfully', async () => {
    authService.loginUser.mockResolvedValue({
      session: { access_token: 'access', refresh_token: 'refresh' },
      user: {
        id: 'user-1',
        email: 'test@example.com',
        app_metadata: { role: 'admin', department: 'marketing', position: 'Marketing Lead' }
      }
    });
    const req = { body: { email: 'test@example.com', password: 'password123' } };
    const res = createResponse();

    await authController.login(req, res, next);

    expect(authService.loginUser).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Login successful',
      session: { access_token: 'access', refresh_token: 'refresh' },
      user: {
        id: 'user-1',
        email: 'test@example.com',
        app_metadata: { role: 'admin', department: 'marketing', position: 'Marketing Lead' },
        role: 'admin',
        department: 'marketing',
        position: 'Marketing Lead'
      }
    });
  });

  it('returns a minimal marketing directory to staff', async () => {
    authService.listEmployees.mockResolvedValue([{
      id: 'staff-1',
      email: 'staff@abk.vn',
      role: 'marketing_staff',
      department: 'marketing',
      position: 'Content',
      last_sign_in_at: 'private-value'
    }]);
    const req = {
      user: {
        id: 'staff-2',
        app_metadata: { role: 'marketing_staff', department: 'marketing' }
      }
    };
    const res = createResponse();

    await authController.listDirectory(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      total: 1,
      employees: [{
        id: 'staff-1',
        email: 'staff@abk.vn',
        role: 'marketing_staff',
        department: 'marketing',
        position: 'Content'
      }]
    });
  });
});
