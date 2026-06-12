const supabase = require('../../config/supabase');

const DEPARTMENTS = new Set([
  'marketing'
]);

const ROLES = new Set([
  'admin',
  'marketing_manager',
  'marketing_staff',
  'staff'
]);

const normalizeText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
};

const normalizeRole = ({ role, department }) => {
  const normalizedRole = normalizeText(role) || 'staff';
  const normalizedDepartment = normalizeText(department);

  if (!ROLES.has(normalizedRole)) {
    const error = new Error(`Unsupported role: ${role}`);
    error.status = 400;
    throw error;
  }

  if (normalizedRole === 'staff' && normalizedDepartment === 'marketing') {
    return 'marketing_staff';
  }

  return normalizedRole;
};

const buildUserMetadata = ({ role = 'staff', department, position }) => {
  const normalizedDepartment = normalizeText(department);
  const normalizedRole = normalizeRole({ role, department });
  const metadata = {
    role: normalizedRole
  };

  if (normalizedDepartment) {
    if (!DEPARTMENTS.has(normalizedDepartment)) {
      const error = new Error(`Unsupported department: ${department}`);
      error.status = 400;
      throw error;
    }

    metadata.department = normalizedDepartment;
  }

  if (position) {
    metadata.position = position.trim();
  }

  return metadata;
};

const registerUser = async ({ email, phone, password, role = 'staff', department, position }) => {
  const payload = { password };
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  const appMetadata = buildUserMetadata({ role, department, position });

  const { data, error } = await supabase.auth.admin.createUser({
    ...payload,
    email_confirm: Boolean(email),
    app_metadata: appMetadata
  });

  if (error) {
    if (error.code === 'email_exists') {
      error.status = 409;
      error.message = `User already exists for email: ${email}`;
      error.requestedEmail = email;
    }

    throw error;
  }

  // Insert user into profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: data.user.id,
        email: data.user.email || email || '',
        phone: data.user.phone || phone || '',
        full_name: '',
        avatar_url: ''
      }
    ]);

  if (profileError) {
    throw profileError;
  }

  return data.user;
};

const loginUser = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
};

const normalizeEmployee = (user) => ({
  id: user.id,
  email: user.email || '',
  phone: user.phone || '',
  role: user.app_metadata?.role || 'staff',
  department: user.app_metadata?.department || null,
  position: user.app_metadata?.position || null,
  created_at: user.created_at,
  last_sign_in_at: user.last_sign_in_at || null
});

const listEmployees = async ({ department, role } = {}) => {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  const normalizedDepartment = normalizeText(department);
  const normalizedRole = normalizeText(role);

  return data.users
    .map(normalizeEmployee)
    .filter((employee) => {
      if (normalizedDepartment && employee.department !== normalizedDepartment) {
        return false;
      }

      if (normalizedRole && employee.role !== normalizedRole) {
        return false;
      }

      return true;
    });
};

const deleteUser = async (userId) => {
  const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(userId);

  if (getUserError || !userData?.user) {
    const error = getUserError || new Error('User not found');
    error.status = getUserError?.status || 404;
    throw error;
  }

  const employee = normalizeEmployee(userData.user);
  if (employee.role === 'admin') {
    const error = new Error('Admin accounts cannot be deleted from employee management');
    error.status = 400;
    throw error;
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    throw error;
  }

  await supabase.from('profiles').delete().eq('id', userId);
  return employee;
};

const deleteDepartmentEmployees = async (department) => {
  const employees = await listEmployees({ department });
  const targets = employees.filter((employee) => employee.role !== 'admin');
  const deleted = [];
  const failed = [];

  for (const employee of targets) {
    try {
      await deleteUser(employee.id);
      deleted.push(employee);
    } catch (error) {
      failed.push({
        id: employee.id,
        email: employee.email,
        error: error.message
      });
    }
  }

  return { deleted, failed };
};

const sendOtp = async ({ email, phone }) => {
  const payload = {};
  if (email) payload.email = email;
  if (phone) payload.phone = phone;

  const { data, error } = await supabase.auth.signInWithOtp(payload);

  if (error) {
    throw error;
  }

  return data;
};

const verifyOtp = async ({ email, phone, token, type }) => {
  const payload = { token, type };
  if (email) payload.email = email;
  if (phone) payload.phone = phone;

  const { data, error } = await supabase.auth.verifyOtp(payload);

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  registerUser,
  loginUser,
  listEmployees,
  deleteUser,
  deleteDepartmentEmployees,
  sendOtp,
  verifyOtp
};
