const supabase = require('../../config/supabase');

const createTaskMetadata = async ({ taskId, taskType, data, status, createdAt, userId }) => {
  const { data: inserted, error } = await supabase
    .from('tasks')
    .insert([
      {
        id: taskId,
        task_type: taskType,
        data,
        status,
        created_at: createdAt,
        user_id: userId
      }
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return inserted;
};

const updateTaskStatus = async (taskId, status, workerResponse) => {
  const updatePayload = { status };
  if (workerResponse !== undefined) {
    updatePayload.worker_response = workerResponse;
  }

  const { data: updated, error } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return updated;
};

const getTaskById = async (taskId) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

const listTasks = async (userId) => {
  let query = supabase
    .from('tasks')
    .select('*');

  // If userId provided, filter by user_id (tasks created by this user)
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

const assignTaskUser = async (taskId, userId, role = 'collaborator') => {
  const { data: inserted, error } = await supabase
    .from('task_assignees')
    .insert([
      {
        task_id: taskId,
        user_id: userId,
        role
      }
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return inserted;
};

const removeTaskAssignee = async (taskId, userId) => {
  const { error } = await supabase
    .from('task_assignees')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return { success: true };
};

const getTaskAssignees = async (taskId) => {
  const { data, error } = await supabase
    .from('task_assignees')
    .select('user_id, role, assigned_at')
    .eq('task_id', taskId);

  if (error) {
    throw error;
  }

  return data;
};

const getUserTasks = async (userId) => {
  // Get tasks created by user OR assigned to user
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_assignees!left(*)
    `)
    .or(`user_id.eq.${userId},task_assignees.user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  createTaskMetadata,
  updateTaskStatus,
  getTaskById,
  listTasks,
  assignTaskUser,
  removeTaskAssignee,
  getTaskAssignees,
  getUserTasks
};
