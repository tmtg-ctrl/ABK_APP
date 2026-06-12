const {
  registerUser,
  loginUser,
  listEmployees,
  deleteUser,
  deleteDepartmentEmployees,
  sendOtp,
  verifyOtp
} = require('./auth.service');

const MANAGER_ROLES = new Set(['admin', 'marketing_manager']);

exports.register = async (req, res, next) => {
  try {
    const { email, phone, password, role, department, position } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ error: 'Email or phone and password are required' });
    }

    const user = await registerUser({ email, phone, password, role, department, position });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.app_metadata?.role,
        department: user.app_metadata?.department,
        position: user.app_metadata?.position,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const data = await loginUser({ email, password });

    res.status(200).json({
      message: 'Login successful',
      session: data.session,
      user: {
        ...data.user,
        role: data.user.app_metadata?.role || 'staff',
        department: data.user.app_metadata?.department || null,
        position: data.user.app_metadata?.position || null
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.listEmployees = async (req, res, next) => {
  try {
    const role = req.user?.app_metadata?.role;
    const department = req.user?.app_metadata?.department;

    if (!MANAGER_ROLES.has(role)) {
      return res.status(403).json({ error: 'Manager permission required' });
    }

    const requestedDepartment = role === 'admin'
      ? req.query.department
      : department;
    const employees = await listEmployees({
      department: requestedDepartment,
      role: req.query.role
    });

    res.status(200).json({
      total: employees.length,
      employees
    });
  } catch (error) {
    next(error);
  }
};

exports.listDirectory = async (req, res, next) => {
  try {
    const role = req.user?.app_metadata?.role;
    const department = req.user?.app_metadata?.department;
    const isMarketingUser = role === 'admin' || department === 'marketing';

    if (!isMarketingUser) {
      return res.status(403).json({ error: 'Marketing department access required' });
    }

    const employees = await listEmployees({ department: 'marketing' });
    const directory = employees.map((employee) => ({
      id: employee.id,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      position: employee.position
    }));

    res.status(200).json({
      total: directory.length,
      employees: directory
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const employee = await deleteUser(req.params.userId);
    res.status(200).json({
      message: 'Employee account deleted successfully',
      employee
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteMarketingDepartment = async (req, res, next) => {
  try {
    if (req.body.confirmation !== 'DELETE_MARKETING') {
      return res.status(400).json({ error: 'confirmation must be DELETE_MARKETING' });
    }

    const result = await deleteDepartmentEmployees('marketing');
    res.status(result.failed.length ? 207 : 200).json({
      message: `Deleted ${result.deleted.length} Marketing account(s)`,
      deleted: result.deleted,
      failed: result.failed
    });
  } catch (error) {
    next(error);
  }
};

exports.sendOtp = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    const data = await sendOtp({ email, phone });

    res.status(200).json({
      message: 'OTP sent successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, phone, token, type } = req.body;

    if ((!email && !phone) || !token || !type) {
      return res.status(400).json({ error: 'Email or phone, token and type are required' });
    }

    const data = await verifyOtp({ email, phone, token, type });

    res.status(200).json({
      message: 'OTP verified successfully',
      session: data.session,
      user: data.user
    });
  } catch (error) {
    next(error);
  }
};
