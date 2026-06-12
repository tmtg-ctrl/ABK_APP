const crypto = require('crypto');
const supabase = require('../../config/supabase');

const MARKETING_TASK_TYPE = 'marketing_task';

const normalizeMarketingTask = (task) => {
  if (!task) {
    return null;
  }

  return {
    id: task.id,
    title: task.data?.title || '',
    description: task.data?.description || '',
    priority: task.data?.priority || 'medium',
    team: task.data?.team || 'media',
    work_type: task.data?.work_type || null,
    work_context: task.data?.work_context || (task.data?.project_id ? 'campaign' : 'operation'),
    item_type: task.data?.item_type || 'task',
    project_id: task.data?.project_id || null,
    phase_id: task.data?.phase_id || null,
    deliverable: task.data?.deliverable || '',
    assignee_id: task.data?.assignee_id || null,
    owner_name: task.data?.owner_name || '',
    collaborator_ids: Array.isArray(task.data?.collaborator_ids) ? task.data.collaborator_ids : [],
    approver_id: task.data?.approver_id || null,
    creator_name: task.data?.creator_name || '',
    assigned_by_id: task.data?.assigned_by_id || task.user_id,
    assigned_by_name: task.data?.assigned_by_name || '',
    updated_by_id: task.data?.updated_by_id || null,
    updated_by_name: task.data?.updated_by_name || '',
    activity: Array.isArray(task.data?.activity) ? task.data.activity : [],
    completed_at: task.data?.completed_at || null,
    start_date: task.data?.start_date || null,
    deadline: task.data?.deadline || null,
    progress: Number(task.data?.progress || 0),
    dependency_id: task.data?.dependency_id || null,
    subtasks: task.data?.subtasks || [],
    checklist: task.data?.checklist || [],
    status: task.status,
    department: task.data?.department || 'marketing',
    created_by: task.user_id,
    created_at: task.created_at,
    updated_at: task.data?.updated_at || null
  };
};

const createMarketingTask = async ({
  title,
  description,
  priority,
  team,
  workType,
  workContext,
  itemType,
  projectId,
  phaseId,
  deliverable,
  assigneeId,
  ownerName,
  collaboratorIds,
  approverId,
  creatorName,
  assignedById,
  assignedByName,
  startDate,
  deadline,
  progress,
  dependencyId,
  subtasks,
  checklist,
  status,
  userId
}) => {
  const now = new Date().toISOString();
  const taskId = crypto.randomUUID();

  const payload = {
    title,
    description: description || '',
    priority: priority || 'medium',
    team: team || 'media',
    work_type: workType || null,
    work_context: workContext || (projectId ? 'campaign' : 'operation'),
    item_type: itemType || 'task',
    project_id: projectId || null,
    phase_id: phaseId || null,
    deliverable: deliverable || '',
    assignee_id: assigneeId || null,
    owner_name: ownerName || '',
    collaborator_ids: collaboratorIds || [],
    approver_id: approverId || null,
    creator_name: creatorName || '',
    assigned_by_id: assignedById || userId,
    assigned_by_name: assignedByName || creatorName || '',
    updated_by_id: userId,
    updated_by_name: creatorName || '',
    activity: [{
      id: crypto.randomUUID(),
      action: 'created',
      actor_id: userId,
      actor_name: creatorName || '',
      created_at: now
    }],
    completed_at: ['approved', 'done'].includes(status) ? now : null,
    start_date: startDate || null,
    deadline: deadline || null,
    progress: Number(progress ?? (['approved', 'done'].includes(status) ? 100 : 0)),
    dependency_id: dependencyId || null,
    subtasks: subtasks || [],
    checklist: checklist || [],
    department: 'marketing',
    created_at: now,
    updated_at: now
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        id: taskId,
        task_type: MARKETING_TASK_TYPE,
        data: payload,
        status: status || 'todo',
        created_at: now,
        user_id: userId
      }
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeMarketingTask(data);
};

const listMarketingTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('task_type', MARKETING_TASK_TYPE)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(normalizeMarketingTask);
};

const getMarketingTaskById = async (taskId) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('task_type', MARKETING_TASK_TYPE)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return normalizeMarketingTask(data);
};

