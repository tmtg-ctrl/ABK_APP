import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Filter,
  Flag,
  FolderKanban,
  ListTodo,
  Plus,
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

export function CampaignPortfolio({
  projects,
  tasks,
  onOpenCampaign,
  onOpenTask,
  onCreateCampaign
}) {
  const projectById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects]
  );
  const today = new Date().toISOString().slice(0, 10);
  const reviewTasks = tasks.filter((task) => task.status === 'review');
  const delayedTasks = tasks
    .filter((task) => task.end && task.end < today && !['done', 'approved'].includes(task.status))
    .map((task) => ({ ...task, delayLabel: `Tre han ${formatDate(task.end)}` }));
  const campaignTasks = tasks.filter((task) => task.projectId && !task.milestone);
  const activeProjects = projects.filter((project) => !['completed', 'archived'].includes(project.status));

  const openTask = (task) => {
    if (task.projectId) onOpenTask(task.projectId, task.id);
  };

  return (
    <div className="campaign-portfolio">
      <section className="portfolio-heading">
        <div>
          <span className="eyebrow">Marketing portfolio</span>
          <h3>Chien dich va project Marketing</h3>
          <p>Theo doi muc tieu, giai doan, milestone va tien do tong the. Lich thuc thi duoc tach sang Cong viec tuan.</p>
        </div>
        <button className="primary-action" onClick={onCreateCampaign}>
          <Plus size={17} />
          Tao campaign
        </button>
      </section>

      <div className="portfolio-metric-grid">
        <PortfolioMetric icon={FolderKanban} label="Campaign dang chay" value={activeProjects.length} detail={`${projects.length} campaign trong portfolio`} />
        <PortfolioMetric icon={ListTodo} label="Task campaign" value={campaignTasks.length} detail={`${campaignTasks.filter((task) => task.status === 'done').length} task da hoan thanh`} />
        <PortfolioMetric icon={UserRoundCheck} label="Cho phe duyet" value={reviewTasks.length} detail="Can leader phan hoi" tone="amber" />
        <PortfolioMetric icon={AlertTriangle} label="Tre han" value={delayedTasks.length} detail="Can dieu chinh ke hoach" tone="red" />
      </div>

      <div className="portfolio-main-grid campaign-only">
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
