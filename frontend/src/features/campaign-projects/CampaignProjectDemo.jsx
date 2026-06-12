import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  ChevronDown,
  CircleDot,
  Clock3,
  Flag,
  GanttChartSquare,
  GripVertical,
  KanbanSquare,
  ListChecks,
  Plus,
  Target,
  Users
} from 'lucide-react';
import { isTaskCompleted } from '../../shared/utils/tasks';
import { useLanguage } from '../../shared/i18n/LanguageContext';

const DAY_MS = 24 * 60 * 60 * 1000;
export const campaignDemoProjects = [
  {
    id: 'showroom',
    code: 'CAM-2606',
    name: 'Khai truong Showroom Thu Duc',
    objective: 'Tao nhan dien va thu hut 300 khach tham du trong tuan khai truong.',
    owner: 'Tran Minh Thuong',
    sponsor: 'Giam doc Marketing',
    start: '2026-06-08',
    end: '2026-06-28',
    budget: '180 trieu',
    progress: 58,
    health: 'Can theo doi',
    color: '#2f6f5f'
  },
  {
    id: 'brand-q3',
    code: 'CAM-2607',
    name: 'Thuong hieu ABK Quy 3',
    objective: 'Dong bo hinh anh thuong hieu tren website, fanpage va tai lieu ban hang.',
    owner: 'Nguyen Ha',
    sponsor: 'Ban Giam doc',
    start: '2026-06-15',
    end: '2026-07-31',
    budget: '95 trieu',
    progress: 24,
    health: 'Dung tien do',
    color: '#315f91'
  },
  {
    id: 'recruitment',
    code: 'CAM-2608',
    name: 'Tuyen dung Kien truc su',
    objective: 'Tao 80 ho so phu hop va tuyen du 4 kien truc su trong thang.',
    owner: 'Le Anh',
    sponsor: 'Phong Nhan su',
    start: '2026-06-10',
    end: '2026-07-10',
    budget: '42 trieu',
    progress: 36,
    health: 'Dung tien do',
    color: '#8a5b28'
  }
];

export const campaignDemoTasks = [
  {
    id: 'task-1',
    projectId: 'showroom',
    phase: 'Chuan bi',
    title: 'Chot concept va key message',
    owner: 'Nguyen Ha',
    team: 'Content',
    status: 'done',
    priority: 'high',
    start: '2026-06-08',
    end: '2026-06-10',
    progress: 100,
    dependency: null
  },
  {
    id: 'task-2',
    projectId: 'showroom',
    phase: 'Chuan bi',
    title: 'Lap danh sach khach moi',
    owner: 'Bao Tran',
    team: 'Sale',
    status: 'doing',
    priority: 'high',
    start: '2026-06-09',
    end: '2026-06-14',
    progress: 60,
    dependency: null
  },
  {
    id: 'task-3',
    projectId: 'showroom',
    phase: 'San xuat',
    title: 'Chup anh showroom va san pham',
    owner: 'Quoc Huy',
    team: 'Media',
    status: 'review',
    priority: 'high',
    start: '2026-06-10',
    end: '2026-06-13',
    progress: 85,
    dependency: 'task-1'
  },
  {
    id: 'task-4',
    projectId: 'showroom',
    phase: 'San xuat',
    title: 'Thiet ke bo key visual',
    owner: 'Mai Linh',
    team: 'Media',
    status: 'doing',
    priority: 'high',
    start: '2026-06-11',
    end: '2026-06-17',
    progress: 45,
    dependency: 'task-1'
  },
  {
    id: 'task-5',
    projectId: 'showroom',
    phase: 'Truyen thong',
    title: 'Viet chuoi 5 bai countdown',
    owner: 'Nguyen Ha',
    team: 'Content',
    status: 'todo',
    priority: 'medium',
    start: '2026-06-14',
    end: '2026-06-20',
    progress: 0,
    dependency: 'task-4'
  },
  {
    id: 'task-6',
    projectId: 'showroom',
    phase: 'Truyen thong',
    title: 'Chay quang cao Facebook',
    owner: 'Thanh Dat',
    team: 'Performance',
    status: 'backlog',
    priority: 'medium',
    start: '2026-06-18',
    end: '2026-06-26',
    progress: 0,
    dependency: 'task-5'
  },
  {
    id: 'task-7',
    projectId: 'showroom',
    phase: 'Su kien',
    title: 'Tong duyet chuong trinh',
    owner: 'Bao Tran',
    team: 'Event',
    status: 'backlog',
    priority: 'high',
    start: '2026-06-24',
    end: '2026-06-26',
    progress: 0,
    dependency: 'task-3'
  },
  {
    id: 'task-8',
    projectId: 'showroom',
    phase: 'Su kien',
    title: 'MILESTONE: Khai truong',
    owner: 'Marketing Team',
    team: 'All',
    status: 'backlog',
    priority: 'high',
    start: '2026-06-28',
    end: '2026-06-28',
    progress: 0,
    dependency: 'task-7',
    milestone: true
  },
  {
    id: 'task-9',
    projectId: 'brand-q3',
    phase: 'Research',
    title: 'Audit bo nhan dien hien tai',
    owner: 'Nguyen Ha',
    team: 'Content',
    status: 'doing',
    priority: 'medium',
    start: '2026-06-15',
    end: '2026-06-22',
    progress: 35,
    dependency: null
  },
  {
    id: 'task-10',
    projectId: 'recruitment',
    phase: 'Tuyen dung',
    title: 'Chot chan dung ung vien',
    owner: 'Le Anh',
    team: 'HR',
    status: 'review',
    priority: 'high',
    start: '2026-06-10',
    end: '2026-06-12',
    progress: 90,
    dependency: null
  }
];

