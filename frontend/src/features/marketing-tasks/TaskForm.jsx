import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { InlineError } from '../../shared/components/InlineError';
import { EmployeeMultiSelect } from '../../shared/components/EmployeeMultiSelect';
import {
  MARKETING_TEAMS,
  PRIORITY_OPTIONS,
  WORK_TYPES_BY_TEAM,
  priorityLabels,
  teamLabels,
  workTypeLabels
} from '../../shared/constants/marketing';
import { apiRequest } from '../../shared/services/api';

export function TaskForm({ employees, isManager, token, currentUser, onSaved }) {
  const directory = employees.some((employee) => employee.id === currentUser.id)
    ? employees
    : [...employees, {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        position: currentUser.position
      }];
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    team: 'media',
    work_type: 'photo_shoot',
    deadline: '',
    assignee_id: currentUser.id,
    collaborator_ids: [],
    status: 'todo'
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiRequest('/api/marketing/tasks', {
        method: 'POST',
        token,
        body: {
          ...form,
          assignee_id: form.assignee_id || currentUser.id,
          owner_name: directory.find((employee) => employee.id === form.assignee_id)?.email || currentUser.email,
          collaborator_ids: form.collaborator_ids
        }
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-stack create-form" onSubmit={submit}>
      <label>
        Ten cong viec
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
      </label>
      <label>
        Mo ta / ket qua mong muon
        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </label>
      <div className="two-column">
        <label>
          Team phu trach
          <select
            value={form.team}
            onChange={(event) => {
              const team = event.target.value;
              setForm({
                ...form,
                team,
                work_type: WORK_TYPES_BY_TEAM[team]?.[0] || ''
              });
            }}
          >
            {MARKETING_TEAMS.map((team) => (
              <option value={team} key={team}>{teamLabels[team]}</option>
            ))}
          </select>
        </label>
        <label>
          Loai cong viec
          <select value={form.work_type} onChange={(event) => setForm({ ...form, work_type: event.target.value })}>
            {(WORK_TYPES_BY_TEAM[form.team] || []).map((workType) => (
              <option value={workType} key={workType}>{workTypeLabels[workType]}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="two-column">
        <label>
          Muc do uu tien
          <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            {PRIORITY_OPTIONS.map((priority) => (
              <option value={priority} key={priority}>{priorityLabels[priority]}</option>
            ))}
          </select>
        </label>
        <label>
          Han hoan thanh
          <input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
        </label>
      </div>
      {isManager && (
        <label>
          Nguoi phu trach chinh
          <select
            value={form.assignee_id}
            onChange={(event) => setForm({
              ...form,
              assignee_id: event.target.value,
              collaborator_ids: form.collaborator_ids.filter((id) => id !== event.target.value)
            })}
          >
            {directory.map((employee) => (
              <option value={employee.id} key={employee.id}>{employee.email}</option>
            ))}
          </select>
        </label>
      )}
      {!isManager && (
        <div className="read-only-line">
          <span>Nguoi phu trach chinh</span>
          <strong>{currentUser.email}</strong>
        </div>
      )}
      <div className="read-only-line">
        <span>Nguoi tao / nguoi giao</span>
        <strong>{currentUser.email}</strong>
      </div>
      <EmployeeMultiSelect
        employees={directory}
        selectedIds={form.collaborator_ids}
        excludedIds={[form.assignee_id]}
        onChange={(collaboratorIds) => setForm({ ...form, collaborator_ids: collaboratorIds })}
      />
      {error && <InlineError message={error} />}
      <button className="primary-action" disabled={saving}>
        {saving ? <RefreshCw className="spin" size={18} /> : <Plus size={18} />}
        Tao Task
      </button>
    </form>
  );
}
