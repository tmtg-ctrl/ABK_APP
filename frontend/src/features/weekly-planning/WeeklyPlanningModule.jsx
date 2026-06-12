import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  GripVertical,
  History,
  LayoutGrid,
  List,
  ListPlus,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  Users
} from 'lucide-react';
import { EmployeeMultiSelect } from '../../shared/components/EmployeeMultiSelect';
import { FilterMenu } from '../../shared/components/FilterMenu';
import { InlineError } from '../../shared/components/InlineError';
import { Modal } from '../../shared/components/Modal';
import { apiRequest } from '../../shared/services/api';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import {
  TASK_BUCKET_LABELS,
  getChecklistProgress,
  getTaskBucket,
  isTaskCompleted
} from '../../shared/utils/tasks';
import {
  formatShortDate,
  formatWeekLabel,
  getWeekRange,
  useCampaignWorkspace
} from '../campaign-projects/useCampaignWorkspace';

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

function AddTaskForm({ plan, tasks, projects, currentUser, token, onSaved }) {
  const existingTaskIds = new Set(plan.allocations.map((allocation) => allocation.task_id));
  const availableTasks = tasks.filter((task) => (
    !task.milestone
    && !existingTaskIds.has(task.id)
    && task.status !== 'done'
    && task.assignee_id === currentUser.id
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
    return (
      <div className="empty-state">
        Ban khong con cong viec duoc giao nao de xep vao tuan nay.
      </div>
    );
  }

  return (
    <form className="form-stack create-form" onSubmit={submit}>
      <label>
        Chon cong viec duoc giao
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
        Xep cong viec vao tuan
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
  const canCoordinate = isManager || task.created_by === currentUser.id;
  const canParticipate = canCoordinate
    || task.assignee_id === currentUser.id
    || task.collaborator_ids.includes(currentUser.id);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    deliverable: task.deliverable || '',
    status: task.status,
    progress: Number(task.progress || 0),
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
          progress: Number(form.progress),
          priority: form.priority,
          deadline: form.deadline || null,
          assignee_id: isManager ? form.assignee_id || null : undefined,
          owner_name: isManager ? employeeById[form.assignee_id]?.email || '' : undefined,
          collaborator_ids: form.collaborator_ids,
          checklist: form.checklist
        } : {
          status: form.status,
          progress: Number(form.progress),
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
            onChange={(event) => {
              const status = event.target.value;
              setForm({
                ...form,
                status,
                progress: ['approved', 'done'].includes(status) ? 100 : form.progress
              });
            }}
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

      <label className="weekly-progress-field">
        <span>
          Tien do thuc hien
          <strong>{form.progress}%</strong>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={form.progress}
          disabled={!canParticipate}
          onChange={(event) => setForm({ ...form, progress: Number(event.target.value) })}
        />
      </label>

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
      <div className="weekly-card-progress">
        <span><i style={{ width: `${task.progress || 0}%` }} /></span>
        <b>{task.progress || 0}%</b>
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

function WeeklyListView({
  allocations,
  projectById,
  employeeById,
  currentUser,
  isManager,
  canExecutePlan,
  onStatusChange,
  onOpen
}) {
  const groups = ['pending', 'active', 'review', 'completed'];

  return (
    <div className="weekly-list-view">
      {groups.map((bucket) => {
        const bucketAllocations = allocations.filter(({ task }) => getTaskBucket(task.status) === bucket);
        return (
          <section className={`panel weekly-list-group ${bucket}`} key={bucket}>
            <header>
              <div>
                <span className="eyebrow">{TASK_BUCKET_LABELS[bucket]}</span>
                <h3>{bucketAllocations.length} cong viec</h3>
              </div>
              <b>{bucketAllocations.length}</b>
            </header>
            <div>
              {bucketAllocations.map((allocation) => {
                const task = allocation.task;
                const checklist = getChecklistProgress(task);
                const canUpdate = canExecutePlan && (
                  isManager
                  || task.assignee_id === currentUser.id
                  || task.created_by === currentUser.id
                  || task.collaborator_ids.includes(currentUser.id)
                );
                return (
                  <article className={isTaskCompleted(task) ? 'completed' : ''} key={allocation.id}>
                    <button
                      type="button"
                      className="portfolio-check"
                      disabled={!canUpdate}
                      onClick={() => onStatusChange(task.id, isTaskCompleted(task) ? 'todo' : 'done')}
                    >
                      {isTaskCompleted(task) && <CheckCircle2 size={14} />}
                    </button>
                    <button type="button" className="weekly-list-main" onClick={() => onOpen(task.id)}>
                      <strong>{task.title}</strong>
                      <span>
                        {projectById[task.projectId]?.name || 'Van hanh'}
                        {' - '}
                        {employeeById[task.assignee_id]?.email || task.owner}
                      </span>
                      {!!checklist.total && <small>{checklist.completed}/{checklist.total} checklist da xong</small>}
                    </button>
                    <span className={`weekly-source ${task.projectId ? 'campaign' : 'operation'}`}>
                      {task.projectId ? 'Campaign' : 'Van hanh'}
                    </span>
                    <span className="weekly-list-date">
                      <Clock3 size={13} />
                      {allocation.planned_date ? formatShortDate(allocation.planned_date) : 'Chua xep'}
                    </span>
                    <span className="weekly-list-progress">{task.progress || 0}%</span>
                    <strong className="weekly-list-hours">{allocation.estimated_hours || 0}h</strong>
                  </article>
                );
              })}
              {!bucketAllocations.length && <div className="weekly-list-empty">Khong co cong viec.</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function WeeklyPlanningModule({
  token,
  currentUser,
  isManager,
  employees,
  onWorkspaceChanged
}) {
  const { t } = useLanguage();
  const {
    projects,
    tasks,
    weeklyPlans,
    loading,
    error: loadError,
    loadWorkspace
  } = useCampaignWorkspace(token);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getWeekRange().weekStart);
  const [temporaryPlan, setTemporaryPlan] = useState(null);
  const [scope, setScope] = useState(isManager ? 'all' : 'mine');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [displayMode, setDisplayMode] = useState('list');
  const [taskFilter, setTaskFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState({
    scope: isManager ? 'all' : 'mine',
    employee: 'all',
    taskFilter: 'all'
  });
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const persistedPlan = weeklyPlans.find((plan) => plan.week_start === selectedWeekStart);
  const selectedPlan = persistedPlan
    || (temporaryPlan?.week_start === selectedWeekStart ? temporaryPlan : null);
  const selectedRange = getWeekRange(new Date(`${selectedWeekStart}T12:00:00`));
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
      const participates = task.assignee_id === currentUser.id
        || task.created_by === currentUser.id
        || task.collaborator_ids.includes(currentUser.id);
      if (!isManager && !participates) return false;
      if (employeeFilter !== 'all' && task.assignee_id !== employeeFilter) return false;
      if (scope === 'mine') {
        return participates;
      }
      if (scope === 'campaign') return Boolean(task.projectId);
      if (scope === 'operation') return !task.projectId;
      return true;
    });
  const visibleAllocations = taskFilter === 'all'
    ? allocations
    : allocations.filter(({ task }) => getTaskBucket(task.status) === taskFilter);
  const days = Array.from({ length: 7 }, (_, index) => addDays(selectedWeekStart, index));
  const today = new Date().toISOString().slice(0, 10);
  const canSchedulePlan = !selectedPlan || selectedPlan.status !== 'closed';
  const canExecutePlan = selectedPlan?.status !== 'closed';
  const { weekStart: currentWeekStart } = getWeekRange();
  const existingTaskIds = new Set((selectedPlan?.allocations || []).map((allocation) => allocation.task_id));
  const unscheduledCount = tasks.filter((task) => (
    task.assignee_id
    && (!isManager || employeeFilter === 'all' || task.assignee_id === employeeFilter)
    && (isManager || task.assignee_id === currentUser.id)
    && !task.milestone
    && !isTaskCompleted(task)
    && !existingTaskIds.has(task.id)
  )).length;
  const activeFilterCount = [
    scope !== (isManager ? 'all' : 'mine'),
    isManager && employeeFilter !== 'all',
    taskFilter !== 'all'
  ].filter(Boolean).length;

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

  const ensureSelectedPlan = async () => {
    if (selectedPlan) return selectedPlan;
    const result = await apiRequest('/api/marketing/projects/weekly-plans', {
      method: 'POST',
      token,
      body: {
        week_start: selectedRange.weekStart,
        week_end: selectedRange.weekEnd,
        title: `Lich cong viec ${formatShortDate(selectedRange.weekStart)} - ${formatShortDate(selectedRange.weekEnd)}`,
        status: 'member_planning'
      }
    });
    setTemporaryPlan(result.plan);
    await loadWorkspace();
    return result.plan;
  };

  const openScheduleModal = async () => {
    if (!unscheduledCount) {
      setActionError('Ban khong co cong viec duoc giao nao can xep vao tuan nay.');
      return;
    }
    setSaving(true);
    setActionError('');
    try {
      await ensureSelectedPlan();
      setShowAddTask(true);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectWeekFromDate = (date) => {
    if (!date) return;
    setSelectedWeekStart(getWeekRange(new Date(`${date}T12:00:00`)).weekStart);
  };

  const changeWeek = (offset) => {
    setSelectedWeekStart(addDays(selectedWeekStart, offset * 7));
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
      body: {
        status,
        progress: ['approved', 'done'].includes(status)
          ? 100
          : ['backlog', 'todo'].includes(status) ? 0 : undefined
      }
    }
  ));

  const removeAllocation = (allocationId) => runAction(() => apiRequest(
    `/api/marketing/projects/weekly-plans/${selectedPlan.id}/allocations/${allocationId}`,
    { method: 'DELETE', token }
  ));

  if (loading && !weeklyPlans.length) {
    return <div className="empty-state"><RefreshCw className="spin" size={18} /> Dang tai ke hoach tuan...</div>;
  }

  const completedCount = allocations.filter(({ task }) => isTaskCompleted(task)).length;
  const reviewCount = allocations.filter(({ task }) => task.status === 'review').length;
  const totalHours = allocations.reduce((sum, allocation) => sum + Number(allocation.estimated_hours || 0), 0);
  const averageProgress = allocations.length
    ? Math.round(allocations.reduce((sum, { task }) => sum + Number(task.progress || 0), 0) / allocations.length)
    : 0;

  return (
    <div className="weekly-planning">
      {(loadError || actionError) && <InlineError message={loadError || actionError} />}
      <section className="weekly-planning-heading">
        <div>
          <span className="eyebrow">{t('weekly.eyebrow')}</span>
          <h3>Lich cong viec {formatWeekLabel(selectedRange)}</h3>
          <p>
            Leader giao Task va theo doi. Nhan vien tu xep viec duoc giao vao ngay phu hop,
            ke ca cac tuan trong tuong lai, sau do cap nhat tien do thuc hien.
          </p>
        </div>
        <div className="weekly-heading-actions">
          <div className="weekly-week-navigator">
            <button type="button" className="icon-button" onClick={() => changeWeek(-1)} title="Tuan truoc">
              <ChevronLeft size={17} />
            </button>
            <label>
              <CalendarCheck2 size={15} />
              <input
                type="date"
                value={selectedWeekStart}
                onChange={(event) => selectWeekFromDate(event.target.value)}
              />
            </label>
            <button type="button" className="icon-button" onClick={() => changeWeek(1)} title="Tuan sau">
              <ChevronRight size={17} />
            </button>
            {selectedWeekStart !== currentWeekStart && (
              <button type="button" className="secondary-action compact-action" onClick={() => setSelectedWeekStart(currentWeekStart)}>
                Tuan nay
              </button>
            )}
          </div>
          {!isManager && (
            <button className="primary-action" onClick={openScheduleModal} disabled={!canSchedulePlan || saving}>
              {saving ? <RefreshCw className="spin" size={16} /> : <ListPlus size={16} />}
              Xep viec cua toi
            </button>
          )}
        </div>
      </section>

      <div className="weekly-role-note">
        <UserRound size={16} />
        <span>
          {isManager
            ? 'Che do Leader: xem toan phong hoac loc theo tung nhan vien. Lich do nhan vien tu sap xep.'
            : 'Chi ban moi co the xep ngay va so gio cho cong viec duoc giao chinh.'}
        </span>
      </div>

      <div className="weekly-metric-grid">
        <WeeklyMetric
          icon={CalendarCheck2}
          label="Viec trong tuan"
          value={allocations.length}
          detail={`${unscheduledCount} viec ${isManager ? 'chua duoc xep' : 'cua ban chua xep'} tuan nay`}
        />
        <WeeklyMetric icon={Clock3} label="Tong tai du kien" value={`${totalHours}h`} detail="Tong so gio theo bo loc hien tai" />
        <WeeklyMetric icon={CheckCircle2} label="Tien do trung binh" value={`${averageProgress}%`} detail={`${completedCount} cong viec da hoan thanh`} tone="green" />
        <WeeklyMetric icon={AlertTriangle} label="Cho Leader duyet" value={reviewCount} detail="Cong viec dang cho phan hoi" tone="amber" />
      </div>

      {!selectedPlan ? (
        <section className="panel weekly-empty-state">
          <CalendarCheck2 size={38} />
          <h3>Tuan nay chua co cong viec duoc xep lich</h3>
          <p>
            {isManager
              ? 'Khi nhan vien xep cong viec duoc giao vao tuan nay, danh sach va tien do se xuat hien tai day.'
              : 'Chon "Xep viec cua toi" de dua cong viec da duoc giao vao ngay ban du kien thuc hien.'}
          </p>
          {!isManager && (
            <button className="primary-action" onClick={openScheduleModal} disabled={saving}>
              {saving ? <RefreshCw className="spin" size={17} /> : <ListPlus size={17} />}
              Xep cong viec vao tuan nay
            </button>
          )}
        </section>
      ) : (
        <>
          <section className="panel weekly-control-bar">
            <div className="weekly-control-filters">
              <div className="applied-filter-summary">
                <span>{visibleAllocations.length} cong viec dang hien thi</span>
                {isManager && employeeFilter !== 'all' && <b>{employeeById[employeeFilter]?.email}</b>}
                {scope !== (isManager ? 'all' : 'mine') && (
                  <b>{scope === 'mine' ? 'Cua toi' : scope === 'campaign' ? 'Campaign' : 'Van hanh'}</b>
                )}
                {taskFilter !== 'all' && <b>{TASK_BUCKET_LABELS[taskFilter]}</b>}
              </div>
              <FilterMenu
                open={filterOpen}
                title="Loc lich cong viec"
                activeCount={activeFilterCount}
                onOpen={() => {
                  setDraftFilters({ scope, employee: employeeFilter, taskFilter });
                  setFilterOpen(true);
                }}
                onClose={() => setFilterOpen(false)}
                onApply={() => {
                  setScope(draftFilters.scope);
                  setEmployeeFilter(draftFilters.employee);
                  setTaskFilter(draftFilters.taskFilter);
                  setFilterOpen(false);
                }}
                onReset={() => {
                  const defaultScope = isManager ? 'all' : 'mine';
                  setDraftFilters({ scope: defaultScope, employee: 'all', taskFilter: 'all' });
                  setScope(defaultScope);
                  setEmployeeFilter('all');
                  setTaskFilter('all');
                  setFilterOpen(false);
                }}
              >
                {isManager && (
                  <label className="filter-field">
                    <span>Nhan vien phu trach</span>
                    <select
                      value={draftFilters.employee}
                      onChange={(event) => setDraftFilters({ ...draftFilters, employee: event.target.value })}
                    >
                      <option value="all">Tat ca nhan vien</option>
                      {directory.map((employee) => (
                        <option value={employee.id} key={employee.id}>{employee.email}</option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="filter-field">
                  <span>Pham vi cong viec</span>
                  <div className="filter-choice-grid two">
                    {[
                      ...(isManager ? [['all', 'Toan phong']] : []),
                      ['mine', 'Cua toi'],
                      ['campaign', 'Campaign'],
                      ['operation', 'Van hanh']
                    ].map(([value, label]) => (
                      <button
                        type="button"
                        className={draftFilters.scope === value ? 'active' : ''}
                        onClick={() => setDraftFilters({ ...draftFilters, scope: value })}
                        key={value}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-field">
                  <span>Tien do</span>
                  <div className="filter-choice-grid two">
                    <button
                      type="button"
                      className={draftFilters.taskFilter === 'all' ? 'active' : ''}
                      onClick={() => setDraftFilters({ ...draftFilters, taskFilter: 'all' })}
                    >
                      Tat ca
                    </button>
                    {['pending', 'active', 'review', 'completed'].map((bucket) => (
                      <button
                        type="button"
                        className={draftFilters.taskFilter === bucket ? 'active' : ''}
                        onClick={() => setDraftFilters({ ...draftFilters, taskFilter: bucket })}
                        key={bucket}
                      >
                        {TASK_BUCKET_LABELS[bucket]}
                      </button>
                    ))}
                  </div>
                </div>
              </FilterMenu>
            </div>
            <div className="weekly-control-actions">
              <div className="weekly-view-toggle">
                <button className={displayMode === 'list' ? 'active' : ''} onClick={() => setDisplayMode('list')}>
                  <List size={15} /> Danh sach
                </button>
                <button className={displayMode === 'board' ? 'active' : ''} onClick={() => setDisplayMode('board')}>
                  <LayoutGrid size={15} /> Lich theo ngay
                </button>
              </div>
              <span className={`weekly-status ${selectedPlan.status}`}>
                {selectedPlan.status === 'closed' ? 'Tuan da dong' : 'Lich dang mo'}
              </span>
            </div>
          </section>

          {displayMode === 'list' ? (
            <WeeklyListView
              allocations={visibleAllocations}
              projectById={projectById}
              employeeById={employeeById}
              currentUser={currentUser}
              isManager={isManager}
              canExecutePlan={canExecutePlan}
              onStatusChange={updateTaskStatus}
              onOpen={setSelectedTaskId}
            />
          ) : (
            <div className="weekly-board">
              {[...days, 'unplanned'].map((date) => {
                const dayAllocations = visibleAllocations.filter((allocation) => (
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
                      if (allocationId && canSchedulePlan) {
                        moveAllocation(allocationId, date === 'unplanned' ? null : date);
                      }
                    }}
                  >
                    <header>
                      <div>
                        <span>{date === 'unplanned' ? 'CHUA XEP' : weekdayLabels[new Date(`${date}T00:00:00`).getDay()]}</span>
                        <strong>{date === 'unplanned' ? 'Chua chon ngay' : formatShortDate(date)}</strong>
                      </div>
                      <b>{dayAllocations.length}</b>
                    </header>
                    <div className="weekly-day-stack">
                      {dayAllocations.map((allocation) => {
                        const task = allocation.task;
                        const ownsSchedule = task.assignee_id === currentUser.id;
                        const participatesInTask = isManager
                          || ownsSchedule
                          || task.created_by === currentUser.id
                          || task.collaborator_ids.includes(currentUser.id);
                        return (
                          <WeeklyTaskCard
                            allocation={allocation}
                            task={{
                              ...task,
                              owner: employeeById[task.assignee_id]?.email || task.owner
                            }}
                            project={projectById[task.projectId]}
                            canSchedule={canSchedulePlan && ownsSchedule}
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
                      {!dayAllocations.length && (
                        <div className="weekly-day-empty">
                          {date === 'unplanned' ? 'Chua co viec cho xep ngay' : 'Chua co viec'}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      {showAddTask && selectedPlan && (
        <Modal
          title="Xep cong viec vao tuan"
          description="Chi hien thi cac cong viec ban la nguoi duoc giao chinh. Ban tu chon ngay lam va so gio du kien."
          className="create-modal"
          size="medium"
          onClose={() => setShowAddTask(false)}
        >
          <AddTaskForm
            plan={selectedPlan}
            tasks={tasks}
            projects={projects}
            currentUser={currentUser}
            token={token}
            onSaved={async () => {
              await loadWorkspace();
              setShowAddTask(false);
            }}
          />
        </Modal>
      )}

      {selectedTaskId && taskById[selectedTaskId] && (
        <Modal title="Chi tiet va tien do cong viec" onClose={() => setSelectedTaskId(null)} className="weekly-task-modal">
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