const boardColumns = [
  { id: 'backlog', label: 'Chua len lich', description: 'Chua dua vao tuan' },
  { id: 'todo', label: 'Can lam', description: 'Da cam ket thuc hien' },
  { id: 'doing', label: 'Dang lam', description: 'Dang duoc xu ly' },
  { id: 'review', label: 'Cho duyet', description: 'Can quan ly phan hoi' },
  { id: 'done', label: 'Hoan thanh', description: 'Da dong viec' }
];

const views = [
  { id: 'overview', labelKey: 'common.overview', icon: BarChart3 },
  { id: 'board', labelKey: 'common.board', icon: KanbanSquare },
  { id: 'timeline', labelKey: 'common.timeline', icon: GanttChartSquare }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function ProjectHeader({ project, projects, onProjectChange, onBack }) {
  const { t } = useLanguage();
  return (
    <section className="campaign-project-hero">
      <div>
        <div className="campaign-project-kicker">
          {onBack && (
            <button className="campaign-back-action" onClick={onBack}>
              <ArrowLeft size={14} />
              {t('common.portfolio')}
            </button>
          )}
          <span className="campaign-demo-pill">{t('common.live')}</span>
          <span>{project.code}</span>
          <span className="campaign-health">
            <CircleDot size={13} />
            {project.health}
          </span>
        </div>
        <h3>{project.name}</h3>
        <p>{project.objective}</p>
      </div>
      <label className="campaign-project-picker">
        Chon campaign
        <span>
          <select value={project.id} onChange={(event) => onProjectChange(event.target.value)}>
            {projects.map((item) => (
              <option value={item.id} key={item.id}>{item.name}</option>
            ))}
          </select>
          <ChevronDown size={16} />
        </span>
      </label>
    </section>
  );
}

function ProjectSummary({ project, tasks }) {
  const completed = tasks.filter(isTaskCompleted).length;
  const atRisk = tasks.filter((task) => task.priority === 'high' && !['done', 'review'].includes(task.status)).length;
  const owners = new Set(tasks.map((task) => task.owner)).size;

  return (
    <div className="campaign-summary-grid">
      <section className="campaign-summary-card">
        <Target size={19} />
        <span>Tien do campaign</span>
        <strong>{project.progress}%</strong>
        <div className="campaign-progress-track">
          <i style={{ width: `${project.progress}%`, background: project.color }} />
        </div>
      </section>
      <section className="campaign-summary-card">
        <ListChecks size={19} />
        <span>Task hoan thanh</span>
        <strong>{completed}/{tasks.length}</strong>
        <small>{tasks.length - completed} task con lai</small>
      </section>
      <section className="campaign-summary-card">
        <Users size={19} />
        <span>Nguoi tham gia</span>
        <strong>{owners}</strong>
        <small>Marketing va Sale</small>
      </section>
      <section className="campaign-summary-card campaign-risk-card">
        <AlertTriangle size={19} />
        <span>Can chu y</span>
        <strong>{atRisk}</strong>
        <small>Task uu tien cao</small>
      </section>
    </div>
  );
}

function OverviewView({ project, tasks, phases, isManager, onCreatePhase }) {
  const { t } = useLanguage();
  const phaseNames = [
    ...phases.filter((phase) => phase.project_id === project.id).map((phase) => phase.name),
    ...tasks.map((task) => task.phase)
  ].filter((phase, index, all) => phase && all.indexOf(phase) === index);
  const nextMilestone = [...tasks]
    .filter((task) => task.status !== 'done')
    .sort((a, b) => (a.end || '').localeCompare(b.end || ''))
    .find((task) => task.milestone)
    || [...tasks]
      .filter((task) => task.status !== 'done')
      .sort((a, b) => (a.end || '').localeCompare(b.end || ''))[0];

  return (
    <div className="campaign-overview-grid">
      <section className="panel campaign-plan-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('common.projectStructure')}</span>
            <h3>Giai doan va deliverable</h3>
          </div>
          {isManager && (
            <button className="secondary-action compact-action" onClick={() => onCreatePhase(project.id)}>
              <Plus size={15} />
              Them phase
            </button>
          )}
        </div>
        <div className="campaign-phase-list">
          {phaseNames.map((phase, phaseIndex) => {
            const phaseTasks = tasks.filter((task) => task.phase === phase);
            const completed = phaseTasks.filter(isTaskCompleted).length;
            const progress = phaseTasks.length
              ? Math.round(phaseTasks.reduce((sum, task) => sum + task.progress, 0) / phaseTasks.length)
              : 0;

            return (
              <div className="campaign-phase-row" key={phase}>
                <span className="campaign-phase-number">{String(phaseIndex + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{phase}</strong>
                  <span>{completed}/{phaseTasks.length} task hoan thanh</span>
                </div>
                <div className="campaign-phase-progress">
                  <span>{progress}%</span>
                  <div className="campaign-progress-track"><i style={{ width: `${progress}%` }} /></div>
                </div>
                <ArrowRight size={17} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel campaign-info-panel">
        <span className="eyebrow">{t('common.projectBrief')}</span>
        <h3>Thong tin dieu hanh</h3>
        <div className="campaign-info-list">
          <div><span>{t('common.owner')}</span><strong>{project.owner}</strong></div>
          <div><span>{t('common.sponsor')}</span><strong>{project.sponsor}</strong></div>
          <div><span>Thoi gian</span><strong>{project.start} - {project.end}</strong></div>
          <div><span>Ngan sach</span><strong>{project.budget}</strong></div>
        </div>
        <div className="campaign-next-milestone">
          <Flag size={19} />
          <div>
            <span>Milestone tiep theo</span>
            <strong>{nextMilestone?.title.replace('MILESTONE: ', '') || 'Chua co milestone'}</strong>
            <small>{nextMilestone?.end || 'Chua co deadline'}</small>
          </div>
        </div>
      </section>
    </div>
  );
}

function BoardView({ tasks, onMoveTask, focusTaskId, canUpdateTask }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  return (
    <div className="campaign-board">
      {boardColumns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.id);

        return (
          <section
            className="campaign-board-column"
            key={column.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggedTaskId) {
                onMoveTask(draggedTaskId, column.id);
                setDraggedTaskId(null);
              }
            }}
          >
            <header>
              <div>
                <strong>{column.label}</strong>
                <span>{column.description}</span>
              </div>
              <b>{columnTasks.length}</b>
            </header>
            <div className="campaign-board-stack">
              {columnTasks.map((task) => (
                <article
                  className={`campaign-task-card ${focusTaskId === task.id ? 'focused' : ''}`}
                  draggable={canUpdateTask(task)}
                  key={task.id}
                  onDragStart={() => canUpdateTask(task) && setDraggedTaskId(task.id)}
                  onDragEnd={() => setDraggedTaskId(null)}
                >
                  <div className="campaign-task-card-top">
                    <span className={`campaign-priority-dot ${task.priority}`} />
                    <small>{task.phase}</small>
                    <GripVertical size={15} />
                  </div>
                  <strong>{task.title}</strong>
                  <div className="campaign-task-owner">
                    <span>{task.owner.slice(0, 1)}</span>
                    <div>
                      <strong>{task.owner}</strong>
                      <small>{task.team}</small>
                    </div>
                  </div>
                  <footer>
                    <span><Clock3 size={13} /> {task.end.slice(5).replace('-', '/')}</span>
                    <span>{task.progress}%</span>
                  </footer>
                </article>
              ))}
              {!columnTasks.length && <div className="campaign-board-empty">Tha task vao day</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TimelineView({ tasks, project }) {
  const { t } = useLanguage();
  const phases = [...new Set(tasks.map((task) => task.phase))];
  const timelineStart = new Date(`${project.start || new Date().toISOString().slice(0, 10)}T00:00:00`);
  const projectEnd = new Date(`${project.end || project.start || new Date().toISOString().slice(0, 10)}T00:00:00`);
  const dayCount = clamp(Math.round((projectEnd - timelineStart) / DAY_MS) + 1, 14, 60);
  const timelineDays = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(timelineStart.getTime() + index * DAY_MS);
    return {
      key: date.toISOString().slice(0, 10),
      day: date.getDate(),
      weekday: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
    };
  });
  const today = new Date().toISOString().slice(0, 10);
  const dateIndex = (date) => Math.round((new Date(`${date}T00:00:00`) - timelineStart) / DAY_MS);
  const timelineStyle = { gridTemplateColumns: `repeat(${dayCount}, minmax(40px, 1fr))` };

  return (
    <section className="panel campaign-timeline-panel">
      <div className="campaign-timeline-toolbar">
        <div>
          <span className="eyebrow">{t('common.timeline')}</span>
          <h3>Tien do va quan he cong viec</h3>
        </div>
        <div className="campaign-timeline-legend">
          <span><i className="done" /> Hoan thanh</span>
          <span><i className="active" /> Dang lam</span>
          <span><i className="future" /> Ke hoach</span>
          <span><i className="milestone" /> {t('common.milestone')}</span>
        </div>
      </div>

      <div className="campaign-gantt" style={{ gridTemplateColumns: `290px minmax(${dayCount * 40}px, 1fr)` }}>
        <div className="campaign-gantt-header campaign-gantt-task-heading">
          <strong>Cong viec</strong>
          <span>Owner</span>
        </div>
        <div className="campaign-gantt-header campaign-gantt-days" style={timelineStyle}>
          {timelineDays.map((day) => (
            <div className={day.key === today ? 'today' : ''} key={day.key}>
              <span>{day.weekday}</span>
              <strong>{day.day}</strong>
            </div>
          ))}
        </div>

        {phases.flatMap((phase) => {
          const phaseTasks = tasks.filter((task) => task.phase === phase);
          return [
            <div className="campaign-gantt-phase" key={`${phase}-label`}>
              <ChevronDown size={15} />
              <strong>{phase}</strong>
              <span>{phaseTasks.length} task</span>
            </div>,
            <div className="campaign-gantt-phase-line" key={`${phase}-line`} />,
            ...phaseTasks.flatMap((task) => {
              const start = clamp(dateIndex(task.start), 0, timelineDays.length - 1);
              const end = clamp(dateIndex(task.end), 0, timelineDays.length - 1);
              const width = Math.max(end - start + 1, 1);
              return [
                <div className="campaign-gantt-task" key={`${task.id}-label`}>
                  <span className={`campaign-priority-dot ${task.priority}`} />
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.owner}</span>
                  </div>
                </div>,
                <div className="campaign-gantt-track" style={timelineStyle} key={`${task.id}-track`}>
                  {timelineDays.map((day) => <i className={day.key === today ? 'today' : ''} key={day.key} />)}
                  {task.milestone ? (
                    <span className="campaign-milestone" style={{ gridColumn: `${start + 1}` }} title={task.title}>
                      <Flag size={13} />
                    </span>
                  ) : (
                    <span
                      className={`campaign-gantt-bar ${task.status}`}
                      style={{ gridColumn: `${start + 1} / span ${width}` }}
                    >
                      <b style={{ width: `${task.progress}%` }} />
                      <em>{task.progress}%</em>
                    </span>
                  )}
                </div>
              ];
            })
          ];
        })}
      </div>
    </section>
  );
}

export function CampaignProjectDemo({
  initialProjectId = 'showroom',
  initialView,
  focusTaskId,
  onBack,
  projects = campaignDemoProjects,
  phases = [],
  initialTasks = campaignDemoTasks,
  isManager = false,
  onCreatePhase,
  onCreateTask,
  canUpdateTask = () => true,
  onTaskStatusChange
}) {
  const { t } = useLanguage();
  const [projectId, setProjectId] = useState(initialProjectId);
  const [activeView, setActiveView] = useState(
    () => initialView || new URLSearchParams(window.location.search).get('demoTab') || 'overview'
  );
  const [tasks, setTasks] = useState(initialTasks);
  const project = projects.find((item) => item.id === projectId) || projects[0];
  const projectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === project.id),
    [project.id, tasks]
  );

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    if (initialProjectId) setProjectId(initialProjectId);
  }, [initialProjectId]);

  const moveTask = async (taskId, status) => {
    const previousTasks = tasks;
    setTasks((current) => current.map((task) => (
      task.id === taskId
        ? { ...task, status, progress: status === 'done' ? 100 : task.progress }
        : task
    )));

    try {
      await onTaskStatusChange?.(taskId, status);
    } catch {
      setTasks(previousTasks);
    }
  };

  if (!project) return null;

  return (
    <div className="campaign-project-demo">
      <ProjectHeader
        project={project}
        projects={projects}
        onProjectChange={setProjectId}
        onBack={onBack}
      />
      <ProjectSummary project={project} tasks={projectTasks} />

      <div className="campaign-view-toolbar">
        <div className="campaign-view-tabs">
          {views.map(({ id, labelKey, icon: Icon }) => (
            <button className={activeView === id ? 'active' : ''} key={id} onClick={() => setActiveView(id)}>
              <Icon size={17} />
              {t(labelKey)}
            </button>
          ))}
        </div>
        <button className="primary-action small" onClick={() => onCreateTask?.(project.id)}>
          <Plus size={16} />
          Them Task
        </button>
      </div>

      {activeView === 'overview' && (
        <OverviewView
          project={project}
          tasks={projectTasks}
          phases={phases}
          isManager={isManager}
          onCreatePhase={onCreatePhase}
        />
      )}
      {activeView === 'board' && (
        <BoardView
          tasks={projectTasks}
          onMoveTask={moveTask}
          focusTaskId={focusTaskId}
          canUpdateTask={canUpdateTask}
        />
      )}
      {activeView === 'timeline' && <TimelineView tasks={projectTasks} project={project} />}
    </div>
  );
}