const updateMarketingTask = async (taskId, updates) => {
  const existing = await getMarketingTaskById(taskId);

  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const changedFields = [
    ['title', updates.title, existing.title],
    ['description', updates.description, existing.description],
    ['priority', updates.priority, existing.priority],
    ['team', updates.team, existing.team],
    ['work_type', updates.workType, existing.work_type],
    ['work_context', updates.workContext, existing.work_context],
    ['item_type', updates.itemType, existing.item_type],
    ['project_id', updates.projectId, existing.project_id],
    ['phase_id', updates.phaseId, existing.phase_id],
    ['deliverable', updates.deliverable, existing.deliverable],
    ['status', updates.status, existing.status],
    ['assignee_id', updates.assigneeId, existing.assignee_id],
    ['owner_name', updates.ownerName, existing.owner_name],
    ['collaborator_ids', updates.collaboratorIds, existing.collaborator_ids],
    ['approver_id', updates.approverId, existing.approver_id],
    ['start_date', updates.startDate, existing.start_date],
    ['deadline', updates.deadline, existing.deadline],
    ['progress', updates.progress, existing.progress],
    ['dependency_id', updates.dependencyId, existing.dependency_id],
    ['subtasks', updates.subtasks, existing.subtasks],
    ['checklist', updates.checklist, existing.checklist]
  ]
    .filter(([, value, current]) => value !== undefined && JSON.stringify(value) !== JSON.stringify(current))
    .map(([field]) => field);
  const nextActivity = changedFields.length
    ? [
        ...existing.activity,
        {
          id: crypto.randomUUID(),
          action: 'updated',
          fields: changedFields,
          actor_id: updates.actorId || null,
          actor_name: updates.actorName || '',
          created_at: now
        }
      ].slice(-50)
    : existing.activity;

  const nextData = {
    title: updates.title ?? existing.title,
    description: updates.description ?? existing.description,
    priority: updates.priority ?? existing.priority,
    team: updates.team ?? existing.team,
    work_type: updates.workType ?? existing.work_type,
    work_context: updates.workContext ?? existing.work_context,
    item_type: updates.itemType ?? existing.item_type,
    project_id: updates.projectId === undefined ? existing.project_id : updates.projectId || null,
    phase_id: updates.phaseId === undefined ? existing.phase_id : updates.phaseId || null,
    deliverable: updates.deliverable ?? existing.deliverable,
    assignee_id: updates.assigneeId === undefined ? existing.assignee_id : updates.assigneeId || null,
    owner_name: updates.ownerName ?? existing.owner_name,
    collaborator_ids: updates.collaboratorIds ?? existing.collaborator_ids,
    approver_id: updates.approverId === undefined ? existing.approver_id : updates.approverId || null,
    creator_name: existing.creator_name,
    assigned_by_id: updates.assignedById ?? existing.assigned_by_id,
    assigned_by_name: updates.assignedByName ?? existing.assigned_by_name,
    updated_by_id: updates.actorId || existing.updated_by_id,
    updated_by_name: updates.actorName || existing.updated_by_name,
    activity: nextActivity,
    completed_at: updates.status === undefined
      ? existing.completed_at
      : ['approved', 'done'].includes(updates.status)
        ? existing.completed_at || now
        : null,
    start_date: updates.startDate === undefined ? existing.start_date : updates.startDate || null,
    deadline: updates.deadline ?? existing.deadline,
    progress: updates.progress
      ?? (['approved', 'done'].includes(updates.status)
        ? 100
        : ['backlog', 'todo'].includes(updates.status) && ['approved', 'done'].includes(existing.status)
          ? 0
          : existing.progress),
    dependency_id: updates.dependencyId === undefined ? existing.dependency_id : updates.dependencyId || null,
    subtasks: updates.subtasks ?? existing.subtasks,
    checklist: updates.checklist ?? existing.checklist,
    department: 'marketing',
    created_at: existing.created_at,
    updated_at: now
  };

  const updatePayload = {
    data: nextData
  };

  if (updates.status) {
    updatePayload.status = updates.status;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', taskId)
    .eq('task_type', MARKETING_TASK_TYPE)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeMarketingTask(data);
};

const deleteMarketingTask = async (taskId) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('task_type', MARKETING_TASK_TYPE);

  if (error) {
    throw error;
  }

  return { success: true };
};

module.exports = {
  createMarketingTask,
  listMarketingTasks,
  getMarketingTaskById,
  updateMarketingTask,
  deleteMarketingTask
};
