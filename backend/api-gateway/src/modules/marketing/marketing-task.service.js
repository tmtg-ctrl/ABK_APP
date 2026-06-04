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
    assignee_id: task.data?.assignee_id || null,
    deadline: task.data?.deadline || null,
    status: task.status,
    department: task.data?.department || 'marketing',
    created_by: task.user_id,
    created_at: task.created_at,
    updated_at: task.data?.updated_at || null
  };
};

const createMarketingTask = async ({ title, description, priority, assigneeId, deadline, status, userId }) => {
  const now = new Date().toISOString();
  const taskId = crypto.randomUUID();

  const payload = {
    title,
    description: description || '',
    priority: priority || 'medium',
    assignee_id: assigneeId || null,
    deadline: deadline || null,
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

  const nextData = {
    title: updates.title ?? existing.title,
    description: updates.description ?? existing.description,
    priority: updates.priority ?? existing.priority,
    assignee_id: updates.assigneeId ?? existing.assignee_id,
    deadline: updates.deadline ?? existing.deadline,
    department: 'marketing',
    created_at: existing.created_at,
    updated_at: new Date().toISOString()
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
