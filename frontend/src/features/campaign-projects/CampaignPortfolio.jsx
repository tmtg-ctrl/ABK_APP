import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  Filter,
  Flag,
  FolderKanban,
  ListTodo,
  Plus,
  Search,
  UserRoundCheck,
  Users
} from 'lucide-react';

const formatDate = (date) => {
  if (!date) return '--/--';
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
};

function PortfolioMetric({ icon: Icon, label, value, detail, tone = '' }) {
  return (
    <section className={`portfolio-metric ${tone}`}>
      <Icon size={19} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </section>
  );
}

function CampaignCard({ project, tasks, onOpen }) {
  const nextMilestone = tasks.find((task) => task.milestone && task.status !== 'done');
  const actionableTasks = tasks.filter((task) => !task.milestone);
  const completed = actionableTasks.filter((task) => task.status === 'done').length;

  return (
    <button className="portfolio-campaign-card" onClick={() => onOpen(project.id)}>
      <div className="portfolio-campaign-card-top">
        <span className="portfolio-project-code">{project.code || 'CAMPAIGN'}</span>
        <span className={`portfolio-health ${project.health === 'Can theo doi' ? 'warning' : ''}`}>
          <CircleDot size={12} />
          {project.health}
        </span>
      </div>
      <div>
        <h4>{project.name}</h4>
        <p>{project.objective || 'Chua cap nhat muc tieu campaign.'}</p>
      </div>
      <div className="portfolio-progress-copy">
        <span>Tien do</span>
        <strong>{project.progress}%</strong>
      </div>
      <div className="campaign-progress-track">
        <i style={{ width: `${project.progress}%`, background: project.color }} />
      </div>
      <div className="portfolio-campaign-meta">
        <span><Users size={14} /> {new Set(tasks.map((task) => task.owner).filter(Boolean)).size} nguoi</span>
        <span><ListTodo size={14} /> {completed}/{actionableTasks.length} task</span>
      </div>
      <footer>
        <div>
          <Flag size={15} />
          <span>
            <small>Milestone tiep theo</small>
            <strong>{nextMilestone?.title.replace('MILESTONE: ', '') || 'Chua co milestone'}</strong>
          </span>
        </div>
        <ArrowRight size={18} />
      </footer>
    </button>
  );
}

function WeeklyTaskRow({ task, project, completed, onToggle, onOpen }) {
  return (
    <div className={`portfolio-todo-row ${completed ? 'completed' : ''}`}>
      <button
        className="portfolio-check"
        onClick={onToggle}
        aria-label={completed ? 'Bo danh dau hoan thanh' : 'Danh dau hoan thanh'}
      >
        {completed && <Check size={14} />}
      </button>
      <button className="portfolio-todo-main" onClick={() => onOpen(task)}>
        <strong>{task.title}</strong>
        <span>
          <b style={{ color: project?.color || '#687386' }}>
            {project?.name || 'Van hanh'}
          </b>
          <i>{task.owner || 'Chua giao'}</i>
        </span>
      </button>
      <span className={`portfolio-priority ${task.priority}`}>{task.priority}</span>
      <span className="portfolio-due"><Clock3 size={13} /> {formatDate(task.end)}</span>
    </div>
  );
}

