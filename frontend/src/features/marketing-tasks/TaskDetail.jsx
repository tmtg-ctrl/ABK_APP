import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { InlineError } from '../../shared/components/InlineError';
import { EmployeeMultiSelect } from '../../shared/components/EmployeeMultiSelect';
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
  const directory = employees.some((employee) => employee.id === currentUser.id)
    ? employees
    : [...employees, {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        position: currentUser.position
      }];
  const canCoordinate = isManager || task.created_by === currentUser.id || task.assignee_id === currentUser.id;
  const [form, setForm] = useState({
    status: task.status,
    priority: task.priority,
    team: task.team || 'media',
    work_type: task.work_type || WORK_TYPES_BY_TEAM[task.team || 'media']?.[0] || '',
    deadline: task.deadline || '',
    assignee_id: task.assignee_id || '',
    collaborator_ids: task.collaborator_ids || []
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      status: task.status,
      priority: task.priority,
      team: task.team || 'media',
      work_type: task.work_type || WORK_TYPES_BY_TEAM[task.team || 'media']?.[0] || '',
      deadline: task.deadline || '',
      assignee_id: task.assignee_id || '',
      collaborator_ids: task.collaborator_ids || []
    });
  }, [task.id]);

  const save = async () => {
    setError('');
    try {
      await apiRequest(`/api/marketing/tasks/${task.id}`, {
        method: 'PUT',
        token,
        body: canCoordinate ? {
          status: form.status,
          priority: form.priority,
          team: form.team,
          work_type: form.work_type,
          deadline: form.deadline,
          assignee_id: isManager ? form.assignee_id || null : undefined,
          owner_name: isManager
            ? directory.find((employee) => employee.id === form.assignee_id)?.email || ''
            : undefined,
          collaborator_ids: form.collaborator_ids
        } : {
          status: form.status
        }
      });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const assignee = directory.find((employee) => employee.id === task.assignee_id);
  const creator = directory.find((employee) => employee.id === task.created_by);
  const assigner = directory.find((employee) => employee.id === task.assigned_by_id);

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
            <select disabled={!canCoordinate} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
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
              disabled={!canCoordinate}
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
            <select disabled={!canCoordinate} value={form.work_type} onChange={(event) => setForm({ ...form, work_type: event.target.value })}>
              {(WORK_TYPES_BY_TEAM[form.team] || []).map((workType) => (
                <option value={workType} key={workType}>{workTypeLabels[workType]}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Deadline
          <input disabled={!canCoordinate} type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
        </label>
        {isManager ? (
          <label>
            Assignee
            <select
              value={form.assignee_id}
              onChange={(event) => setForm({
                ...form,
                assignee_id: event.target.value,
                collaborator_ids: form.collaborator_ids.filter((id) => id !== event.target.value)
              })}
            >
              <option value="">Unassigned</option>
              {directory.map((employee) => (
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
        <div className="two-column">
          <div className="read-only-line">
            <span>Nguoi tao</span>
            <strong>{task.creator_name || creator?.email || 'Khong ro'}</strong>
          </div>
          <div className="read-only-line">
            <span>Nguoi giao gan nhat</span>
            <strong>{task.assigned_by_name || assigner?.email || 'Khong ro'}</strong>
          </div>
        </div>
        {canCoordinate ? (
          <EmployeeMultiSelect
            employees={directory}
            selectedIds={form.collaborator_ids}
            excludedIds={[form.assignee_id]}
            onChange={(collaboratorIds) => setForm({ ...form, collaborator_ids: collaboratorIds })}
          />
        ) : (
          <div className="read-only-line">
            <span>Nguoi ho tro</span>
            <strong>
              {form.collaborator_ids
                .map((id) => directory.find((employee) => employee.id === id)?.email)
                .filter(Boolean)
                .join(', ') || 'Khong co'}
            </strong>
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
