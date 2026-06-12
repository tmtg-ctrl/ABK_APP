import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  ListChecks,
  Play,
  Plus,
  RefreshCw,
  Search
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { EmptyState } from '../../shared/components/EmptyState';
import { InlineError } from '../../shared/components/InlineError';
import { Modal } from '../../shared/components/Modal';
import { MARKETING_TEAMS, statusLabels, teamLabels, workTypeLabels } from '../../shared/constants/marketing';
import { apiRequest } from '../../shared/services/api';
import {
  TASK_BUCKET_LABELS,
  getChecklistProgress,
  getTaskBucket,
  getTaskDueState,
  isTaskCompleted
} from '../../shared/utils/tasks';
import { TaskDetail } from './TaskDetail';
import { TaskForm } from './TaskForm';

const bucketOrder = ['pending', 'active', 'review', 'completed'];

const nextStatusByBucket = {
  pending: 'doing',
  active: 'review',
  review: 'done',
  completed: 'todo'
};

function TaskMetric({ icon: Icon, label, value, tone }) {
  return (
    <section className={`assigned-task-metric ${tone}`}>
      <Icon size={18} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </section>
  );
}

function TaskListRow({
  task,
  selected,
  employeeById,
  canUpdate,
  updating,
  onSelect,
  onQuickUpdate
}) {
  const bucket = getTaskBucket(task.status);
  const dueState = getTaskDueState(task);
  const checklist = getChecklistProgress(task);
  const assignee = employeeById[task.assignee_id]?.email || task.owner_name || 'Chua giao';

  return (
    <article className={`assigned-task-row ${selected ? 'active' : ''} ${isTaskCompleted(task) ? 'completed' : ''}`}>
      <button
        type="button"
        className="assigned-task-check"
        disabled={!canUpdate || updating}
        onClick={() => onQuickUpdate(task, isTaskCompleted(task) ? 'todo' : 'done')}
        title={isTaskCompleted(task) ? 'Mo lai cong viec' : 'Danh dau hoan thanh'}
      >
        {updating ? <RefreshCw className="spin" size={15} /> : isTaskCompleted(task) ? <Check size={15} /> : <Circle size={15} />}
      </button>

      <button type="button" className="assigned-task-main" onClick={() => onSelect(task.id)}>
        <span className="assigned-task-title-line">
          <strong>{task.title}</strong>
          <Badge value={task.status} />
          <Badge value={task.priority} tone={task.priority} />
        </span>
        <span className="assigned-task-copy">{task.description || task.deliverable || 'Chua co mo ta cong viec.'}</span>
        <span className="assigned-task-meta">
          <b>{teamLabels[task.team] || task.team || 'Marketing'}</b>
          {task.work_type && <i>{workTypeLabels[task.work_type] || task.work_type}</i>}
          <i>{assignee}</i>
          {!!task.collaborator_ids?.length && <i>+{task.collaborator_ids.length} ho tro</i>}
        </span>
        {!!checklist.total && (
          <span className="assigned-checklist-progress">
            <i><b style={{ width: `${checklist.percent}%` }} /></i>
            {checklist.completed}/{checklist.total} checklist
          </span>
        )}
      </button>

      <div className={`assigned-task-due ${dueState}`}>
        <Clock3 size={13} />
        <span>{task.deadline || 'Chua co han'}</span>
      </div>

      {canUpdate && (
        <button
          type="button"
          className="secondary-action compact-action assigned-next-action"
          disabled={updating}
          onClick={() => onQuickUpdate(task, nextStatusByBucket[bucket])}
        >
          {bucket === 'pending' && <Play size={13} />}
          {bucket === 'active' && <ListChecks size={13} />}
          {bucket === 'review' && <CheckCircle2 size={13} />}
          {bucket === 'completed' && <RefreshCw size={13} />}
          {bucket === 'pending' && 'Bat dau'}
          {bucket === 'active' && 'Gui duyet'}
          {bucket === 'review' && 'Hoan tat'}
          {bucket === 'completed' && 'Mo lai'}
        </button>
      )}
    </article>
  );
}

