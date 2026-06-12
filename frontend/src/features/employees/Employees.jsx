import { useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck, Trash2, UserPlus, Users, X } from 'lucide-react';
import { EmptyState } from '../../shared/components/EmptyState';
import { InlineError } from '../../shared/components/InlineError';
import { Modal } from '../../shared/components/Modal';
import { ROLE_OPTIONS } from '../../shared/constants/marketing';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import { apiRequest } from '../../shared/services/api';

const roleLabels = {
  marketing_manager: 'Marketing Manager',
  marketing_staff: 'Marketing Staff',
  staff: 'Staff'
};

export function Employees({ employees, token, onChanged }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    email: '',
    password: '123456',
    role: 'marketing_staff',
    position: 'Marketing Staff'
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const selectableEmployees = employees.filter((employee) => employee.role !== 'admin');
  const allSelected = Boolean(selectableEmployees.length)
    && selectableEmployees.every((employee) => selectedIds.includes(employee.id));

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
      setShowCreate(false);
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
      setSelectedIds((current) => current.filter((id) => id !== employee.id));
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId('');
    }
  };

  const toggleSelected = (employeeId) => {
    setSelectedIds((current) => (
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    ));
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : selectableEmployees.map((employee) => employee.id));
  };

  const removeSelectedEmployees = async () => {
    const selectedEmployees = employees.filter((employee) => selectedIds.includes(employee.id));
    if (!selectedEmployees.length) return;

    const confirmed = window.confirm(
      `Xoa vinh vien ${selectedEmployees.length} tai khoan da chon?\n\n${selectedEmployees.map((employee) => employee.email).join('\n')}`
    );
    if (!confirmed) return;

    setDeletingSelected(true);
    setError('');
    setMessage('');
    try {
      const result = await apiRequest('/controller/user/employees/delete-selected', {
        method: 'POST',
        token,
        body: { user_ids: selectedEmployees.map((employee) => employee.id) }
      });
      const deletedIds = new Set((result.deleted || []).map((employee) => employee.id));
      const failedCount = result.failed?.length || 0;
      setSelectedIds((current) => current.filter((id) => !deletedIds.has(id)));
      setMessage(`Da xoa ${deletedIds.size} tai khoan.${failedCount ? ` ${failedCount} tai khoan khong xoa duoc.` : ''}`);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingSelected(false);
    }
  };

  const removeMarketingDepartment = async () => {
    const confirmation = window.prompt(
      `Thao tac nay se xoa vinh vien ${selectableEmployees.length} tai khoan Marketing. Nhap DELETE_MARKETING de xac nhan.`
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
      setSelectedIds([]);
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
          <span className="eyebrow">{t('employee.adminOnly')}</span>
          <h3>Quan ly tai khoan Marketing</h3>
          <p>Admin tao dung vai tro, xoa tai khoan cu va phan cong lai cong viec khi nhan su thay doi.</p>
        </div>
        <div className="employee-heading-actions">
          <span className="employee-admin-badge"><ShieldCheck size={16} /> Quyen Admin</span>
          <button
            type="button"
            className="primary-action"
            onClick={() => {
              setError('');
              setMessage('');
              setShowCreate(true);
            }}
          >
            <UserPlus size={17} />
            Them nhan vien
          </button>
        </div>
      </section>

      {(error || message) && (
        error ? <InlineError message={error} /> : <div className="employee-success">{message}</div>
      )}

      <div className="employees-layout employee-directory-layout">
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Danh ba Marketing</span>
              <h3>{employees.length} tai khoan</h3>
            </div>
            <div className="employee-list-actions">
              <label className="employee-select-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={!selectableEmployees.length || deletingSelected || deletingAll}
                />
                Chon tat ca
              </label>
              {selectedIds.length > 0 && (
                <>
                  <span className="count-pill">{selectedIds.length} da chon</span>
                  <button
                    type="button"
                    className="text-action employee-clear-selection"
                    onClick={() => setSelectedIds([])}
                    disabled={deletingSelected}
                  >
                    <X size={14} />
                    Bo chon
                  </button>
                  <button
                    type="button"
                    className="danger-action compact-action"
                    onClick={removeSelectedEmployees}
                    disabled={deletingSelected || deletingAll}
                  >
                    {deletingSelected ? <RefreshCw className="spin" size={14} /> : <Trash2 size={14} />}
                    Xoa da chon
                  </button>
                </>
              )}
              {!selectedIds.length && <Users size={19} />}
            </div>
          </div>
          <div className="employee-list">
            {employees.map((employee) => (
              <div
                className={`employee-row employee-management-row${selectedIds.includes(employee.id) ? ' selected' : ''}`}
                key={employee.id}
              >
                <label className="employee-row-select" title={employee.role === 'admin' ? 'Khong the xoa tai khoan Admin' : 'Chon tai khoan'}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(employee.id)}
                    onChange={() => toggleSelected(employee.id)}
                    disabled={employee.role === 'admin' || deletingSelected || deletingAll}
                    aria-label={`Chon ${employee.email}`}
                  />
                </label>
                <div className="avatar">{employee.email.slice(0, 1).toUpperCase()}</div>
                <div className="employee-row-copy">
                  <strong>{employee.email}</strong>
                  <span>{roleLabels[employee.role] || employee.role} - {employee.position || 'Chua co chuc danh'}</span>
                </div>
                <button
                  type="button"
                  className="danger-action compact-action"
                  disabled={employee.role === 'admin' || deletingId === employee.id || deletingSelected || deletingAll}
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
          disabled={!selectableEmployees.length || deletingAll || deletingSelected}
          onClick={removeMarketingDepartment}
        >
          {deletingAll ? <RefreshCw className="spin" size={16} /> : <Trash2 size={16} />}
          Xoa toan bo Marketing
        </button>
      </section>

      {showCreate && (
        <Modal
          title="Them nhan vien Marketing"
          description="Tao tai khoan dang nhap va gan dung vai tro cho nhan vien moi."
          eyebrow="Tai khoan moi"
          className="create-modal employee-create-modal"
          onClose={() => !saving && setShowCreate(false)}
        >
          <form className="form-stack create-form" onSubmit={submit}>
            <label>
              Email dang nhap
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                autoFocus
                required
              />
            </label>
            <label>
              Mat khau tam thoi
              <input
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                minLength="6"
              />
            </label>
            <div className="two-column">
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
            </div>
            {error && <InlineError message={error} />}
            <div className="employee-modal-actions">
              <button type="button" className="secondary-action" onClick={() => setShowCreate(false)} disabled={saving}>
                Huy
              </button>
              <button className="primary-action" disabled={saving}>
                {saving ? <RefreshCw className="spin" size={18} /> : <UserPlus size={18} />}
                Tao tai khoan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
