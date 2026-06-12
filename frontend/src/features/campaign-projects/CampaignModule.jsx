import { useState } from 'react';
import { FolderKanban, RefreshCw, Sparkles } from 'lucide-react';
import { EmployeeMultiSelect } from '../../shared/components/EmployeeMultiSelect';
import { InlineError } from '../../shared/components/InlineError';
import { Modal } from '../../shared/components/Modal';
import {
  MARKETING_TEAMS,
  PRIORITY_OPTIONS,
  WORK_TYPES_BY_TEAM,
  priorityLabels,
  teamLabels,
  workTypeLabels
} from '../../shared/constants/marketing';
import { apiRequest } from '../../shared/services/api';
import { CampaignPortfolio } from './CampaignPortfolio';
import { CampaignProjectDemo } from './CampaignProjectDemo';
import { useCampaignWorkspace } from './useCampaignWorkspace';

const emptyProject = {
  code: '',
  name: '',
  objective: '',
  owner_name: '',
  start_date: '',
  end_date: '',
  status: 'planning'
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
    <form className="form-stack create-form" onSubmit={submit}>
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

function PhaseForm({ project, phaseCount, token, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    order: phaseCount + 1,
    start_date: project.start_date || '',
    end_date: project.end_date || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/api/marketing/projects/${project.id}/phases`, {
        method: 'POST',
        token,
        body: form
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
    <form className="form-stack create-form" onSubmit={submit}>
      <div className="read-only-line">
        <span>Campaign</span>
        <strong>{project.name}</strong>
      </div>
      <label>
        Ten giai doan
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      </label>
      <label>
        Mo ta / ket qua cua giai doan
        <textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
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
        Tao giai doan
      </button>
    </form>
  );
}

function CampaignTaskForm({
  project,
  phases,
  employees,
  currentUser,
  isManager,
  token,
  onSaved,
  onClose
}) {
  const directory = employees.some((employee) => employee.id === currentUser.id)
    ? employees
    : [...employees, currentUser];
  const projectPhases = phases.filter((phase) => phase.project_id === project.id);
  const [form, setForm] = useState({
    title: '',
    description: '',
    deliverable: '',
    phase_id: projectPhases[0]?.id || '',
    team: 'content',
    work_type: WORK_TYPES_BY_TEAM.content[0],
    priority: 'medium',
    start_date: project.start_date || '',
    deadline: project.end_date || '',
    assignee_id: currentUser.id,
    collaborator_ids: []
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest('/api/marketing/tasks', {
        method: 'POST',
        token,
        body: {
          ...form,
          project_id: project.id,
          work_context: 'campaign',
          owner_name: directory.find((employee) => employee.id === form.assignee_id)?.email || currentUser.email,
          status: 'todo'
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
    <form className="form-stack create-form" onSubmit={submit}>
      <div className="read-only-line">
        <span>Campaign</span>
        <strong>{project.name}</strong>
      </div>
      <label>
        Ten Task
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
      </label>
      <label>
        Mo ta
        <textarea rows="2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </label>
      <label>
        Ket qua can ban giao
        <textarea rows="2" value={form.deliverable} onChange={(event) => setForm({ ...form, deliverable: event.target.value })} />
      </label>
      <div className="two-column">
        <label>
          Giai doan
          <select value={form.phase_id} onChange={(event) => setForm({ ...form, phase_id: event.target.value })}>
            <option value="">Chua xep giai doan</option>
            {projectPhases.map((phase) => (
              <option value={phase.id} key={phase.id}>{phase.name}</option>
            ))}
          </select>
        </label>
        <label>
          Uu tien
          <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
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
            onChange={(event) => {
              const team = event.target.value;
              setForm({ ...form, team, work_type: WORK_TYPES_BY_TEAM[team]?.[0] || '' });
            }}
          >
            {MARKETING_TEAMS.map((team) => (
              <option value={team} key={team}>{teamLabels[team]}</option>
            ))}
          </select>
        </label>
        <label>
          Loai cong viec
          <select value={form.work_type} onChange={(event) => setForm({ ...form, work_type: event.target.value })}>
            {(WORK_TYPES_BY_TEAM[form.team] || []).map((workType) => (
              <option value={workType} key={workType}>{workTypeLabels[workType]}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="two-column">
        <label>
          Bat dau
          <input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} />
        </label>
        <label>
          Deadline
          <input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
        </label>
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
            {directory.map((employee) => (
              <option value={employee.id} key={employee.id}>{employee.email}</option>
            ))}
          </select>
        </label>
      ) : (
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
      {error && <InlineError message={error} />}
      <button className="primary-action" disabled={saving}>
        {saving ? <RefreshCw className="spin" size={17} /> : <FolderKanban size={17} />}
        Tao Task campaign
      </button>
    </form>
  );
}

export function CampaignModule({
  token,
  isManager,
  currentUser,
  employees,
  onWorkspaceChanged
}) {
  const {
    workspace,
    projects: rawProjects,
    tasks,
    loading,
    error: loadError,
    loadWorkspace
  } = useCampaignWorkspace(token);
  const [screen, setScreen] = useState('portfolio');
  const [selection, setSelection] = useState({ projectId: null, tab: 'overview', taskId: null });
  const [showCreate, setShowCreate] = useState(false);
  const [createContext, setCreateContext] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [actionError, setActionError] = useState('');
  const projects = rawProjects.map((project) => ({
    ...project,
    budget: project.budget_label,
    health: project.health_label
  }));
  const canUpdateTask = (task) => (
    isManager
    || task.created_by === currentUser.id
    || task.assignee_id === currentUser.id
    || (task.collaborator_ids || []).includes(currentUser.id)
  );

  const seedDemo = async () => {
    setSeeding(true);
    setActionError('');
    try {
      await apiRequest('/api/marketing/projects/seed-demo', {
        method: 'POST',
        token
      });
      await loadWorkspace();
      onWorkspaceChanged?.();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSeeding(false);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    await apiRequest(`/api/marketing/tasks/${taskId}`, {
      method: 'PUT',
      token,
      body: {
        status,
        progress: status === 'done' ? 100 : ['backlog', 'todo'].includes(status) ? 0 : undefined
      }
    });
    await loadWorkspace();
    onWorkspaceChanged?.();
  };

  if (loading && !workspace.projects.length) {
    return <div className="empty-state"><RefreshCw className="spin" size={18} /> Dang tai Campaign workspace...</div>;
  }

  return (
    <>
      {(loadError || actionError) && <InlineError message={loadError || actionError} />}
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
          onCreateCampaign={() => isManager && setShowCreate(true)}
          canCreateCampaign={isManager}
          canUpdateTask={canUpdateTask}
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
          phases={workspace.phases}
          initialTasks={tasks}
          isManager={isManager}
          onCreatePhase={(projectId) => setCreateContext({ type: 'phase', projectId })}
          onCreateTask={(projectId) => setCreateContext({ type: 'task', projectId })}
          canUpdateTask={canUpdateTask}
          onTaskStatusChange={updateTaskStatus}
          onBack={() => setScreen('portfolio')}
        />
      )}

      {showCreate && (
        <Modal
          title="Tao campaign moi"
          description="Khai bao muc tieu, nguoi phu trach va moc thoi gian cua chien dich."
          className="create-modal"
          size="medium"
          onClose={() => setShowCreate(false)}
        >
          <ProjectForm token={token} onSaved={loadWorkspace} onClose={() => setShowCreate(false)} />
        </Modal>
      )}

      {createContext?.type === 'phase' && (
        <Modal
          title="Them giai doan campaign"
          description="Chia campaign thanh cac giai doan co dau ra va thoi han ro rang."
          className="create-modal"
          size="medium"
          onClose={() => setCreateContext(null)}
        >
          <PhaseForm
            project={workspace.projects.find((project) => project.id === createContext.projectId)}
            phaseCount={workspace.phases.filter((phase) => phase.project_id === createContext.projectId).length}
            token={token}
            onSaved={async () => {
              await loadWorkspace();
              onWorkspaceChanged?.();
            }}
            onClose={() => setCreateContext(null)}
          />
        </Modal>
      )}

      {createContext?.type === 'task' && (
        <Modal
          title="Them Task vao campaign"
          description="Tao cong viec, giao nguoi phu trach va gan vao giai doan phu hop."
          className="create-modal"
          size="large"
          onClose={() => setCreateContext(null)}
        >
          <CampaignTaskForm
            project={workspace.projects.find((project) => project.id === createContext.projectId)}
            phases={workspace.phases}
            employees={employees}
            currentUser={currentUser}
            isManager={isManager}
            token={token}
            onSaved={async () => {
              await loadWorkspace();
              onWorkspaceChanged?.();
            }}
            onClose={() => setCreateContext(null)}
          />
        </Modal>
      )}
    </>
  );
}