export function TaskWorkspace({
  tasks,
  employees,
  selectedTask,
  isManager,
  token,
  currentUser,
  mode = 'assigned',
  onChanged,
  onSelect
}) {
  const [query, setQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [bucketFilter, setBucketFilter] = useState('all');
  const [scope, setScope] = useState(mode === 'manage' ? 'all' : 'mine');
  const [showCreate, setShowCreate] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState('');
  const [actionError, setActionError] = useState('');
  const directory = employees.some((employee) => employee.id === currentUser.id)
    ? employees
    : [...employees, currentUser];
  const employeeById = Object.fromEntries(directory.map((employee) => [employee.id, employee]));

  const scopedTasks = useMemo(() => tasks.filter((task) => {
    const collaborators = task.collaborator_ids || [];
    if (mode === 'assigned') {
      return task.assignee_id === currentUser.id || collaborators.includes(currentUser.id);
    }
    if (scope === 'mine') {
      return task.assignee_id === currentUser.id || collaborators.includes(currentUser.id);
    }
    if (scope === 'created') return task.created_by === currentUser.id;
    return true;
  }), [tasks, mode, scope, currentUser.id]);

  const filteredTasks = scopedTasks.filter((task) => {
    if (teamFilter !== 'all' && task.team !== teamFilter) return false;
    if (bucketFilter !== 'all' && getTaskBucket(task.status) !== bucketFilter) return false;
    const haystack = `${task.title} ${task.description} ${task.status} ${task.priority} ${task.team} ${task.work_type} ${task.owner_name}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const counts = Object.fromEntries(bucketOrder.map((bucket) => [
    bucket,
    scopedTasks.filter((task) => getTaskBucket(task.status) === bucket).length
  ]));
  const overdueCount = scopedTasks.filter((task) => getTaskDueState(task) === 'overdue').length;

  const canUpdateTask = (task) => (
    isManager
    || task.created_by === currentUser.id
    || task.assignee_id === currentUser.id
    || (task.collaborator_ids || []).includes(currentUser.id)
  );

  const quickUpdate = async (task, status) => {
    setUpdatingTaskId(task.id);
    setActionError('');
    try {
      await apiRequest(`/api/marketing/tasks/${task.id}`, {
        method: 'PUT',
        token,
        body: {
          status,
          progress: ['approved', 'done'].includes(status) ? 100 : status === 'todo' ? 0 : undefined
        }
      });
      await onChanged();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setUpdatingTaskId('');
    }
  };

  const visibleSelectedTask = selectedTask && scopedTasks.some((task) => task.id === selectedTask.id)
    ? selectedTask
    : filteredTasks[0] || null;

  return (
    <div className="assigned-task-workspace">
      <section className="assigned-task-heading">
        <div>
          <span className="eyebrow">{mode === 'manage' ? 'Task management' : 'My work'}</span>
          <h3>{mode === 'manage' ? 'Quan ly cong viec Marketing' : 'Task duoc giao'}</h3>
          <p>
            {mode === 'manage'
              ? 'Theo doi tien do cua ca phong, nguoi phu trach va cac viec dang bi tre.'
              : 'Tap trung vao viec ban phu trach, dang ho tro va nhung viec can hoan thanh tiep theo.'}
          </p>
        </div>
        <button className="primary-action" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Tao Task
        </button>
      </section>

      <div className="assigned-task-metrics">
        <TaskMetric icon={Circle} label="Chua lam" value={counts.pending || 0} tone="neutral" />
        <TaskMetric icon={Play} label="Dang xu ly" value={counts.active || 0} tone="blue" />
        <TaskMetric icon={ListChecks} label="Cho duyet" value={counts.review || 0} tone="amber" />
        <TaskMetric icon={CheckCircle2} label="Da xong" value={counts.completed || 0} tone="green" />
        <TaskMetric icon={AlertTriangle} label="Tre han" value={overdueCount} tone="red" />
      </div>

      {actionError && <InlineError message={actionError} />}

      <section className="panel assigned-task-toolbar">
        <div className="portfolio-scope-tabs">
          {mode === 'manage' && (
            <>
              <button className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>Toan phong</button>
              <button className={scope === 'mine' ? 'active' : ''} onClick={() => setScope('mine')}>Toi tham gia</button>
              <button className={scope === 'created' ? 'active' : ''} onClick={() => setScope('created')}>Toi da giao</button>
            </>
          )}
          {mode === 'assigned' && (
            <span className="assigned-scope-label">Chi hien thi viec ban phu trach hoac ho tro</span>
          )}
        </div>
        <div className="assigned-task-filters">
          <label className="portfolio-search">
            <Search size={14} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tim Task" />
          </label>
          <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
            <option value="all">Tat ca team</option>
            {MARKETING_TEAMS.map((team) => (
              <option value={team} key={team}>{teamLabels[team]}</option>
            ))}
          </select>
        </div>
      </section>

      <div className="assigned-task-layout">
        <section className="panel assigned-task-list-panel">
          <div className="assigned-bucket-tabs">
            <button className={bucketFilter === 'all' ? 'active' : ''} onClick={() => setBucketFilter('all')}>
              Tat ca <b>{scopedTasks.length}</b>
            </button>
            {bucketOrder.map((bucket) => (
              <button
                className={bucketFilter === bucket ? 'active' : ''}
                onClick={() => setBucketFilter(bucket)}
                key={bucket}
              >
                {TASK_BUCKET_LABELS[bucket]} <b>{counts[bucket] || 0}</b>
              </button>
            ))}
          </div>

          <div className="assigned-task-list">
            {filteredTasks.map((task) => (
              <TaskListRow
                task={task}
                selected={visibleSelectedTask?.id === task.id}
                employeeById={employeeById}
                canUpdate={canUpdateTask(task)}
                updating={updatingTaskId === task.id}
                onSelect={onSelect}
                onQuickUpdate={quickUpdate}
                key={task.id}
              />
            ))}
            {!filteredTasks.length && (
              <EmptyState text={bucketFilter === 'completed' ? 'Chua co cong viec da hoan thanh.' : 'Khong co cong viec phu hop bo loc.'} />
            )}
          </div>
        </section>

        <section className="panel detail-panel assigned-detail-panel">
          {visibleSelectedTask ? (
            <TaskDetail
              task={visibleSelectedTask}
              employees={employees}
              isManager={isManager}
              token={token}
              currentUser={currentUser}
              onChanged={onChanged}
            />
          ) : (
            <EmptyState text="Chon mot Task de xem chi tiet." />
          )}
        </section>
      </div>

      {showCreate && (
        <Modal title="Tao Task Marketing" onClose={() => setShowCreate(false)}>
          <TaskForm
            employees={employees}
            isManager={isManager}
            token={token}
            currentUser={currentUser}
            onSaved={() => {
              setShowCreate(false);
              onChanged();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
