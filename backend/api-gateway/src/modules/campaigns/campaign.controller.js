const campaignService = require('./campaign.service');

const MANAGER_ROLES = new Set(['admin', 'marketing_manager', 'department_manager']);
const PROJECT_STATUSES = new Set(['planning', 'active', 'paused', 'completed', 'archived']);
const PLAN_STATUSES = new Set(['draft', 'member_planning', 'leader_review', 'committed', 'closed']);

const getRole = (req) => req.user?.app_metadata?.role || 'staff';
const getDepartment = (req) => req.user?.app_metadata?.department || null;
const isMarketingUser = (req) => getRole(req) === 'admin' || getDepartment(req) === 'marketing';
const canManage = (req) => MANAGER_ROLES.has(getRole(req));

const requireMarketing = (req, res) => {
  if (!isMarketingUser(req)) {
    res.status(403).json({ error: 'Marketing department access required' });
    return false;
  }
  return true;
};

const requireManager = (req, res) => {
  if (!canManage(req)) {
    res.status(403).json({ error: 'Marketing manager permission required' });
    return false;
  }
  return true;
};

exports.getWorkspace = async (req, res, next) => {
  try {
    if (!requireMarketing(req, res)) return;
    res.status(200).json(await campaignService.getCampaignWorkspace());
  } catch (error) {
    next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    if (!requireMarketing(req, res) || !requireManager(req, res)) return;
    if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (req.body.status && !PROJECT_STATUSES.has(req.body.status)) {
      return res.status(400).json({ error: 'invalid project status' });
    }

    const project = await campaignService.createProject({
      code: req.body.code?.trim(),
      name: req.body.name.trim(),
      objective: req.body.objective,
      ownerId: req.body.owner_id,
      ownerName: req.body.owner_name,
      sponsor: req.body.sponsor,
      startDate: req.body.start_date,
      endDate: req.body.end_date,
      budget: req.body.budget,
      color: req.body.color,
      health: req.body.health,
      status: req.body.status,
      userId: req.user.id
    });
    res.status(201).json({ message: 'Campaign project created successfully', project });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    if (!requireMarketing(req, res) || !requireManager(req, res)) return;
    if (req.body.status && !PROJECT_STATUSES.has(req.body.status)) {
      return res.status(400).json({ error: 'invalid project status' });
    }
    const project = await campaignService.updateProject(req.params.projectId, {
      code: req.body.code,
      name: req.body.name,
      objective: req.body.objective,
      ownerId: req.body.owner_id,
      ownerName: req.body.owner_name,
      sponsor: req.body.sponsor,
      startDate: req.body.start_date,
      endDate: req.body.end_date,
      budget: req.body.budget,
      color: req.body.color,
      health: req.body.health,
      status: req.body.status
    });
    if (!project) return res.status(404).json({ error: 'Campaign project not found' });
    res.status(200).json({ message: 'Campaign project updated successfully', project });
  } catch (error) {
    next(error);
  }
};

exports.createPhase = async (req, res, next) => {
  try {
    if (!requireMarketing(req, res) || !requireManager(req, res)) return;
    const project = await campaignService.getProjectById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Campaign project not found' });
    if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const phase = await campaignService.createPhase({
      projectId: project.id,
      name: req.body.name.trim(),
      description: req.body.description,
      order: req.body.order,
      startDate: req.body.start_date,
      endDate: req.body.end_date,
      status: req.body.status,
      userId: req.user.id
    });
    res.status(201).json({ message: 'Project phase created successfully', phase });
  } catch (error) {
    next(error);
  }
};

exports.updatePhase = async (req, res, next) => {
  try {
    if (!requireMarketing(req, res) || !requireManager(req, res)) return;
    const phase = await campaignService.updatePhase(req.params.phaseId, {
      name: req.body.name,
      description: req.body.description,
      order: req.body.order,
      startDate: req.body.start_date,
      endDate: req.body.end_date,
      status: req.body.status
    });
    if (!phase) return res.status(404).json({ error: 'Project phase not found' });
    res.status(200).json({ message: 'Project phase updated successfully', phase });
  } catch (error) {
    next(error);
  }
};

