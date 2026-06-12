import { useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { EmptyState } from '../../shared/components/EmptyState';
import { InlineError } from '../../shared/components/InlineError';
import { ROLE_OPTIONS } from '../../shared/constants/marketing';
import { apiRequest } from '../../shared/services/api';

const roleLabels = {
  marketing_manager: 'Marketing Manager',
  marketing_staff: 'Marketing Staff',
  staff: 'Staff'
};

export function Employees({ employees, token, onChanged }) {
  const [form, setForm] = useState({
    email: '',
    password: '123456',
    role: 'marketing_staff',
    position: 'Marketing Staff'
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

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
      setMessage('Da tao tai khoan Marketing moi.');
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeEmployee = async (employee) => {
    const confirmed = window.confirm(
      `Xoa vinh vien tai khoan ${employee.email}? Du lieu Task/Campaign van duoc giu lai de admin phan cong lai.`
    );
    if (!confirmed) return;

    setDeletingId(employee.id);
    setError('');
    setMessage('');
    try {
      await apiRequest(`/controller/user/employees/${employee.id}`, {
        method: 'DELETE',
        token
      });
      setMessage(`Da xoa ${employee.email}.`);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId('');
    }
  };

  const removeMarketingDepartment = async () => {
    const confirmation = window.prompt(
      `Thao tac nay se xoa vinh vien ${employees.length} tai khoan Marketing. Nhap DELETE_MARKETING de xac nhan.`
    );
    if (confirmation !== 'DELETE_MARKETING') return;

    setDeletingAll(true);
    setError('');
    setMessage('');
    try {
      const result = await apiRequest('/controller/user/employees/delete-marketing', {
        method: 'POST',
        token,
        body: { confirmation }
      });
      const failedCount = result.failed?.length || 0;
      setMessage(`Da xoa ${result.deleted?.length || 0} tai khoan.${failedCount ? ` ${failedCount} tai khoan loi.` : ''}`);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="employee-management">
      <section className="employee-management-heading">
        <div>
          <span className="eyebrow">Admin only</span>
          <h3>Quan ly tai khoan Marketing</h3>
          <p>Admin tao dung vai tro, xoa tai khoan cu va phan cong lai cong viec khi nhan su thay doi.</p>
        </div>
        <span className="employee-admin-badge"><ShieldCheck size={16} /> Quyen Admin</span>
      </section>

      {(error || message) && (
        error ? <InlineError message={error} /> : <div className="employee-success">{message}</div>
      )}

      <div className="employees-layout">
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Danh ba Marketing</span>
              <h3>{employees.length} tai khoan</h3>
            </div>
            <Users size={19} />
          </div>
          <div className="employee-list">
            {employees.map((employee) => (
              <div className="employee-row employee-management-row" key={employee.id}>
                <div className="avatar">{employee.email.slice(0, 1).toUpperCase()}</div>
                <div>
                  <strong>{employee.email}</strong>
                  <span>{roleLabels[employee.role] || employee.role} - {employee.position || 'Chua co chuc danh'}</span>
                </div>
                <button
                  type="button"
                  className="danger-action compact-action"
                  disabled={deletingId === employee.id || deletingAll}
                  onClick={() => removeEmployee(employee)}
                >
                  {deletingId === employee.id ? <RefreshCw className="spin" size={14} /> : <Trash2 size={14} />}
                  Xoa
                </button>
              </div>
            ))}
            {!employees.length && <EmptyState text="Phong Marketing chua co tai khoan." />}
          </div>
        </section>

        <section className="panel employee-create-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Tao tai khoan</span>
              <h3>Nhan su Marketing moi</h3>
            </div>
            <UserPlus size={19} />
          </div>
          <form className="form-stack create-form" onSubmit={submit}>
            <label>
              Email dang nhap
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </label>
            <label>
              Mat khau tam thoi
              <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength="6" />
            </label>
            <label>
              Vai tro
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                {ROLE_OPTIONS.map((role) => (
                  <option value={role} key={role}>{roleLabels[role] || role}</option>
                ))}
              </select>
            </label>
            <label>
              Chuc danh / vi tri
              <input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} />
            </label>
            <button className="primary-action" disabled={saving}>
              {saving ? <RefreshCw className="spin" size={18} /> : <UserPlus size={18} />}
              Tao tai khoan
            </button>
          </form>
        </section>
      </div>

      <section className="panel employee-danger-zone">
        <div>
          <AlertTriangle size={20} />
          <span>
            <strong>Xoa toan bo tai khoan phong Marketing</strong>
            <small>Admin va du lieu Campaign/Task duoc giu lai. Cac Task cu can duoc giao lai cho tai khoan moi.</small>
          </span>
        </div>
        <button
          type="button"
          className="danger-action"
          disabled={!employees.length || deletingAll}
          onClick={removeMarketingDepartment}
        >
          {deletingAll ? <RefreshCw className="spin" size={16} /> : <Trash2 size={16} />}
          Xoa toan bo Marketing
        </button>
      </section>
    </div>
  );
}
