const {
  createMarketingTask,
  listMarketingTasks,
  getMarketingTaskById,
  updateMarketingTask,
  deleteMarketingTask
} = require('./marketing-task.service');

const VALID_STATUSES = new Set(['backlog', 'todo', 'doing', 'review', 'revision', 'approved', 'blocked', 'done']);
const VALID_PRIORITIES = new Set(['low', 'medium', 'high']);
const VALID_TEAMS = new Set(['media', 'sale', 'content', 'performance', 'event', 'hr', 'all']);
const VALID_WORK_CONTEXTS = new Set(['campaign', 'operation']);
const VALID_ITEM_TYPES = new Set(['task', 'milestone']);
const MANAGER_ROLES = new Set(['admin', 'marketing_manager', 'department_manager']);

const getUserRole = (req) => req.user?.app_metadata?.role || 'staff';
const getUserDepartment = (req) => req.user?.app_metadata?.department || null;
const isMarketingUser = (req) => getUserRole(req) === 'admin' || getUserDepartment(req) === 'marketing';
const canManageMarketing = (req) => MANAGER_ROLES.has(getUserRole(req));

const canAccessTask = (req, task) => {
  if (canManageMarketing(req)) {
    return true;
  }

  return task.created_by === req.user.id
    || task.assignee_id === req.user.id
    || task.collaborator_ids.includes(req.user.id);
};

const canCoordinateTask = (req, task) => (
  canManageMarketing(req)
  || task.created_by === req.user.id
);

const normalizeCollaboratorIds = (value, assigneeId) => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return null;
  return [...new Set(value.filter((id) => typeof id === 'string' && id && id !== assigneeId))].slice(0, 20);
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

    const {
      title, description, priority, team, work_type, work_context, item_type,
      project_id, phase_id, deliverable, assignee_id, owner_name, collaborator_ids,
      approver_id, start_date, deadline, progress, dependency_id, subtasks, checklist, status
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    if (priority && !VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({ error: 'priority must be low, medium, or high' });
    }

    if (status && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'invalid marketing task status' });
    }

    if (team && !VALID_TEAMS.has(team)) {
      return res.status(400).json({ error: 'invalid marketing team' });
    }

    if (work_context && !VALID_WORK_CONTEXTS.has(work_context)) {
      return res.status(400).json({ error: 'work_context must be campaign or operation' });
    }

    if (item_type && !VALID_ITEM_TYPES.has(item_type)) {
      return res.status(400).json({ error: 'item_type must be task or milestone' });
    }

    if ((work_context === 'campaign' || project_id) && !project_id) {
      return res.status(400).json({ error: 'project_id is required for campaign tasks' });
    }

    if (progress !== undefined && (Number(progress) < 0 || Number(progress) > 100)) {
      return res.status(400).json({ error: 'progress must be between 0 and 100' });
    }

    if (assignee_id && assignee_id !== req.user.id && !canManageMarketing(req)) {
      return res.status(403).json({ error: 'Only a marketing manager can assign a task to another employee' });
    }

    const primaryAssigneeId = assignee_id || req.user.id;
    const normalizedCollaborators = normalizeCollaboratorIds(collaborator_ids, primaryAssigneeId);
    if (normalizedCollaborators === null) {
      return res.status(400).json({ error: 'collaborator_ids must be an array' });
    }

    const task = await createMarketingTask({
      title,
      description,
      priority,
      team,
      workType: work_type,
      workContext: work_context,
      itemType: item_type,
      projectId: project_id,
      phaseId: phase_id,
      deliverable,
      assigneeId: primaryAssigneeId,
      ownerName: owner_name || (primaryAssigneeId === req.user.id ? req.user.email : ''),
      collaboratorIds: normalizedCollaborators,
      approverId: approver_id,
      creatorName: req.user.email || '',
      assignedById: req.user.id,
      assignedByName: req.user.email || '',
      startDate: start_date,
      deadline,
      progress,
      dependencyId: dependency_id,
      subtasks,
      checklist,
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

    const {
      title, description, priority, team, work_type, work_context, item_type,
      project_id, phase_id, deliverable, assignee_id, owner_name, collaborator_ids,
      approver_id, start_date, deadline, progress, dependency_id, subtasks, checklist, status
    } = req.body;

    const collaboratorOnly = !canCoordinateTask(req, existing);
    const collaboratorAllowedFields = new Set(['status', 'progress', 'subtasks', 'checklist']);
    const requestedFields = Object.entries(req.body)
      .filter(([, value]) => value !== undefined)
      .map(([field]) => field);
    if (collaboratorOnly && requestedFields.some((field) => !collaboratorAllowedFields.has(field))) {
      return res.status(403).json({
        error: 'Support members can only update status, progress, subtasks, and checklist'
      });
    }

    if (assignee_id !== undefined && !canManageMarketing(req)) {
      return res.status(403).json({ error: 'Marketing manager permission required to assign tasks' });
    }

    if (priority && !VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({ error: 'priority must be low, medium, or high' });
    }

    if (status && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'invalid marketing task status' });
    }

    if (team && !VALID_TEAMS.has(team)) {
      return res.status(400).json({ error: 'invalid marketing team' });
    }

    if (work_context && !VALID_WORK_CONTEXTS.has(work_context)) {
      return res.status(400).json({ error: 'work_context must be campaign or operation' });
    }

    if (item_type && !VALID_ITEM_TYPES.has(item_type)) {
      return res.status(400).json({ error: 'item_type must be task or milestone' });
    }

    if (progress !== undefined && (Number(progress) < 0 || Number(progress) > 100)) {
      return res.status(400).json({ error: 'progress must be between 0 and 100' });
    }

    if (collaborator_ids !== undefined && !canCoordinateTask(req, existing)) {
      return res.status(403).json({ error: 'Task owner permission required to manage support members' });
    }

    const nextAssigneeId = assignee_id === undefined ? existing.assignee_id : assignee_id;
    const normalizedCollaborators = normalizeCollaboratorIds(collaborator_ids, nextAssigneeId);
    if (normalizedCollaborators === null) {
      return res.status(400).json({ error: 'collaborator_ids must be an array' });
    }
    const assigneeChanged = assignee_id !== undefined && assignee_id !== existing.assignee_id;

    const task = await updateMarketingTask(req.params.taskId, {
      title,
      description,
      priority,
      team,
      workType: work_type,
      workContext: work_context,
      itemType: item_type,
      projectId: project_id,
      phaseId: phase_id,
      deliverable,
      assigneeId: assignee_id,
      ownerName: owner_name,
      collaboratorIds: normalizedCollaborators,
      approverId: approver_id,
      startDate: start_date,
      deadline,
      progress,
      dependencyId: dependency_id,
      subtasks,
      checklist,
      status,
      assignedById: assigneeChanged ? req.user.id : undefined,
      assignedByName: assigneeChanged ? req.user.email || '' : undefined,
      actorId: req.user.id,
      actorName: req.user.email || ''
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
      assigneeId: assignee_id,
      collaboratorIds: normalizeCollaboratorIds(existing.collaborator_ids, assignee_id),
      assignedById: req.user.id,
      assignedByName: req.user.email || '',
      actorId: req.user.id,
      actorName: req.user.email || ''
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
