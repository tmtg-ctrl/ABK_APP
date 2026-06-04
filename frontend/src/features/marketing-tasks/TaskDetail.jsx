import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { InlineError } from '../../shared/components/InlineError';
import { PRIORITY_OPTIONS, STATUS_OPTIONS, priorityLabels, statusLabels } from '../../shared/constants/marketing';
import { apiRequest } from '../../shared/services/api';

export function TaskDetail({ task, employees, isManager, token, currentUser, onChanged }) {
  const [form, setForm] = useState({
    status: task.status,
    priority: task.priority,
    deadline: task.deadline || '',
    assignee_id: task.assignee_id || ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      status: task.status,
      priority: task.priority,
      deadline: task.deadline || '',
      assignee_id: task.assignee_id || ''
    });
  }, [task.id]);

  const save = async () => {
    setError('');
    try {
      await apiRequest(`/api/marketing/tasks/${task.id}`, {
        method: 'PUT',
        token,
        body: {
          status: form.status,
          priority: form.priority,
          deadline: form.deadline,
          assignee_id: isManager ? form.assignee_id || null : undefined
        }
      });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const assignee = employees.find((employee) => employee.id === task.assignee_id);

  return (
    <div className="detail-stack">
      <div>
        <span className="eyebrow">Task detail</span>
        <h3>{task.title}</h3>
        <p>{task.description || 'No description'}</p>
      </div>
      <div className="detail-meta">
        <Badge value={task.status} />
        <Badge value={task.priority} tone={task.priority} />
        <span>{task.deadline || 'No deadline'}</span>
      </div>
      <div className="form-stack">
        <div className="two-column">
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              {STATUS_OPTIONS.map((status) => (
                <option value={status} key={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              {PRIORITY_OPTIONS.map((priority) => (
                <option value={priority} key={priority}>{priorityLabels[priority]}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Deadline
          <input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
        </label>
        {isManager ? (
          <label>
            Assignee
            <select value={form.assignee_id} onChange={(event) => setForm({ ...form, assignee_id: event.target.value })}>
              <option value="">Unassigned</option>
              {employees.map((employee) => (
                <option value={employee.id} key={employee.id}>{employee.email}</option>
              ))}
            </select>
          </label>
        ) : (
          <div className="read-only-line">
            <span>Assignee</span>
            <strong>{assignee?.email || (task.assignee_id === currentUser.id ? currentUser.email : 'Unassigned')}</strong>
          </div>
        )}
        {error && <InlineError message={error} />}
        <button className="primary-action" onClick={save}>
          <CheckCircle2 size={18} />
          Save changes
        </button>
      </div>
    </div>
  );
}
