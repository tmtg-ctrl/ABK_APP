import { useEffect, useMemo, useState } from 'react';
import { FolderKanban, RefreshCw, Sparkles } from 'lucide-react';
import { InlineError } from '../../shared/components/InlineError';
import { Modal } from '../../shared/components/Modal';
import { apiRequest } from '../../shared/services/api';
import { CampaignPortfolio } from './CampaignPortfolio';
import { CampaignProjectDemo } from './CampaignProjectDemo';

const emptyProject = {
  code: '',
  name: '',
  objective: '',
  owner_name: '',
  start_date: '',
  end_date: '',
  status: 'planning'
};

const healthLabels = {
  on_track: 'Dung tien do',
  at_risk: 'Can theo doi',
  off_track: 'Co rui ro'
};

const formatWeekLabel = (plan) => {
  if (!plan?.week_start || !plan?.week_end) return '';
  const format = (date) => {
    const [, month, day] = date.split('-');
    return `${day}/${month}`;
  };
  return `${format(plan.week_start)} - ${format(plan.week_end)}`;
};

function ProjectForm({ token, onSaved, onClose }) {
  const [form, setForm] = useState(emptyProject);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest('/api/marketing/projects', {
        method: 'POST',
        token,
        body: {
          ...form,
          start_date: form.start_date || null,
          end_date: form.end_date || null
        }
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="two-column">
        <label>
          Ma campaign
          <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="CAM-2606" />
        </label>
        <label>
          Trang thai
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="planning">Planning</option>
            <option value="active">Dang chay</option>
            <option value="paused">Tam dung</option>
          </select>
        </label>
      </div>
      <label>
        Ten campaign
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      </label>
      <label>
        Muc tieu
        <textarea rows="3" value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} />
      </label>
      <label>
        Project owner
        <input value={form.owner_name} onChange={(event) => setForm({ ...form, owner_name: event.target.value })} />
      </label>
      <div className="two-column">
        <label>
          Bat dau
          <input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} />
        </label>
        <label>
          Ket thuc
          <input type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} />
        </label>
      </div>
      {error && <InlineError message={error} />}
      <button className="primary-action" disabled={saving}>
        {saving ? <RefreshCw className="spin" size={17} /> : <FolderKanban size={17} />}
        Tao campaign
      </button>
    </form>
  );
}

export function CampaignModule({ token, currentUser, isManager, onWorkspaceChanged }) {
  const [workspace, setWorkspace] = useState({
    projects: [],
    phases: [],
    tasks: [],
    weekly_plans: []
  });
  const [screen, setScreen] = useState('portfolio');
  const [selection, setSelection] = useState({ projectId: null, tab: 'overview', taskId: null });
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  const loadWorkspace = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/api/marketing/projects', { token });
      setWorkspace({
        projects: data.projects || [],
        phases: data.phases || [],
        tasks: data.tasks || [],
        weekly_plans: data.weekly_plans || []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const projects = useMemo(() => workspace.projects.map((project) => ({
    ...project,
    owner: project.owner_name || 'Chua gan owner',
    start: project.start_date || '',
    end: project.end_date || '',
    budget: project.budget ? `${project.budget.toLocaleString('vi-VN')} VND` : 'Chua cap nhat',
    health: healthLabels[project.health] || project.health,
    progress: Number(project.progress || 0)
  })), [workspace.projects]);

  const tasks = useMemo(() => {
    const phaseById = Object.fromEntries(workspace.phases.map((phase) => [phase.id, phase]));
    const projectById = Object.fromEntries(projects.map((project) => [project.id, project]));
    return workspace.tasks.map((task) => {
      const project = projectById[task.project_id];
      return {
        ...task,
        projectId: task.project_id,
        phase: phaseById[task.phase_id]?.name || (task.project_id ? 'Chua xep phase' : 'Van hanh'),
        owner: task.owner_name || task.assignee_id || 'Chua giao',
        assigneeId: task.assignee_id,
        team: task.team || 'all',
        start: task.start_date || task.deadline || project?.start || new Date().toISOString().slice(0, 10),
        end: task.deadline || task.start_date || project?.end || new Date().toISOString().slice(0, 10),
        dependency: task.dependency_id,
        milestone: task.item_type === 'milestone',
        progress: Number(task.progress || (task.status === 'done' ? 100 : 0))
      };
    });
  }, [workspace.tasks, workspace.phases, projects]);

  const currentPlan = useMemo(
    () => [...workspace.weekly_plans].sort((a, b) => (b.week_start || '').localeCompare(a.week_start || ''))[0],
    [workspace.weekly_plans]
  );
  const weeklyTaskIds = currentPlan?.allocations?.map((allocation) => allocation.task_id);

  const seedDemo = async () => {
    setSeeding(true);
    setError('');
    try {
      const result = await apiRequest('/api/marketing/projects/seed-demo', {
        method: 'POST',
        token
      });
      setWorkspace(result.workspace);
      onWorkspaceChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    await apiRequest(`/api/marketing/tasks/${taskId}`, {
      method: 'PUT',
      token,
      body: { status, progress: status === 'done' ? 100 : undefined }
    });
    await loadWorkspace();
    onWorkspaceChanged?.();
  };

  if (loading && !workspace.projects.length) {
    return <div className="empty-state"><RefreshCw className="spin" size={18} /> Dang tai Campaign workspace...</div>;
  }

  return (
    <>
      {error && <InlineError message={error} />}
      {!projects.length ? (
        <section className="panel campaign-empty-workspace">
          <FolderKanban size={36} />
          <h3>Campaign workspace chua co du lieu</h3>
          <p>Tao bo du lieu mau de xem luong Campaign - Phase - Task - Weekly Plan hoat dong tren du lieu that.</p>
          {isManager && (
            <button className="primary-action" onClick={seedDemo} disabled={seeding}>
              {seeding ? <RefreshCw className="spin" size={17} /> : <Sparkles size={17} />}
              Tao du lieu mau
            </button>
          )}
        </section>
      ) : screen === 'portfolio' ? (
        <CampaignPortfolio
          projects={projects}
          tasks={tasks}
          weeklyTaskIds={weeklyTaskIds}
          weekLabel={formatWeekLabel(currentPlan)}
          currentUser={currentUser}
          onCreateCampaign={() => isManager && setShowCreate(true)}
          onToggleTask={updateTaskStatus}
          onOpenCampaign={(projectId) => {
            setSelection({ projectId, tab: 'overview', taskId: null });
            setScreen('detail');
          }}
          onOpenTask={(projectId, taskId) => {
            setSelection({ projectId, tab: 'board', taskId });
            setScreen('detail');
          }}
        />
      ) : (
        <CampaignProjectDemo
          initialProjectId={selection.projectId}
          initialView={selection.tab}
          focusTaskId={selection.taskId}
          projects={projects}
          initialTasks={tasks}
          onTaskStatusChange={updateTaskStatus}
          onBack={() => setScreen('portfolio')}
        />
      )}

      {showCreate && (
        <Modal title="Tao campaign moi" onClose={() => setShowCreate(false)}>
          <ProjectForm token={token} onSaved={loadWorkspace} onClose={() => setShowCreate(false)} />
        </Modal>
      )}
    </>
  );
}
