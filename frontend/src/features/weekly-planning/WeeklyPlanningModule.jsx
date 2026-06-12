import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ClipboardCheck,
  FolderKanban,
  GripVertical,
  History,
  ListPlus,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  Users,
  Wrench
} from 'lucide-react';
import { EmployeeMultiSelect } from '../../shared/components/EmployeeMultiSelect';
import { InlineError } from '../../shared/components/InlineError';
import { Modal } from '../../shared/components/Modal';
import { apiRequest } from '../../shared/services/api';
import {
  formatShortDate,
  formatWeekLabel,
  getWeekRange,
  useCampaignWorkspace
} from '../campaign-projects/useCampaignWorkspace';

const statusLabels = {
  draft: 'Ban nhap',
  member_planning: 'Nhan vien dang lap lich',
  leader_review: 'Leader dang duyet',
  committed: 'Da chot',
  closed: 'Da dong'
};

const taskStatusLabels = {
  backlog: 'Backlog',
  todo: 'Can lam',
  doing: 'Dang lam',
  review: 'Cho duyet',
  revision: 'Can sua',
  approved: 'Da duyet',
  blocked: 'Bi chan',
  done: 'Hoan thanh'
};

const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const addDays = (date, count) => {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + count);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildDirectory = (employees, currentUser) => {
  const byId = new Map(employees.map((employee) => [employee.id, employee]));
  if (!byId.has(currentUser.id)) {
    byId.set(currentUser.id, {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      position: currentUser.position
    });
  }
  return [...byId.values()];
};

function WeeklyMetric({ icon: Icon, label, value, detail, tone = '' }) {
  return (
    <section className={`weekly-metric ${tone}`}>
      <Icon size={18} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </section>
  );
}

