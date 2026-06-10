import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
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

const DAY_MS = 24 * 60 * 60 * 1000;
const TIMELINE_START = new Date('2026-06-08T00:00:00');
const TIMELINE_DAYS = Array.from({ length: 21 }, (_, index) => {
  const date = new Date(TIMELINE_START.getTime() + index * DAY_MS);
  return {
    key: date.toISOString().slice(0, 10),
    day: date.getDate(),
    weekday: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
  };
});

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
  { id: 'backlog', label: 'Backlog', description: 'Chua dua vao tuan' },
  { id: 'todo', label: 'Can lam', description: 'Da cam ket thuc hien' },
  { id: 'doing', label: 'Dang lam', description: 'Dang duoc xu ly' },
  { id: 'review', label: 'Cho duyet', description: 'Can quan ly phan hoi' },
  { id: 'done', label: 'Hoan thanh', description: 'Da dong viec' }
];

const views = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'board', label: 'Board', icon: KanbanSquare },
  { id: 'timeline', label: 'Timeline', icon: GanttChartSquare },
  { id: 'weekly', label: 'Weekly plan', icon: CalendarDays }
];

const getDateIndex = (date) => Math.round((new Date(`${date}T00:00:00`) - TIMELINE_START) / DAY_MS);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function ProjectHeader({ project, projects, onProjectChange, onBack }) {
  return (
    <section className="campaign-project-hero">
      <div>
        <div className="campaign-project-kicker">
          {onBack && (
            <button className="campaign-back-action" onClick={onBack}>
              <ArrowLeft size={14} />
              Portfolio
            </button>
          )}
          <span className="campaign-demo-pill">LIVE</span>
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
  const completed = tasks.filter((task) => task.status === 'done').length;
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

function OverviewView({ project, tasks }) {
  const phases = [...new Set(tasks.map((task) => task.phase))];

  return (
    <div className="campaign-overview-grid">
      <section className="panel campaign-plan-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Project structure</span>
            <h3>Giai doan va deliverable</h3>
          </div>
          <button className="secondary-action compact-action">
            <Plus size={15} />
            Them phase
          </button>
        </div>
        <div className="campaign-phase-list">
          {phases.map((phase, phaseIndex) => {
            const phaseTasks = tasks.filter((task) => task.phase === phase);
            const completed = phaseTasks.filter((task) => task.status === 'done').length;
            const progress = Math.round(phaseTasks.reduce((sum, task) => sum + task.progress, 0) / phaseTasks.length);

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
        <span className="eyebrow">Project brief</span>
        <h3>Thong tin dieu hanh</h3>
        <div className="campaign-info-list">
          <div><span>Project owner</span><strong>{project.owner}</strong></div>
          <div><span>Sponsor</span><strong>{project.sponsor}</strong></div>
          <div><span>Thoi gian</span><strong>{project.start} - {project.end}</strong></div>
          <div><span>Ngan sach</span><strong>{project.budget}</strong></div>
        </div>
        <div className="campaign-next-milestone">
          <Flag size={19} />
          <div>
            <span>Milestone tiep theo</span>
            <strong>Tong duyet chuong trinh</strong>
            <small>26/06/2026 - con 16 ngay</small>
          </div>
        </div>
      </section>
    </div>
  );
}

function BoardView({ tasks, onMoveTask, focusTaskId }) {
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
                  draggable
                  key={task.id}
                  onDragStart={() => setDraggedTaskId(task.id)}
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

function TimelineView({ tasks }) {
  const phases = [...new Set(tasks.map((task) => task.phase))];

  return (
    <section className="panel campaign-timeline-panel">
      <div className="campaign-timeline-toolbar">
        <div>
          <span className="eyebrow">Microsoft Project style</span>
          <h3>Timeline va dependency</h3>
        </div>
        <div className="campaign-timeline-legend">
          <span><i className="done" /> Hoan thanh</span>
          <span><i className="active" /> Dang lam</span>
          <span><i className="future" /> Ke hoach</span>
          <span><i className="milestone" /> Milestone</span>
        </div>
      </div>

      <div className="campaign-gantt">
        <div className="campaign-gantt-header campaign-gantt-task-heading">
          <strong>Cong viec</strong>
          <span>Owner</span>
        </div>
        <div className="campaign-gantt-header campaign-gantt-days">
          {TIMELINE_DAYS.map((day) => (
            <div className={day.key === '2026-06-10' ? 'today' : ''} key={day.key}>
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
              const start = clamp(getDateIndex(task.start), 0, TIMELINE_DAYS.length - 1);
              const end = clamp(getDateIndex(task.end), 0, TIMELINE_DAYS.length - 1);
              const width = Math.max(end - start + 1, 1);
              return [
                <div className="campaign-gantt-task" key={`${task.id}-label`}>
                  <span className={`campaign-priority-dot ${task.priority}`} />
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.owner}</span>
                  </div>
                </div>,
                <div className="campaign-gantt-track" key={`${task.id}-track`}>
                  {TIMELINE_DAYS.map((day) => <i className={day.key === '2026-06-10' ? 'today' : ''} key={day.key} />)}
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

function WeeklyView({ tasks }) {
  const people = [...new Set(tasks.map((task) => task.owner))];
  const weekDays = TIMELINE_DAYS.slice(0, 7);

  return (
    <div className="campaign-weekly-layout">
      <section className="panel campaign-weekly-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Weekly planning</span>
            <h3>Tuan 08/06 - 14/06</h3>
          </div>
          <button className="primary-action small">
            <CheckCircle2 size={16} />
            Chot ke hoach tuan
          </button>
        </div>
        <div className="campaign-week-grid">
          <div className="campaign-week-person heading">Nhan su</div>
          {weekDays.map((day) => (
            <div className={`campaign-week-day heading ${day.key === '2026-06-10' ? 'today' : ''}`} key={day.key}>
              <span>{day.weekday}</span>
              <strong>{day.day}/06</strong>
            </div>
          ))}
          {people.map((person) => {
            const personTasks = tasks.filter((task) => task.owner === person);
            const workload = personTasks.reduce((sum, task) => sum + Math.max(getDateIndex(task.end) - getDateIndex(task.start) + 1, 1), 0);
            return [
              <div className="campaign-week-person" key={`${person}-name`}>
                <span>{person.slice(0, 1)}</span>
                <div>
                  <strong>{person}</strong>
                  <small>{workload > 7 ? 'Qua tai' : 'Con kha dung'}</small>
                </div>
              </div>,
              ...weekDays.map((day) => {
                const dayTasks = personTasks.filter((task) => day.key >= task.start && day.key <= task.end);
                return (
                  <div className={`campaign-week-day ${day.key === '2026-06-10' ? 'today' : ''}`} key={`${person}-${day.key}`}>
                    {dayTasks.slice(0, 2).map((task) => (
                      <span className={`campaign-week-chip ${task.team.toLowerCase()}`} key={task.id} title={task.title}>
                        {task.title}
                      </span>
                    ))}
                    {dayTasks.length > 2 && <small>+{dayTasks.length - 2}</small>}
                  </div>
                );
              })
            ];
          })}
        </div>
      </section>

      <section className="panel campaign-workload-panel">
        <span className="eyebrow">Capacity</span>
        <h3>Tai cong viec</h3>
        <div className="campaign-workload-list">
          {people.map((person, index) => {
            const load = [92, 74, 63, 48, 39, 32][index] || 28;
            return (
              <div key={person}>
                <span><strong>{person}</strong><b>{load}%</b></span>
                <div className="campaign-progress-track">
                  <i className={load > 85 ? 'overload' : ''} style={{ width: `${load}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="campaign-capacity-note">
          <AlertTriangle size={17} />
          <p><strong>Nguyen Ha dang qua tai.</strong> Nen chuyen mot bai countdown cho team Content ho tro.</p>
        </div>
      </section>
    </div>
  );
}

export function CampaignProjectDemo({
  initialProjectId = 'showroom',
  initialView,
  focusTaskId,
  onBack,
  projects = campaignDemoProjects,
  initialTasks = campaignDemoTasks,
  onTaskStatusChange
}) {
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

      <div className="campaign-view-tabs">
        {views.map(({ id, label, icon: Icon }) => (
          <button className={activeView === id ? 'active' : ''} key={id} onClick={() => setActiveView(id)}>
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      {activeView === 'overview' && <OverviewView project={project} tasks={projectTasks} />}
      {activeView === 'board' && (
        <BoardView tasks={projectTasks} onMoveTask={moveTask} focusTaskId={focusTaskId} />
      )}
      {activeView === 'timeline' && <TimelineView tasks={projectTasks} />}
      {activeView === 'weekly' && <WeeklyView tasks={projectTasks} />}
    </div>
  );
}
