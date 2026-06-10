import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../shared/services/api';

const healthLabels = {
  on_track: 'Dung tien do',
  at_risk: 'Can theo doi',
  off_track: 'Co rui ro'
};

export const formatShortDate = (date) => {
  if (!date) return '--/--';
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
};

export const formatWeekLabel = (plan) => (
  plan?.week_start && plan?.week_end
    ? `${formatShortDate(plan.week_start)} - ${formatShortDate(plan.week_end)}`
    : ''
);

export const getWeekRange = (date = new Date()) => {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - ((day + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const toLocalDate = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const dateValue = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${dateValue}`;
  };
  return { weekStart: toLocalDate(start), weekEnd: toLocalDate(end) };
};

export function useCampaignWorkspace(token) {
  const [workspace, setWorkspace] = useState({
    projects: [],
    phases: [],
    tasks: [],
    weekly_plans: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWorkspace = useCallback(async () => {
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
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadWorkspace().catch(() => {});
  }, [loadWorkspace]);

  const projects = useMemo(() => workspace.projects.map((project) => ({
    ...project,
    owner: project.owner_name || 'Chua gan owner',
    start: project.start_date || '',
    end: project.end_date || '',
    budget_label: project.budget ? `${project.budget.toLocaleString('vi-VN')} VND` : 'Chua cap nhat',
    health_label: healthLabels[project.health] || project.health,
    progress: Number(project.progress || 0)
  })), [workspace.projects]);

  const tasks = useMemo(() => {
    const phaseById = Object.fromEntries(workspace.phases.map((phase) => [phase.id, phase]));
    const projectById = Object.fromEntries(projects.map((project) => [project.id, project]));
    const today = new Date().toISOString().slice(0, 10);

    return workspace.tasks.map((task) => {
      const project = projectById[task.project_id];
      return {
        ...task,
        projectId: task.project_id,
        phase: phaseById[task.phase_id]?.name || (task.project_id ? 'Chua xep phase' : 'Van hanh'),
        owner: task.owner_name || task.assignee_id || 'Chua giao',
        assigneeId: task.assignee_id,
        team: task.team || 'all',
        start: task.start_date || task.deadline || project?.start || today,
        end: task.deadline || task.start_date || project?.end || today,
        dependency: task.dependency_id,
        milestone: task.item_type === 'milestone',
        progress: Number(task.progress || (task.status === 'done' ? 100 : 0))
      };
    });
  }, [workspace.tasks, workspace.phases, projects]);

  return {
    workspace,
    projects,
    tasks,
    weeklyPlans: workspace.weekly_plans,
    loading,
    error,
    setError,
    loadWorkspace
  };
}
