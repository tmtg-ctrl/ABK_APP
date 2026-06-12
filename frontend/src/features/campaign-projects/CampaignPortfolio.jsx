import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Flag,
  FolderKanban,
  ListTodo,
  Plus,
  Search,
  UserRoundCheck,
  Users
} from 'lucide-react';
import { FilterMenu } from '../../shared/components/FilterMenu';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import { TASK_BUCKET_LABELS, getTaskBucket, isTaskCompleted } from '../../shared/utils/tasks';

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
  const completed = actionableTasks.filter(isTaskCompleted).length;

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
  onCreateCampaign,
  onToggleTask,
  canCreateCampaign,
  canUpdateTask
}) {
  const { t } = useLanguage();
  const [taskScope, setTaskScope] = useState('all');
  const [taskQuery, setTaskQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftScope, setDraftScope] = useState('all');
  const projectById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects]
  );
  const today = new Date().toISOString().slice(0, 10);
  const campaignTasks = tasks.filter((task) => task.projectId && !task.milestone);
  const reviewTasks = campaignTasks.filter((task) => task.status === 'review');
  const delayedTasks = campaignTasks
    .filter((task) => task.end && task.end < today && !['done', 'approved'].includes(task.status))
    .map((task) => ({ ...task, delayLabel: `Tre han ${formatDate(task.end)}` }));
  const visibleTasks = campaignTasks
    .filter((task) => taskScope === 'all' || getTaskBucket(task.status) === taskScope)
    .filter((task) => `${task.title} ${task.owner} ${projectById[task.projectId]?.name || ''}`
      .toLowerCase()
      .includes(taskQuery.trim().toLowerCase()))
    .sort((a, b) => {
      if (isTaskCompleted(a) !== isTaskCompleted(b)) return isTaskCompleted(a) ? 1 : -1;
      return (a.end || '').localeCompare(b.end || '');
    });
  const activeProjects = projects.filter((project) => !['completed', 'archived'].includes(project.status));

  const openTask = (task) => {
    if (task.projectId) onOpenTask(task.projectId, task.id);
  };

  return (
    <div className="campaign-portfolio">
      <section className="portfolio-heading">
        <div>
          <span className="eyebrow">{t('campaign.eyebrow')}</span>
          <h3>Chien dich va project Marketing</h3>
          <p>Theo doi muc tieu, giai doan, milestone va tien do tong the. Lich thuc thi duoc tach sang Cong viec tuan.</p>
        </div>
        {canCreateCampaign && (
          <button className="primary-action" onClick={onCreateCampaign}>
            <Plus size={17} />
            Them chien dich
          </button>
        )}
      </section>

      <div className="portfolio-metric-grid">
        <PortfolioMetric icon={FolderKanban} label="Campaign dang chay" value={activeProjects.length} detail={`${projects.length} campaign trong portfolio`} />
        <PortfolioMetric icon={ListTodo} label="Task campaign" value={campaignTasks.length} detail={`${campaignTasks.filter(isTaskCompleted).length} task da hoan thanh`} />
        <PortfolioMetric icon={UserRoundCheck} label="Cho phe duyet" value={reviewTasks.length} detail="Can leader phan hoi" tone="amber" />
        <PortfolioMetric icon={AlertTriangle} label="Tre han" value={delayedTasks.length} detail="Can dieu chinh ke hoach" tone="red" />
      </div>

      <div className="portfolio-main-grid campaign-only">
        <section className="panel portfolio-campaign-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t('common.portfolio')}</span>
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

      <section className="panel portfolio-todo-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('campaign.worklist')}</span>
            <h3>Danh sach viec da lam va chua lam</h3>
          </div>
          <span className="count-pill">{campaignTasks.filter(isTaskCompleted).length}/{campaignTasks.length} da xong</span>
        </div>
        <div className="portfolio-todo-toolbar">
          <div className="applied-filter-summary">
            <span>{visibleTasks.length} cong viec</span>
            {taskScope !== 'all' && <b>{TASK_BUCKET_LABELS[taskScope]}</b>}
          </div>
          <div className="portfolio-filter-actions">
            <label className="portfolio-search">
              <Search size={13} />
              <input value={taskQuery} onChange={(event) => setTaskQuery(event.target.value)} placeholder="Tim viec" />
            </label>
            <FilterMenu
              open={filterOpen}
              title="Loc cong viec Campaign"
              activeCount={taskScope === 'all' ? 0 : 1}
              onOpen={() => {
                setDraftScope(taskScope);
                setFilterOpen(true);
              }}
              onClose={() => setFilterOpen(false)}
              onApply={() => {
                setTaskScope(draftScope);
                setFilterOpen(false);
              }}
              onReset={() => {
                setDraftScope('all');
                setTaskScope('all');
                setFilterOpen(false);
              }}
            >
              <div className="filter-field">
                <span>Tien do cong viec</span>
                <div className="filter-choice-grid two">
                  <button
                    type="button"
                    className={draftScope === 'all' ? 'active' : ''}
                    onClick={() => setDraftScope('all')}
                  >
                    Tat ca
                  </button>
                  {['pending', 'active', 'review', 'completed'].map((bucket) => (
                    <button
                      type="button"
                      className={draftScope === bucket ? 'active' : ''}
                      onClick={() => setDraftScope(bucket)}
                      key={bucket}
                    >
                      {TASK_BUCKET_LABELS[bucket]}
                    </button>
                  ))}
                </div>
              </div>
            </FilterMenu>
          </div>
        </div>
        <div className="portfolio-todo-list">
          {visibleTasks.map((task) => {
            const completed = isTaskCompleted(task);
            return (
              <div className={`portfolio-todo-row ${completed ? 'completed' : ''}`} key={task.id}>
                <button
                  type="button"
                  className="portfolio-check"
                  onClick={() => onToggleTask(task.id, completed ? 'todo' : 'done')}
                  disabled={!canUpdateTask(task)}
                  title={completed ? 'Mo lai cong viec' : 'Danh dau hoan thanh'}
                >
                  {completed && <CheckCircle2 size={14} />}
                </button>
                <button type="button" className="portfolio-todo-main" onClick={() => openTask(task)}>
                  <strong>{task.title}</strong>
                  <span>
                    <b>{projectById[task.projectId]?.name || 'Campaign'}</b>
                    <i>{task.owner}</i>
                    <i>{TASK_BUCKET_LABELS[getTaskBucket(task.status)]}</i>
                  </span>
                </button>
                <span className={`portfolio-priority ${task.priority}`}>{task.priority}</span>
                <span className="portfolio-due"><Clock3 size={12} /> {formatDate(task.end)}</span>
              </div>
            );
          })}
        </div>
        {!visibleTasks.length && <div className="empty-state">Khong co cong viec phu hop bo loc.</div>}
      </section>

      <div className="portfolio-alert-grid">
        <section className="panel portfolio-review-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t('campaign.approvalQueue')}</span>
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
              <span className="eyebrow">{t('campaign.attention')}</span>
              <h3>Tre han / Co rui ro</h3>
            </div>
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
