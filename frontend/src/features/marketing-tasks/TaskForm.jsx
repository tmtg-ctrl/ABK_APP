import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { InlineError } from '../../shared/components/InlineError';
import { PRIORITY_OPTIONS, priorityLabels } from '../../shared/constants/marketing';
import { apiRequest } from '../../shared/services/api';

export function TaskForm({ employees, isManager, token, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    assignee_id: '',
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
          assignee_id: form.assignee_id || undefined
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
    <form className="form-stack" onSubmit={submit}>
      <label>
        Title
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
      </label>
      <label>
        Description
        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </label>
      <div className="two-column">
        <label>
          Priority
          <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            {PRIORITY_OPTIONS.map((priority) => (
              <option value={priority} key={priority}>{priorityLabels[priority]}</option>
            ))}
          </select>
        </label>
        <label>
          Deadline
          <input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
        </label>
      </div>
      {isManager && (
        <label>
          Assignee
          <select value={form.assignee_id} onChange={(event) => setForm({ ...form, assignee_id: event.target.value })}>
            <option value="">Unassigned</option>
            {employees.map((employee) => (
              <option value={employee.id} key={employee.id}>{employee.email}</option>
            ))}
          </select>
        </label>
      )}
      {error && <InlineError message={error} />}
      <button className="primary-action" disabled={saving}>
        {saving ? <RefreshCw className="spin" size={18} /> : <Plus size={18} />}
        Create task
      </button>
    </form>
  );
}
