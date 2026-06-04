import { useState } from 'react';
import { RefreshCw, UserPlus } from 'lucide-react';
import { EmptyState } from '../../shared/components/EmptyState';
import { InlineError } from '../../shared/components/InlineError';
import { ROLE_OPTIONS } from '../../shared/constants/marketing';
import { apiRequest } from '../../shared/services/api';

export function Employees({ employees, token, onCreated }) {
  const [form, setForm] = useState({
    email: '',
    password: '123456',
    role: 'marketing_staff',
    position: 'Marketing Staff'
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiRequest('/controller/user/create-user', {
        method: 'POST',
        token,
        body: {
          ...form,
          department: 'marketing'
        }
      });
      setForm({ ...form, email: '' });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="employees-layout">
      <section className="panel">
        <div className="section-heading">
          <h3>Marketing Employees</h3>
          <span className="count-pill">{employees.length}</span>
        </div>
        <div className="employee-list">
          {employees.map((employee) => (
            <div className="employee-row" key={employee.id}>
              <div className="avatar">{employee.email.slice(0, 1).toUpperCase()}</div>
              <div>
                <strong>{employee.email}</strong>
                <span>{employee.role} - {employee.position || 'No position'}</span>
              </div>
            </div>
          ))}
          {!employees.length && <EmptyState text="No employees found." />}
        </div>
      </section>
      <section className="panel">
        <div className="section-heading">
          <h3>Create Employee</h3>
          <UserPlus size={19} />
        </div>
        <form className="form-stack" onSubmit={submit}>
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label>
            Temporary password
            <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              {ROLE_OPTIONS.map((role) => (
                <option value={role} key={role}>{role}</option>
              ))}
            </select>
          </label>
          <label>
            Position
            <input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} />
          </label>
          {error && <InlineError message={error} />}
          <button className="primary-action" disabled={saving}>
            {saving ? <RefreshCw className="spin" size={18} /> : <UserPlus size={18} />}
            Create employee
          </button>
        </form>
      </section>
    </div>
  );
}
