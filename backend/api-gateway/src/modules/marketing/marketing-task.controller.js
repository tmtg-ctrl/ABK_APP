const {
  createMarketingTask,
  listMarketingTasks,
  getMarketingTaskById,
  updateMarketingTask,
  deleteMarketingTask
} = require('./marketing-task.service');

const VALID_STATUSES = new Set(['todo', 'doing', 'review', 'approved', 'done']);
const VALID_PRIORITIES = new Set(['low', 'medium', 'high']);
const VALID_TEAMS = new Set(['media', 'sale', 'content']);
const MANAGER_ROLES = new Set(['admin', 'marketing_manager', 'department_manager']);

const getUserRole = (req) => req.user?.app_metadata?.role || 'staff';
const getUserDepartment = (req) => req.user?.app_metadata?.department || null;
const isMarketingUser = (req) => getUserRole(req) === 'admin' || getUserDepartment(req) === 'marketing';
const canManageMarketing = (req) => MANAGER_ROLES.has(getUserRole(req));

const canAccessTask = (req, task) => {
  if (canManageMarketing(req)) {
    return true;
  }

  return task.created_by === req.user.id || task.assignee_id === req.user.id;
};

const requireMarketingAccess = (req, res) => {
  if (!isMarketingUser(req)) {
    res.status(403).json({ error: 'Marketing department access required' });
    return false;
  }

  return true;
};

exports.createTask = async (req, res, next) => {
  try {
    if (!requireMarketingAccess(req, res)) {
      return;
    }

    const { title, description, priority, team, work_type, assignee_id, deadline, status } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    if (priority && !VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({ error: 'priority must be low, medium, or high' });
    }

    if (status && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'status must be todo, doing, review, approved, or done' });
    }

    if (team && !VALID_TEAMS.has(team)) {
      return res.status(400).json({ error: 'team must be media, sale, or content' });
    }

    const task = await createMarketingTask({
      title,
      description,
      priority,
      team,
      workType: work_type,
      assigneeId: assignee_id,
      deadline,
      status,
      userId: req.user.id
    });

    res.status(201).json({
      message: 'Marketing task created successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

exports.listTasks = async (req, res, next) => {
  try {
    if (!requireMarketingAccess(req, res)) {
      return;
    }

    const tasks = await listMarketingTasks();
    const visibleTasks = canManageMarketing(req)
      ? tasks
      : tasks.filter((task) => canAccessTask(req, task));

    res.status(200).json({
      total: visibleTasks.length,
      tasks: visibleTasks
    });
  } catch (error) {
    next(error);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    if (!requireMarketingAccess(req, res)) {
      return;
    }

    const task = await getMarketingTaskById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: 'Marketing task not found' });
    }

    if (!canAccessTask(req, task)) {
      return res.status(403).json({ error: 'You do not have access to this marketing task' });
    }

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    if (!requireMarketingAccess(req, res)) {
      return;
    }

    const existing = await getMarketingTaskById(req.params.taskId);

    if (!existing) {
      return res.status(404).json({ error: 'Marketing task not found' });
    }

    if (!canAccessTask(req, existing)) {
      return res.status(403).json({ error: 'You do not have access to this marketing task' });
    }

    const { title, description, priority, team, work_type, assignee_id, deadline, status } = req.body;

    if (assignee_id !== undefined && !canManageMarketing(req)) {
      return res.status(403).json({ error: 'Marketing manager permission required to assign tasks' });
    }

    if (priority && !VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({ error: 'priority must be low, medium, or high' });
    }

    if (status && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'status must be todo, doing, review, approved, or done' });
    }

    if (team && !VALID_TEAMS.has(team)) {
      return res.status(400).json({ error: 'team must be media, sale, or content' });
    }

    const task = await updateMarketingTask(req.params.taskId, {
      title,
      description,
      priority,
      team,
      workType: work_type,
      assigneeId: assignee_id,
      deadline,
      status
    });

    res.status(200).json({
      message: 'Marketing task updated successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

exports.assignTask = async (req, res, next) => {
  try {
    if (!requireMarketingAccess(req, res)) {
      return;
    }

    if (!canManageMarketing(req)) {
      return res.status(403).json({ error: 'Marketing manager permission required' });
    }

    const existing = await getMarketingTaskById(req.params.taskId);

    if (!existing) {
      return res.status(404).json({ error: 'Marketing task not found' });
    }

    const { assignee_id } = req.body;

    if (!assignee_id) {
      return res.status(400).json({ error: 'assignee_id is required' });
    }

    const task = await updateMarketingTask(req.params.taskId, {
      assigneeId: assignee_id
    });

    res.status(200).json({
      message: 'Marketing task assigned successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    if (!requireMarketingAccess(req, res)) {
      return;
    }

    if (!canManageMarketing(req)) {
      return res.status(403).json({ error: 'Marketing manager permission required' });
    }

    const existing = await getMarketingTaskById(req.params.taskId);

    if (!existing) {
      return res.status(404).json({ error: 'Marketing task not found' });
    }

    await deleteMarketingTask(req.params.taskId);

    res.status(200).json({
      message: 'Marketing task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