exports.createWeeklyPlan = async (req, res, next) => {
  try {
    if (!requireMarketing(req, res) || !requireManager(req, res)) return;
    if (!req.body.week_start || !req.body.week_end) {
      return res.status(400).json({ error: 'week_start and week_end are required' });
    }
    if (req.body.status && !PLAN_STATUSES.has(req.body.status)) {
      return res.status(400).json({ error: 'invalid weekly plan status' });
    }
    const plan = await campaignService.createWeeklyPlan({
      weekStart: req.body.week_start,
      weekEnd: req.body.week_end,
      title: req.body.title,
      notes: req.body.notes,
      status: req.body.status,
      userId: req.user.id
    });
    res.status(201).json({ message: 'Weekly plan created successfully', plan });
  } catch (error) {
    next(error);
  }
};

exports.updateWeeklyPlan = async (req, res, next) => {
  try {
    if (!requireMarketing(req, res) || !requireManager(req, res)) return;
    if (req.body.status && !PLAN_STATUSES.has(req.body.status)) {
      return res.status(400).json({ error: 'invalid weekly plan status' });
    }
    const plan = await campaignService.updateWeeklyPlan(req.params.planId, {
      weekStart: req.body.week_start,
      weekEnd: req.body.week_end,
      title: req.body.title,
      notes: req.body.notes,
      status: req.body.status
    });
    if (!plan) return res.status(404).json({ error: 'Weekly plan not found' });
    res.status(200).json({ message: 'Weekly plan updated successfully', plan });
  } catch (error) {
    next(error);
  }
};

exports.addAllocation = async (req, res, next) => {
  try {
    if (!requireMarketing(req, res)) return;
    if (!req.body.task_id) return res.status(400).json({ error: 'task_id is required' });
    const result = await campaignService.addWeeklyAllocation(req.params.planId, {
      taskId: req.body.task_id,
      plannedDate: req.body.planned_date,
      estimatedHours: req.body.estimated_hours,
      commitmentStatus: req.body.commitment_status,
      carryoverReason: req.body.carryover_reason,
      addedDuringWeek: req.body.added_during_week
    });
    if (result.reason === 'plan_not_found') return res.status(404).json({ error: 'Weekly plan not found' });
    if (result.reason === 'task_not_found') return res.status(404).json({ error: 'Marketing task not found' });
    if (result.reason === 'duplicate_task') {
      return res.status(409).json({ error: 'Task is already included in this weekly plan' });
    }
    res.status(201).json({ message: 'Task added to weekly plan', ...result });
  } catch (error) {
    next(error);
  }
};

exports.updateAllocation = async (req, res, next) => {
  try {
    if (!requireMarketing(req, res)) return;
    const result = await campaignService.updateWeeklyAllocation(
      req.params.planId,
      req.params.allocationId,
      {
        plannedDate: req.body.planned_date,
        estimatedHours: req.body.estimated_hours,
        commitmentStatus: req.body.commitment_status,
        carryoverReason: req.body.carryover_reason,
        addedDuringWeek: req.body.added_during_week
      }
    );
    if (result.reason === 'plan_not_found') return res.status(404).json({ error: 'Weekly plan not found' });
    if (result.reason === 'allocation_not_found') return res.status(404).json({ error: 'Allocation not found' });
    res.status(200).json({ message: 'Weekly allocation updated successfully', ...result });
  } catch (error) {
    next(error);
  }
};

exports.seedDemo = async (req, res, next) => {
  try {
    if (!requireMarketing(req, res) || !requireManager(req, res)) return;
    const result = await campaignService.seedDemoWorkspace(req.user.id);
    res.status(result.created ? 201 : 200).json(result);
  } catch (error) {
    next(error);
  }
};
