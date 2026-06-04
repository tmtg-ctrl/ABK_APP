import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { InlineError } from '../../shared/components/InlineError';
import {
  MARKETING_TEAMS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  WORK_TYPES_BY_TEAM,
  priorityLabels,
  statusLabels,
  teamLabels,
  workTypeLabels
} from '../../shared/constants/marketing';
import { apiRequest } from '../../shared/services/api';

export function TaskDetail({ task, employees, isManager, token, currentUser, onChanged }) {
  const [form, setForm] = useState({
    status: task.status,
    priority: task.priority,
    team: task.team || 'media',
    work_type: task.work_type || WORK_TYPES_BY_TEAM[task.team || 'media']?.[0] || '',
    deadline: task.deadline || '',
    assignee_id: task.assignee_id || ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      status: task.status,
      priority: task.priority,
      team: task.team || 'media',
      work_type: task.work_type || WORK_TYPES_BY_TEAM[task.team || 'media']?.[0] || '',
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
          team: form.team,
          work_type: form.work_type,
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
        <Badge value={teamLabels[task.team] || task.team || 'Media'} />
        {task.work_type && <Badge value={workTypeLabels[task.work_type] || task.work_type} />}
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
        <div className="two-column">
          <label>
            Team
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
            Work type
            <select value={form.work_type} onChange={(event) => setForm({ ...form, work_type: event.target.value })}>
              {(WORK_TYPES_BY_TEAM[form.team] || []).map((workType) => (
                <option value={workType} key={workType}>{workTypeLabels[workType]}</option>
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