function AddTaskForm({ plan, tasks, projects, currentUser, isManager, token, onSaved }) {
  const existingTaskIds = new Set(plan.allocations.map((allocation) => allocation.task_id));
  const availableTasks = tasks.filter((task) => (
    !task.milestone
    && !existingTaskIds.has(task.id)
    && task.status !== 'done'
    && (
      isManager
      || task.assignee_id === currentUser.id
      || task.created_by === currentUser.id
      || task.collaborator_ids.includes(currentUser.id)
    )
  ));
  const [form, setForm] = useState({
    task_id: availableTasks[0]?.id || '',
    planned_date: plan.week_start,
    estimated_hours: 4
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const projectById = Object.fromEntries(projects.map((project) => [project.id, project]));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/api/marketing/projects/weekly-plans/${plan.id}/allocations`, {
        method: 'POST',
        token,
        body: {
          task_id: form.task_id,
          planned_date: form.planned_date,
          estimated_hours: Number(form.estimated_hours),
          commitment_status: 'planned'
        }
      });
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!availableTasks.length) {
    return <div className="empty-state">Khong con Task phu hop de dua vao tuan nay.</div>;
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        Chon Task co san
        <select value={form.task_id} onChange={(event) => setForm({ ...form, task_id: event.target.value })}>
          {availableTasks.map((task) => (
            <option value={task.id} key={task.id}>
              {projectById[task.projectId]?.name || 'Van hanh'} - {task.title}
            </option>
          ))}
        </select>
      </label>
      <div className="two-column">
        <label>
          Ngay du kien
          <input
            type="date"
            min={plan.week_start}
            max={plan.week_end}
            value={form.planned_date}
            onChange={(event) => setForm({ ...form, planned_date: event.target.value })}
          />
        </label>
        <label>
          So gio du kien
          <input
            type="number"
            min="0.5"
            max="40"
            step="0.5"
            value={form.estimated_hours}
            onChange={(event) => setForm({ ...form, estimated_hours: event.target.value })}
          />
        </label>
      </div>
      {error && <InlineError message={error} />}
      <button className="primary-action" disabled={saving || !form.task_id}>
        {saving ? <RefreshCw className="spin" size={17} /> : <ListPlus size={17} />}
        Dua Task vao tuan
      </button>
    </form>
  );
}

function OperationTaskForm({ plan, employees, currentUser, isManager, token, onSaved }) {
  const directory = buildDirectory(employees, currentUser);
  const [form, setForm] = useState({
    title: '',
    description: '',
    team: 'content',
    priority: 'medium',
    assignee_id: currentUser.id,
    owner_name: currentUser.email,
    collaborator_ids: [],
    planned_date: plan.week_start,
    estimated_hours: 4
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await apiRequest('/api/marketing/tasks', {
        method: 'POST',
        token,
        body: {
          title: form.title,
          description: form.description,
          team: form.team,
          priority: form.priority,
          assignee_id: form.assignee_id || currentUser.id,
          owner_name: form.owner_name,
          collaborator_ids: form.collaborator_ids,
          work_context: 'operation',
          start_date: form.planned_date,
          deadline: plan.week_end,
          status: 'todo'
        }
      });
      await apiRequest(`/api/marketing/projects/weekly-plans/${plan.id}/allocations`, {
        method: 'POST',
        token,
        body: {
          task_id: result.task.id,
          planned_date: form.planned_date,
          estimated_hours: Number(form.estimated_hours),
          commitment_status: 'planned'
        }
      });
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        Ten cong viec van hanh
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
      </label>
      <label>
        Ket qua can ban giao
        <textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </label>
      <div className="two-column">
        <label>
          Team
          <select value={form.team} onChange={(event) => setForm({ ...form, team: event.target.value })}>
            <option value="content">Content</option>
            <option value="media">Media</option>
            <option value="sale">Sale</option>
            <option value="performance">Performance</option>
            <option value="event">Event</option>
          </select>
        </label>
        <label>
          Uu tien
          <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            <option value="low">Thap</option>
            <option value="medium">Trung binh</option>
            <option value="high">Cao</option>
          </select>
        </label>
      </div>
      {isManager && (
        <label>
          Nguoi phu trach
          <select
            value={form.assignee_id}
            onChange={(event) => {
              const employee = directory.find((item) => item.id === event.target.value);
              setForm({
                ...form,
                assignee_id: event.target.value,
                owner_name: employee?.email || currentUser.email,
                collaborator_ids: form.collaborator_ids.filter((id) => id !== event.target.value)
              });
            }}
          >
            <option value={currentUser.id}>{currentUser.email}</option>
            {directory.filter((employee) => employee.id !== currentUser.id).map((employee) => (
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
      <EmployeeMultiSelect
        employees={directory}
        selectedIds={form.collaborator_ids}
        excludedIds={[form.assignee_id]}
        onChange={(collaboratorIds) => setForm({ ...form, collaborator_ids: collaboratorIds })}
      />
      <div className="two-column">
        <label>
          Ngay thuc hien
          <input
            type="date"
            min={plan.week_start}
            max={plan.week_end}
            value={form.planned_date}
            onChange={(event) => setForm({ ...form, planned_date: event.target.value })}
          />
        </label>
        <label>
          So gio du kien
          <input
            type="number"
            min="0.5"
            max="40"
            step="0.5"
            value={form.estimated_hours}
            onChange={(event) => setForm({ ...form, estimated_hours: event.target.value })}
          />
        </label>
      </div>
      {error && <InlineError message={error} />}
      <button className="primary-action" disabled={saving}>
        {saving ? <RefreshCw className="spin" size={17} /> : <Wrench size={17} />}
        Tao va dua vao tuan
      </button>
    </form>
  );
}

function WeeklyTaskDetails({
  task,
  projects,
  employees,
  currentUser,
  isManager,
  token,
  onSaved
}) {
  const directory = buildDirectory(employees, currentUser);
  const employeeById = Object.fromEntries(directory.map((employee) => [employee.id, employee]));
  const canCoordinate = isManager || task.created_by === currentUser.id || task.assignee_id === currentUser.id;
  const canParticipate = canCoordinate || task.collaborator_ids.includes(currentUser.id);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    deliverable: task.deliverable || '',
    status: task.status,
    priority: task.priority,
    deadline: task.deadline || '',
    assignee_id: task.assignee_id || '',
    collaborator_ids: task.collaborator_ids || [],
    checklist: task.checklist || []
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const project = projects.find((item) => item.id === task.projectId);

  const addChecklistItem = () => {
    const text = newChecklistItem.trim();
    if (!text) return;
    setForm({
      ...form,
      checklist: [
        ...form.checklist,
        { id: crypto.randomUUID(), text, done: false }
      ]
    });
    setNewChecklistItem('');
  };

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
          priority: form.priority,
          deadline: form.deadline || null,
          assignee_id: isManager ? form.assignee_id || null : undefined,
          owner_name: isManager ? employeeById[form.assignee_id]?.email || '' : undefined,
          collaborator_ids: form.collaborator_ids,
          checklist: form.checklist
        } : {
          status: form.status,
          checklist: form.checklist
        }
      });
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="weekly-task-detail">
      <div className="weekly-task-detail-header">
        <span className={`weekly-source ${task.projectId ? 'campaign' : 'operation'}`}>
          {task.projectId ? 'Campaign' : 'Van hanh'}
        </span>
        <span>{project?.name || 'Cong viec van hanh'}</span>
      </div>

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
          Trang thai
          <select
            value={form.status}
            disabled={!canParticipate}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            {Object.entries(taskStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Uu tien
          <select
            value={form.priority}
            disabled={!canCoordinate}
            onChange={(event) => setForm({ ...form, priority: event.target.value })}
          >
            <option value="low">Thap</option>
            <option value="medium">Trung binh</option>
            <option value="high">Cao</option>
          </select>
        </label>
      </div>

      <div className="weekly-responsibility-grid">
        <div className="read-only-line">
          <span>Nguoi tao</span>
          <strong>{task.creator_name || employeeById[task.created_by]?.email || 'Khong ro'}</strong>
        </div>
        <div className="read-only-line">
          <span>Nguoi giao gan nhat</span>
          <strong>{task.assigned_by_name || employeeById[task.assigned_by_id]?.email || 'Khong ro'}</strong>
        </div>
      </div>

      {isManager ? (
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
            <option value="">
              {task.owner_name ? `Chua gan tai khoan - ${task.owner_name}` : 'Chua giao'}
            </option>
            {directory.map((employee) => (
              <option value={employee.id} key={employee.id}>{employee.email}</option>
            ))}
          </select>
        </label>
      ) : (
        <div className="read-only-line">
          <span>Nguoi phu trach chinh</span>
          <strong>{employeeById[task.assignee_id]?.email || task.owner || 'Chua giao'}</strong>
        </div>
      )}

      {canCoordinate ? (
        <EmployeeMultiSelect
          employees={directory}
          selectedIds={form.collaborator_ids}
          excludedIds={[form.assignee_id]}
          onChange={(collaboratorIds) => setForm({ ...form, collaborator_ids: collaboratorIds })}
        />
      ) : (
        <div className="weekly-support-summary">
          <span>Nguoi ho tro</span>
          <strong>
            {form.collaborator_ids.map((id) => employeeById[id]?.email).filter(Boolean).join(', ') || 'Khong co'}
          </strong>
        </div>
      )}

      <section className="weekly-checklist">
        <div className="section-heading">
          <h4><ClipboardCheck size={16} /> Checklist</h4>
          <span>{form.checklist.filter((item) => item.done).length}/{form.checklist.length}</span>
        </div>
        <div>
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
        </div>
        {canCoordinate && (
          <div className="weekly-checklist-add">
            <input
              value={newChecklistItem}
              onChange={(event) => setNewChecklistItem(event.target.value)}
              placeholder="Them muc can kiem tra"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addChecklistItem();
                }
              }}
            />
            <button type="button" className="secondary-action" onClick={addChecklistItem}>
              <Plus size={15} />
              Them
            </button>
          </div>
        )}
      </section>

      <section className="weekly-activity">
        <h4><History size={16} /> Lich su gan day</h4>
        {(task.activity || []).slice().reverse().slice(0, 6).map((entry) => (
          <div key={entry.id}>
            <span>{entry.actor_name || employeeById[entry.actor_id]?.email || 'He thong'}</span>
            <strong>{entry.action === 'created' ? 'da tao cong viec' : `da cap nhat ${entry.fields?.join(', ') || 'cong viec'}`}</strong>
            <small>{entry.created_at ? new Date(entry.created_at).toLocaleString('vi-VN') : ''}</small>
          </div>
        ))}
      </section>

      {error && <InlineError message={error} />}
      {canParticipate && (
        <button className="primary-action" onClick={save} disabled={saving}>
          {saving ? <RefreshCw className="spin" size={17} /> : <CheckCircle2 size={17} />}
          Luu cong viec
        </button>
      )}
    </div>
  );
}

function WeeklyTaskCard({
  allocation,
  task,
  project,
  canSchedule,
  canUpdateTask,
  onMove,
  onHoursChange,
  onStatusChange,
  onRemove,
  onOpen
}) {
  const [hours, setHours] = useState(allocation.estimated_hours || 0);
  const isSelfCreated =
    task.created_by &&
    task.assignee_id &&
    task.created_by === task.assignee_id;

  useEffect(() => {
    setHours(allocation.estimated_hours || 0);
  }, [allocation.estimated_hours]);

  return (
    <article
      className={`weekly-task-card ${task.status === 'done' ? 'completed' : ''}`}
      draggable={canSchedule}
      onDragStart={(event) => event.dataTransfer.setData('text/allocation-id', allocation.id)}
    >
      <div className="weekly-task-card-top">
        <GripVertical size={14} />
        <span className={`weekly-source ${task.projectId ? 'campaign' : 'operation'}`}>
          {task.projectId ? 'Campaign' : 'Van hanh'}
        </span>
        <span className={`weekly-origin ${isSelfCreated ? 'self' : 'assigned'}`}>
          {isSelfCreated ? 'Tu tao' : 'Duoc giao'}
        </span>
        <span className={`campaign-priority-dot ${task.priority}`} />
      </div>
      <button className="weekly-task-title" onClick={() => onOpen(task)}>
        {task.title}
      </button>
      <small>{project?.name || task.phase}</small>
      <div className="weekly-task-owner">
        <UserRound size={13} />
        <span>{task.owner}</span>
      </div>
      {!!task.collaborator_ids.length && (
        <div className="weekly-task-support">
          <Users size={13} />
          <span>{task.collaborator_ids.length} nguoi ho tro</span>
        </div>
      )}
      <div className="weekly-task-controls">
        <select
          value={task.status}
          disabled={!canUpdateTask}
          onChange={(event) => onStatusChange(task.id, event.target.value)}
        >
          {Object.entries(taskStatusLabels).map(([value, label]) => (
            <option value={value} key={value}>{label}</option>
          ))}
        </select>
        <label>
          <Clock3 size={12} />
          <input
            type="number"
            min="0"
            max="40"
            step="0.5"
            value={hours}
            disabled={!canSchedule}
            onChange={(event) => setHours(event.target.value)}
            onBlur={() => onHoursChange(allocation.id, hours)}
          />
          h
        </label>
      </div>
      {canSchedule && (
        <footer>
          <select value={allocation.planned_date || ''} onChange={(event) => onMove(allocation.id, event.target.value)}>
            <option value="">Chua xep ngay</option>
            {Array.from({ length: 7 }, (_, index) => addDays(allocation.week_start, index)).map((date) => (
              <option value={date} key={date}>{formatShortDate(date)}</option>
            ))}
          </select>
          <button className="icon-button" onClick={() => onRemove(allocation.id)} title="Bo khoi tuan">
            <Trash2 size={14} />
          </button>
        </footer>
      )}
    </article>
  );
}

export function WeeklyPlanningModule({
  token,
  currentUser,
  isManager,
  employees,
  onWorkspaceChanged
}) {
  const {
    projects,
    tasks,
    weeklyPlans,
    loading,
    error: loadError,
    loadWorkspace
  } = useCampaignWorkspace(token);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [scope, setScope] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCreateOperation, setShowCreateOperation] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const sortedPlans = useMemo(
    () => [...weeklyPlans].sort((a, b) => (b.week_start || '').localeCompare(a.week_start || '')),
    [weeklyPlans]
  );

  useEffect(() => {
    if (!selectedPlanId && sortedPlans.length) {
      const currentWeek = getWeekRange();
      const current = sortedPlans.find((plan) => plan.week_start === currentWeek.weekStart);
      setSelectedPlanId(current?.id || sortedPlans[0].id);
    }
  }, [selectedPlanId, sortedPlans]);

  const selectedPlan = sortedPlans.find((plan) => plan.id === selectedPlanId) || sortedPlans[0];
  const directory = buildDirectory(employees, currentUser);
  const employeeById = Object.fromEntries(directory.map((employee) => [employee.id, employee]));
  const projectById = Object.fromEntries(projects.map((project) => [project.id, project]));
  const taskById = Object.fromEntries(tasks.map((task) => [task.id, task]));
  const allocations = (selectedPlan?.allocations || [])
    .map((allocation) => ({
      ...allocation,
      week_start: selectedPlan.week_start,
      task: taskById[allocation.task_id]
    }))
    .filter((allocation) => allocation.task)
    .filter(({ task }) => {
      if (scope === 'mine') {
        return task.assignee_id === currentUser.id
          || task.created_by === currentUser.id
          || task.collaborator_ids.includes(currentUser.id);
      }
      if (scope === 'campaign') return Boolean(task.projectId);
      if (scope === 'operation') return !task.projectId;
      return true;
    });
  const days = selectedPlan
    ? Array.from({ length: 7 }, (_, index) => addDays(selectedPlan.week_start, index))
    : [];
  const today = new Date().toISOString().slice(0, 10);
  const canSchedulePlan = ['draft', 'member_planning', 'leader_review'].includes(selectedPlan?.status);
  const canExecutePlan = selectedPlan?.status !== 'closed';
  const { weekStart: currentWeekStart } = getWeekRange();
  const hasCurrentWeek = sortedPlans.some((plan) => plan.week_start === currentWeekStart);

  const runAction = async (action) => {
    setSaving(true);
    setActionError('');
    try {
      await action();
      await loadWorkspace();
      onWorkspaceChanged?.();
    } catch (err) {
      setActionError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const createCurrentWeek = async () => {
    const { weekStart, weekEnd } = getWeekRange();
    await runAction(async () => {
      const result = await apiRequest('/api/marketing/projects/weekly-plans', {
        method: 'POST',
        token,
        body: {
          week_start: weekStart,
          week_end: weekEnd,
          title: `Ke hoach tuan ${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`,
          status: 'member_planning'
        }
      });
      setSelectedPlanId(result.plan.id);
    });
  };

  const updateAllocation = (allocationId, body) => runAction(() => apiRequest(
    `/api/marketing/projects/weekly-plans/${selectedPlan.id}/allocations/${allocationId}`,
    { method: 'PUT', token, body }
  ));

  const moveAllocation = (allocationId, plannedDate) => updateAllocation(allocationId, {
    planned_date: plannedDate || null
  });

  const updateTaskStatus = (taskId, status) => runAction(() => apiRequest(
    `/api/marketing/tasks/${taskId}`,
    {
      method: 'PUT',
      token,
      body: { status, progress: status === 'done' ? 100 : undefined }
    }
  ));

  const removeAllocation = (allocationId) => runAction(() => apiRequest(
    `/api/marketing/projects/weekly-plans/${selectedPlan.id}/allocations/${allocationId}`,
    { method: 'DELETE', token }
  ));

  const updatePlanStatus = (status) => runAction(() => apiRequest(
    `/api/marketing/projects/weekly-plans/${selectedPlan.id}`,
    { method: 'PUT', token, body: { status } }
  ));

  if (loading && !weeklyPlans.length) {
    return <div className="empty-state"><RefreshCw className="spin" size={18} /> Dang tai ke hoach tuan...</div>;
  }

  if (!selectedPlan) {
    return (
      <section className="panel weekly-empty-state">
        <CalendarCheck2 size={38} />
        <h3>Chua co ke hoach cho tuan nay</h3>
        <p>Leader tao khung tuan, sau do nhan vien dua Task Campaign hoac viec van hanh vao lich cua minh.</p>
        {(loadError || actionError) && <InlineError message={loadError || actionError} />}
        {isManager && (
          <button className="primary-action" onClick={createCurrentWeek} disabled={saving}>
            {saving ? <RefreshCw className="spin" size={17} /> : <Plus size={17} />}
            Tao ke hoach tuan nay
          </button>
        )}
      </section>
    );
  }

  const completedCount = allocations.filter(({ task }) => task.status === 'done').length;
  const reviewCount = allocations.filter(({ task }) => task.status === 'review').length;
  const totalHours = allocations.reduce((sum, allocation) => sum + Number(allocation.estimated_hours || 0), 0);
  const campaignCount = allocations.filter(({ task }) => task.projectId).length;

  return (
    <div className="weekly-planning">
      {(loadError || actionError) && <InlineError message={loadError || actionError} />}
      <section className="weekly-planning-heading">
        <div>
          <span className="eyebrow">Weekly planning</span>
          <h3>Cong viec tuan {formatWeekLabel(selectedPlan)}</h3>
          <p>Day la lich thuc thi. Campaign chi cung cap muc tieu va Task, khong tao them ban sao cong viec.</p>
        </div>
        <div className="weekly-heading-actions">
          <label className="weekly-plan-picker">
            <select value={selectedPlan.id} onChange={(event) => setSelectedPlanId(event.target.value)}>
              {sortedPlans.map((plan) => (
                <option value={plan.id} key={plan.id}>
                  {formatWeekLabel(plan)} - {statusLabels[plan.status] || plan.status}
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </label>
          {isManager && !hasCurrentWeek && (
            <button className="secondary-action" onClick={createCurrentWeek} disabled={saving}>
              <CalendarCheck2 size={16} />
              Tao tuan nay
            </button>
          )}
          <button className="secondary-action" onClick={() => setShowCreateOperation(true)} disabled={!canSchedulePlan}>
            <Wrench size={16} />
            Them viec van hanh
          </button>
          <button className="primary-action" onClick={() => setShowAddTask(true)} disabled={!canSchedulePlan}>
            <ListPlus size={16} />
            Chon Task co san
          </button>
        </div>
      </section>

      <div className="weekly-metric-grid">
        <WeeklyMetric icon={CalendarCheck2} label="Task trong tuan" value={allocations.length} detail={`${campaignCount} tu campaign`} />
        <WeeklyMetric icon={Clock3} label="Tong tai du kien" value={`${totalHours}h`} detail="Tong gio cua bo loc hien tai" />
        <WeeklyMetric icon={CheckCircle2} label="Hoan thanh" value={completedCount} detail={`${allocations.length ? Math.round((completedCount / allocations.length) * 100) : 0}% ke hoach`} tone="green" />
        <WeeklyMetric icon={AlertTriangle} label="Cho leader duyet" value={reviewCount} detail="Can phan hoi de khong bi sot" tone="amber" />
      </div>

      <section className="panel weekly-control-bar">
        <div className="portfolio-scope-tabs">
          <button className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>Toan phong</button>
          <button className={scope === 'mine' ? 'active' : ''} onClick={() => setScope('mine')}>Cua toi</button>
          <button className={scope === 'campaign' ? 'active' : ''} onClick={() => setScope('campaign')}>Campaign</button>
          <button className={scope === 'operation' ? 'active' : ''} onClick={() => setScope('operation')}>Van hanh</button>
        </div>
        <div className="weekly-plan-status">
          <span className={`weekly-status ${selectedPlan.status}`}>{statusLabels[selectedPlan.status]}</span>
          {isManager && selectedPlan.status !== 'closed' && (
            <select
              value={selectedPlan.status}
              disabled={saving}
              onChange={(event) => updatePlanStatus(event.target.value)}
            >
              <option value="member_planning">Nhan vien lap lich</option>
              <option value="leader_review">Leader duyet</option>
              <option value="committed">Chot ke hoach</option>
              <option value="closed">Dong tuan</option>
            </select>
          )}
        </div>
      </section>

      <div className="weekly-board">
        {[...days, 'unplanned'].map((date) => {
          const dayAllocations = allocations.filter((allocation) => (
            date === 'unplanned' ? !allocation.planned_date : allocation.planned_date === date
          ));
          const isToday = date === today;
          return (
            <section
              className={`weekly-day-column ${isToday ? 'today' : ''}`}
              key={date}
              onDragOver={(event) => canSchedulePlan && event.preventDefault()}
              onDrop={(event) => {
                const allocationId = event.dataTransfer.getData('text/allocation-id');
                if (allocationId && canSchedulePlan) moveAllocation(allocationId, date === 'unplanned' ? null : date);
              }}
            >
              <header>
                <div>
                  <span>{date === 'unplanned' ? 'CHUA XEP' : weekdayLabels[new Date(`${date}T00:00:00`).getDay()]}</span>
                  <strong>{date === 'unplanned' ? 'Backlog tuan' : formatShortDate(date)}</strong>
                </div>
                <b>{dayAllocations.length}</b>
              </header>
              <div className="weekly-day-stack">
                {dayAllocations.map((allocation) => {
                  const task = allocation.task;
                  const ownsTask = isManager
                    || task.assignee_id === currentUser.id
                    || task.created_by === currentUser.id;
                  const participatesInTask = ownsTask || task.collaborator_ids.includes(currentUser.id);
                  const displayTask = {
                    ...task,
                    owner: employeeById[task.assignee_id]?.email || task.owner
                  };
                  return (
                    <WeeklyTaskCard
                      allocation={allocation}
                      task={displayTask}
                      project={projectById[task.projectId]}
                      canSchedule={canSchedulePlan && ownsTask}
                      canUpdateTask={canExecutePlan && participatesInTask}
                      onMove={moveAllocation}
                      onHoursChange={(allocationId, hours) => updateAllocation(allocationId, {
                        estimated_hours: Number(hours)
                      })}
                      onStatusChange={updateTaskStatus}
                      onRemove={removeAllocation}
                      onOpen={() => setSelectedTaskId(task.id)}
                      key={allocation.id}
                    />
                  );
                })}
                {!dayAllocations.length && <div className="weekly-day-empty">Tha Task vao day</div>}
              </div>
            </section>
          );
        })}
      </div>

      {showAddTask && (
        <Modal title="Dua Task co san vao tuan" onClose={() => setShowAddTask(false)}>
          <AddTaskForm
            plan={selectedPlan}
            tasks={tasks}
            projects={projects}
            currentUser={currentUser}
            isManager={isManager}
            token={token}
            onSaved={async () => {
              await loadWorkspace();
              setShowAddTask(false);
            }}
          />
        </Modal>
      )}

      {showCreateOperation && (
        <Modal title="Tao cong viec van hanh" onClose={() => setShowCreateOperation(false)}>
          <OperationTaskForm
            plan={selectedPlan}
            employees={employees}
            currentUser={currentUser}
            isManager={isManager}
            token={token}
            onSaved={async () => {
              await loadWorkspace();
              onWorkspaceChanged?.();
              setShowCreateOperation(false);
            }}
          />
        </Modal>
      )}

      {selectedTaskId && taskById[selectedTaskId] && (
        <Modal title="Chi tiet cong viec" onClose={() => setSelectedTaskId(null)} className="weekly-task-modal">
          <WeeklyTaskDetails
            task={{
              ...taskById[selectedTaskId],
              owner: employeeById[taskById[selectedTaskId].assignee_id]?.email || taskById[selectedTaskId].owner
            }}
            projects={projects}
            employees={directory}
            currentUser={currentUser}
            isManager={isManager}
            token={token}
            onSaved={async () => {
              await loadWorkspace();
              onWorkspaceChanged?.();
              setSelectedTaskId(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