export function CampaignPortfolio({
  projects,
  tasks,
  weeklyTaskIds,
  weekLabel,
  currentUser,
  onOpenCampaign,
  onOpenTask,
  onToggleTask,
  onCreateCampaign
}) {
  const [todoScope, setTodoScope] = useState('week');
  const [query, setQuery] = useState('');
  const projectById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects]
  );
  const today = new Date().toISOString().slice(0, 10);
  const reviewTasks = tasks.filter((task) => task.status === 'review');
  const delayedTasks = tasks
    .filter((task) => task.end && task.end < today && !['done', 'approved'].includes(task.status))
    .map((task) => ({ ...task, delayLabel: `Tre han ${formatDate(task.end)}` }));
  const weeklySet = weeklyTaskIds ? new Set(weeklyTaskIds) : null;
  const weeklyTasks = tasks
    .filter((task) => !task.milestone)
    .filter((task) => !weeklySet || weeklySet.has(task.id))
    .filter((task) => ['todo', 'doing', 'review', 'done'].includes(task.status))
    .filter((task) => {
      if (todoScope === 'mine') {
        return task.assigneeId === currentUser?.id || task.owner === currentUser?.email;
      }
      if (todoScope === 'operation') return !task.projectId;
      return true;
    })
    .filter((task) => `${task.title} ${task.owner} ${projectById[task.projectId]?.name || ''}`
      .toLowerCase()
      .includes(query.toLowerCase()))
    .slice(0, 10);
  const activeProjects = projects.filter((project) => !['completed', 'archived'].includes(project.status));

  const openTask = (task) => {
    if (task.projectId) onOpenTask(task.projectId, task.id);
  };

  return (
    <div className="campaign-portfolio">
      <section className="portfolio-heading">
        <div>
          <span className="eyebrow">Marketing portfolio</span>
          <h3>Chien dich va cong viec tuan nay</h3>
          <p>Campaign dat muc tieu; Task la noi duy nhat luu cong viec; Weekly Plan chi sap lich Task.</p>
        </div>
        <button className="primary-action" onClick={onCreateCampaign}>
          <Plus size={17} />
          Tao campaign
        </button>
      </section>

      <div className="portfolio-metric-grid">
        <PortfolioMetric icon={FolderKanban} label="Campaign dang chay" value={activeProjects.length} detail={`${projects.length} campaign trong portfolio`} />
        <PortfolioMetric icon={ListTodo} label="Cong viec tuan nay" value={weeklyTasks.length} detail={`${weeklyTasks.filter((task) => task.status !== 'done').length} viec dang mo`} />
        <PortfolioMetric icon={UserRoundCheck} label="Cho phe duyet" value={reviewTasks.length} detail="Can leader phan hoi" tone="amber" />
        <PortfolioMetric icon={AlertTriangle} label="Tre han" value={delayedTasks.length} detail="Can dieu chinh ke hoach" tone="red" />
      </div>

      <div className="portfolio-main-grid">
        <section className="panel portfolio-campaign-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Campaign portfolio</span>
              <h3>Chien dich dang trien khai</h3>
            </div>
          </div>
          <div className="portfolio-campaign-list">
            {projects.map((project) => (
              <CampaignCard
                project={project}
                tasks={tasks.filter((task) => task.projectId === project.id)}
                onOpen={onOpenCampaign}
                key={project.id}
              />
            ))}
          </div>
        </section>

        <section className="panel portfolio-week-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Weekly todo</span>
              <h3>Can xu ly trong tuan</h3>
            </div>
            <span className="portfolio-week-label"><CalendarDays size={15} /> {weekLabel || 'Chua chot tuan'}</span>
          </div>

          <div className="portfolio-todo-toolbar">
            <div className="portfolio-scope-tabs">
              <button className={todoScope === 'week' ? 'active' : ''} onClick={() => setTodoScope('week')}>Toan phong</button>
              <button className={todoScope === 'mine' ? 'active' : ''} onClick={() => setTodoScope('mine')}>Cua toi</button>
              <button className={todoScope === 'operation' ? 'active' : ''} onClick={() => setTodoScope('operation')}>Van hanh</button>
            </div>
            <div className="portfolio-search">
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tim viec" />
            </div>
          </div>

          <div className="portfolio-todo-list">
            {weeklyTasks.map((task) => (
              <WeeklyTaskRow
                task={task}
                project={projectById[task.projectId]}
                completed={task.status === 'done'}
                onToggle={() => onToggleTask(task.id, task.status === 'done' ? 'todo' : 'done')}
                onOpen={openTask}
                key={task.id}
              />
            ))}
          </div>
          {!weeklyTasks.length && <div className="empty-state">Chua co Task nao trong ke hoach tuan.</div>}
          <button className="portfolio-open-week">
            Mo Weekly Planner
            <ArrowRight size={16} />
          </button>
        </section>
      </div>

      <div className="portfolio-alert-grid">
        <section className="panel portfolio-review-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Approval queue</span>
              <h3>Dang cho leader duyet</h3>
            </div>
            <span className="count-pill">{reviewTasks.length}</span>
          </div>
          <div className="portfolio-compact-list">
            {reviewTasks.map((task) => (
              <button onClick={() => openTask(task)} key={task.id}>
                <span className="portfolio-compact-icon review"><CheckCircle2 size={16} /></span>
                <span>
                  <strong>{task.title}</strong>
                  <small>{projectById[task.projectId]?.name || 'Van hanh'} - {task.owner}</small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
          {!reviewTasks.length && <div className="empty-state">Khong co Task cho duyet.</div>}
        </section>

        <section className="panel portfolio-delay-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Attention</span>
              <h3>Tre han / Co rui ro</h3>
            </div>
            <button className="secondary-action compact-action"><Filter size={14} /> Loc</button>
          </div>
          <div className="portfolio-compact-list">
            {delayedTasks.map((task) => (
              <button onClick={() => openTask(task)} key={task.id}>
                <span className="portfolio-compact-icon delayed"><AlertTriangle size={16} /></span>
                <span>
                  <strong>{task.title}</strong>
                  <small>{projectById[task.projectId]?.name || 'Van hanh'} - {task.delayLabel}</small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
          {!delayedTasks.length && <div className="empty-state">Khong co Task tre han.</div>}
        </section>
      </div>
    </div>
  );
}
