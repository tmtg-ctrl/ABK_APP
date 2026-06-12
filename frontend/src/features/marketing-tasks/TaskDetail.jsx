import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Plus, RefreshCw, Trash2 } from 'lucide-react';
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
import { getChecklistProgress, isTaskCompleted } from '../../shared/utils/tasks';

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
  const canParticipate = canCoordinate || (task.collaborator_ids || []).includes(currentUser.id);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    deliverable: task.deliverable || '',
    status: task.status,
    priority: task.priority,
    team: task.team || 'media',
    work_type: task.work_type || WORK_TYPES_BY_TEAM[task.team || 'media']?.[0] || '',
    deadline: task.deadline || '',
    assignee_id: task.assignee_id || '',
    collaborator_ids: task.collaborator_ids || [],
    checklist: task.checklist || []
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      title: task.title,
      description: task.description || '',
      deliverable: task.deliverable || '',
      status: task.status,
      priority: task.priority,
      team: task.team || 'media',
      work_type: task.work_type || WORK_TYPES_BY_TEAM[task.team || 'media']?.[0] || '',
      deadline: task.deadline || '',
      assignee_id: task.assignee_id || '',
      collaborator_ids: task.collaborator_ids || [],
      checklist: task.checklist || []
    });
  }, [task]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/api/marketing/tasks/${task.id}`, {
        method: 'PUT',
        token,
        body: canCoordinate ? {
          title: form.title,
          description: form.description,
          deliverable: form.deliverable,
          status: form.status,
          progress: isTaskCompleted({ status: form.status }) ? 100 : undefined,
          priority: form.priority,
          team: form.team,
          work_type: form.work_type,
          deadline: form.deadline,
          assignee_id: isManager ? form.assignee_id || null : undefined,
          owner_name: isManager
            ? directory.find((employee) => employee.id === form.assignee_id)?.email || ''
            : undefined,
          collaborator_ids: form.collaborator_ids,
          checklist: form.checklist
        } : {
          status: form.status,
          progress: isTaskCompleted({ status: form.status }) ? 100 : undefined,
          checklist: form.checklist
        }
      });
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const assignee = directory.find((employee) => employee.id === task.assignee_id);
  const creator = directory.find((employee) => employee.id === task.created_by);
  const assigner = directory.find((employee) => employee.id === task.assigned_by_id);
  const checklistProgress = getChecklistProgress(form);

  const addChecklistItem = () => {
    const text = newChecklistItem.trim();
    if (!text) return;
    setForm({
      ...form,
      checklist: [...form.checklist, { id: crypto.randomUUID(), text, done: false }]
    });
    setNewChecklistItem('');
  };

  return (
    <div className="detail-stack">
      <div>
        <span className="eyebrow">Task detail</span>
        <h3>{form.title}</h3>
        <p>{form.description || 'Chua co mo ta'}</p>
      </div>
      <div className="detail-meta">
        <Badge value={task.status} />
        <Badge value={task.priority} tone={task.priority} />
        <Badge value={teamLabels[task.team] || task.team || 'Media'} />
        {task.work_type && <Badge value={workTypeLabels[task.work_type] || task.work_type} />}
        <span>{task.deadline || 'No deadline'}</span>
      </div>
      <div className="form-stack">
        <label>
          Ten cong viec
          <input
            value={form.title}
            disabled={!canCoordinate}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </label>
        <label>
          Mo ta
          <textarea
            rows="3"
            value={form.description}
            disabled={!canCoordinate}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <label>
          Ket qua can ban giao
          <textarea
            rows="2"
            value={form.deliverable}
            disabled={!canCoordinate}
            onChange={(event) => setForm({ ...form, deliverable: event.target.value })}
          />
        </label>
        <div className="two-column">
          <label>
            Status
            <select disabled={!canParticipate} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
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
        <section className="task-detail-checklist">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Tien do dau viec</span>
              <h4><ClipboardCheck size={16} /> Checklist</h4>
            </div>
            <strong>{checklistProgress.completed}/{checklistProgress.total}</strong>
          </div>
          <div className="task-detail-progress-track">
            <i style={{ width: `${checklistProgress.percent}%` }} />
          </div>
          <div className="task-detail-checklist-items">
            {form.checklist.map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={Boolean(item.done)}
                  disabled={!canParticipate}
                  onChange={() => setForm({
                    ...form,
                    checklist: form.checklist.map((entry) => (
                      entry.id === item.id ? { ...entry, done: !entry.done } : entry
                    ))
                  })}
                />
                <span>{item.text}</span>
                {canCoordinate && (
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setForm({
                      ...form,
                      checklist: form.checklist.filter((entry) => entry.id !== item.id)
                    })}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </label>
            ))}
            {!form.checklist.length && <small>Chua co dau viec chi tiet.</small>}
          </div>
          {canCoordinate && (
            <div className="task-detail-checklist-add">
              <input
                value={newChecklistItem}
                onChange={(event) => setNewChecklistItem(event.target.value)}
                placeholder="Them dau viec can hoan thanh"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addChecklistItem();
                  }
                }}
              />
              <button type="button" className="secondary-action" onClick={addChecklistItem}>
                <Plus size={14} />
                Them
              </button>
            </div>
          )}
        </section>
        {task.completed_at && (
          <div className="task-completed-note">
            <CheckCircle2 size={16} />
            Hoan thanh luc {new Date(task.completed_at).toLocaleString('vi-VN')}
          </div>
        )}
        {error && <InlineError message={error} />}
        <button className="primary-action" onClick={save} disabled={saving || !canParticipate}>
          {saving ? <RefreshCw className="spin" size={18} /> : <CheckCircle2 size={18} />}
          Luu thay doi
        </button>
      </div>
    </div>
  );
}
