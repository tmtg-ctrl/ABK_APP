const crypto = require('crypto');
const supabase = require('../../config/supabase');
const {
  createMarketingTask,
  listMarketingTasks,
  getMarketingTaskById
} = require('../marketing/marketing-task.service');

const PROJECT_TYPE = 'marketing_project';
const PHASE_TYPE = 'marketing_project_phase';
const WEEKLY_PLAN_TYPE = 'marketing_weekly_plan';

const normalizeProject = (record) => {
  if (!record) return null;

  return {
    id: record.id,
    code: record.data?.code || '',
    name: record.data?.name || '',
    objective: record.data?.objective || '',
    owner_id: record.data?.owner_id || null,
    owner_name: record.data?.owner_name || '',
    sponsor: record.data?.sponsor || '',
    start_date: record.data?.start_date || null,
    end_date: record.data?.end_date || null,
    budget: Number(record.data?.budget || 0),
    color: record.data?.color || '#4f46e5',
    health: record.data?.health || 'on_track',
    status: record.status || 'planning',
    created_by: record.user_id,
    created_at: record.created_at,
    updated_at: record.data?.updated_at || null
  };
};

const normalizePhase = (record) => {
  if (!record) return null;

  return {
    id: record.id,
    project_id: record.data?.project_id || null,
    name: record.data?.name || '',
    description: record.data?.description || '',
    order: Number(record.data?.order || 0),
    start_date: record.data?.start_date || null,
    end_date: record.data?.end_date || null,
    status: record.status || 'active',
    created_by: record.user_id,
    created_at: record.created_at,
    updated_at: record.data?.updated_at || null
  };
};

const normalizeWeeklyPlan = (record) => {
  if (!record) return null;

  return {
    id: record.id,
    week_start: record.data?.week_start || null,
    week_end: record.data?.week_end || null,
    title: record.data?.title || '',
    allocations: record.data?.allocations || [],
    notes: record.data?.notes || '',
    status: record.status || 'draft',
    created_by: record.user_id,
    created_at: record.created_at,
    updated_at: record.data?.updated_at || null
  };
};

const listRecords = async (taskType, normalizer) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('task_type', taskType)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map(normalizer);
};

const getRecord = async (id, taskType, normalizer) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('task_type', taskType)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return normalizer(data);
};

const createRecord = async ({ taskType, status, data, userId, normalizer }) => {
  const now = new Date().toISOString();
  const { data: record, error } = await supabase
    .from('tasks')
    .insert([{
      id: crypto.randomUUID(),
      task_type: taskType,
      data: { ...data, updated_at: now },
      status,
      created_at: now,
      user_id: userId
    }])
    .select()
    .single();

  if (error) throw error;
  return normalizer(record);
};

const updateRecord = async ({ id, taskType, updates, status, normalizer }) => {
  const existing = await getRecord(id, taskType, normalizer);
  if (!existing) return null;

  const {
    id: ignoredId,
    status: ignoredStatus,
    created_by: ignoredCreatedBy,
    created_at: ignoredCreatedAt,
    updated_at: ignoredUpdatedAt,
    ...existingData
  } = existing;
  const definedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
  const nextData = {
    ...existingData,
    ...definedUpdates,
    updated_at: new Date().toISOString()
  };
  const payload = { data: nextData };
  if (status) payload.status = status;

  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
    .eq('task_type', taskType)
    .select()
    .single();

  if (error) throw error;
  return normalizer(data);
};

const listProjects = () => listRecords(PROJECT_TYPE, normalizeProject);
const listPhases = () => listRecords(PHASE_TYPE, normalizePhase);
const listWeeklyPlans = () => listRecords(WEEKLY_PLAN_TYPE, normalizeWeeklyPlan);

const getProjectById = (projectId) => getRecord(projectId, PROJECT_TYPE, normalizeProject);
const getPhaseById = (phaseId) => getRecord(phaseId, PHASE_TYPE, normalizePhase);
const getWeeklyPlanById = (planId) => getRecord(planId, WEEKLY_PLAN_TYPE, normalizeWeeklyPlan);
const getWeeklyPlanByWeekStart = async (weekStart) => {
  const plans = await listWeeklyPlans();
  return plans.find((plan) => plan.week_start === weekStart) || null;
};

const createProject = (input) => createRecord({
  taskType: PROJECT_TYPE,
  status: input.status || 'planning',
  userId: input.userId,
  normalizer: normalizeProject,
  data: {
    code: input.code || '',
    name: input.name,
    objective: input.objective || '',
    owner_id: input.ownerId || input.userId,
    owner_name: input.ownerName || '',
    sponsor: input.sponsor || '',
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    budget: Number(input.budget || 0),
    color: input.color || '#4f46e5',
    health: input.health || 'on_track'
  }
});

const updateProject = (projectId, input) => updateRecord({
  id: projectId,
  taskType: PROJECT_TYPE,
  normalizer: normalizeProject,
  status: input.status,
  updates: {
    code: input.code,
    name: input.name,
    objective: input.objective,
    owner_id: input.ownerId,
    owner_name: input.ownerName,
    sponsor: input.sponsor,
    start_date: input.startDate,
    end_date: input.endDate,
    budget: input.budget,
    color: input.color,
    health: input.health
  }
});

const createPhase = (input) => createRecord({
  taskType: PHASE_TYPE,
  status: input.status || 'active',
  userId: input.userId,
  normalizer: normalizePhase,
  data: {
    project_id: input.projectId,
    name: input.name,
    description: input.description || '',
    order: Number(input.order || 0),
    start_date: input.startDate || null,
    end_date: input.endDate || null
  }
});

const updatePhase = (phaseId, input) => updateRecord({
  id: phaseId,
  taskType: PHASE_TYPE,
  normalizer: normalizePhase,
  status: input.status,
  updates: {
    project_id: input.projectId,
    name: input.name,
    description: input.description,
    order: input.order,
    start_date: input.startDate,
    end_date: input.endDate
  }
});

const createWeeklyPlan = (input) => createRecord({
  taskType: WEEKLY_PLAN_TYPE,
  status: input.status || 'draft',
  userId: input.userId,
  normalizer: normalizeWeeklyPlan,
  data: {
    week_start: input.weekStart,
    week_end: input.weekEnd,
    title: input.title || `Ke hoach tuan ${input.weekStart}`,
    notes: input.notes || '',
    allocations: []
  }
});

const updateWeeklyPlan = (planId, input) => updateRecord({
  id: planId,
  taskType: WEEKLY_PLAN_TYPE,
  normalizer: normalizeWeeklyPlan,
  status: input.status,
  updates: {
    week_start: input.weekStart,
    week_end: input.weekEnd,
    title: input.title,
    notes: input.notes
  }
});

const addWeeklyAllocation = async (planId, input) => {
  const [plan, task] = await Promise.all([
    getWeeklyPlanById(planId),
    getMarketingTaskById(input.taskId)
  ]);

  if (!plan) return { plan: null, reason: 'plan_not_found' };
  if (!task) return { plan, reason: 'task_not_found' };
  if (['committed', 'closed'].includes(plan.status)) {
    return { plan, reason: 'plan_locked' };
  }
  if (plan.allocations.some((allocation) => allocation.task_id === input.taskId)) {
    return { plan, reason: 'duplicate_task' };
  }

  const allocation = {
    id: crypto.randomUUID(),
    task_id: input.taskId,
    planned_date: input.plannedDate || null,
    estimated_hours: Number(input.estimatedHours || 0),
    commitment_status: input.commitmentStatus || 'planned',
    carryover_reason: input.carryoverReason || '',
    added_during_week: Boolean(input.addedDuringWeek)
  };

  const updated = await updateRecord({
    id: planId,
    taskType: WEEKLY_PLAN_TYPE,
    normalizer: normalizeWeeklyPlan,
    updates: { allocations: [...plan.allocations, allocation] }
  });

  return { plan: updated, allocation };
};

const updateWeeklyAllocation = async (planId, allocationId, input) => {
  const plan = await getWeeklyPlanById(planId);
  if (!plan) return { plan: null, reason: 'plan_not_found' };
  if (['committed', 'closed'].includes(plan.status)) {
    return { plan, reason: 'plan_locked' };
  }

  const existing = plan.allocations.find((allocation) => allocation.id === allocationId);
  if (!existing) return { plan, reason: 'allocation_not_found' };

  const allocations = plan.allocations.map((allocation) => (
    allocation.id === allocationId
      ? {
          ...allocation,
          planned_date: input.plannedDate ?? allocation.planned_date,
          estimated_hours: input.estimatedHours === undefined
            ? allocation.estimated_hours
            : Number(input.estimatedHours),
          commitment_status: input.commitmentStatus ?? allocation.commitment_status,
          carryover_reason: input.carryoverReason ?? allocation.carryover_reason,
          added_during_week: input.addedDuringWeek ?? allocation.added_during_week
        }
      : allocation
  ));

  const updated = await updateRecord({
    id: planId,
    taskType: WEEKLY_PLAN_TYPE,
    normalizer: normalizeWeeklyPlan,
    updates: { allocations }
  });

  return { plan: updated };
};

const removeWeeklyAllocation = async (planId, allocationId) => {
  const plan = await getWeeklyPlanById(planId);
  if (!plan) return { plan: null, reason: 'plan_not_found' };
  if (['committed', 'closed'].includes(plan.status)) {
    return { plan, reason: 'plan_locked' };
  }

  const allocation = plan.allocations.find((item) => item.id === allocationId);
  if (!allocation) return { plan, reason: 'allocation_not_found' };

  const updated = await updateRecord({
    id: planId,
    taskType: WEEKLY_PLAN_TYPE,
    normalizer: normalizeWeeklyPlan,
    updates: {
      allocations: plan.allocations.filter((item) => item.id !== allocationId)
    }
  });

  return { plan: updated, allocation };
};

const getCampaignWorkspace = async () => {
  const [projects, phases, tasks, weeklyPlans] = await Promise.all([
    listProjects(),
    listPhases(),
    listMarketingTasks(),
    listWeeklyPlans()
  ]);

  const enrichedProjects = projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.project_id === project.id);
    const actionableTasks = projectTasks.filter((task) => task.item_type !== 'milestone');
    const completed = actionableTasks.filter((task) => task.status === 'done').length;

    return {
      ...project,
      phases: phases
        .filter((phase) => phase.project_id === project.id)
        .sort((a, b) => a.order - b.order),
      task_count: actionableTasks.length,
      completed_task_count: completed,
      progress: actionableTasks.length ? Math.round((completed / actionableTasks.length) * 100) : 0
    };
  });

  return {
    projects: enrichedProjects,
    phases,
    tasks,
    weekly_plans: weeklyPlans
  };
};

const startOfWeek = (date = new Date()) => {
  const result = new Date(date);
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - ((day + 6) % 7));
  return result;
};

const toDate = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const seedDemoWorkspace = async (userId) => {
  const existingProjects = await listProjects();
  if (existingProjects.length) {
    return { created: false, workspace: await getCampaignWorkspace() };
  }

  const weekStart = startOfWeek();
  const project = await createProject({
    code: 'ABK-REMARKETING',
    name: 'Remarketing thuong hieu ABK',
    objective: 'Tang nhan dien thuong hieu va tao nguon noi dung cho cac kenh marketing.',
    ownerName: 'Marketing Leader',
    startDate: toDate(weekStart),
    endDate: toDate(addDays(weekStart, 42)),
    color: '#5b5bd6',
    status: 'active',
    userId
  });
  const operationProject = await createProject({
    code: 'ABK-WEB',
    name: 'Nang cap website ABK',
    objective: 'Hoan thien noi dung, du lieu va trai nghiem website.',
    ownerName: 'Marketing Leader',
    startDate: toDate(weekStart),
    endDate: toDate(addDays(weekStart, 28)),
    color: '#0f9f6e',
    status: 'active',
    userId
  });

  const researchPhase = await createPhase({
    projectId: project.id,
    name: 'Chien luoc va thong diep',
    order: 1,
    startDate: toDate(weekStart),
    endDate: toDate(addDays(weekStart, 9)),
    userId
  });
  const productionPhase = await createPhase({
    projectId: project.id,
    name: 'San xuat noi dung',
    order: 2,
    startDate: toDate(addDays(weekStart, 10)),
    endDate: toDate(addDays(weekStart, 28)),
    userId
  });
  const webPhase = await createPhase({
    projectId: operationProject.id,
    name: 'Cap nhat noi dung',
    order: 1,
    startDate: toDate(weekStart),
    endDate: toDate(addDays(weekStart, 21)),
    userId
  });

  const taskInputs = [
    {
      title: 'Xay dung muc tieu Branding',
      projectId: project.id,
      phaseId: researchPhase.id,
      deliverable: 'Bo muc tieu va KPI duoc leader phe duyet',
      ownerName: 'Dang',
      team: 'content',
      priority: 'high',
      startDate: toDate(weekStart),
      deadline: toDate(addDays(weekStart, 2))
    },
    {
      title: 'Kich ban 4 video brand remarketing',
      projectId: project.id,
      phaseId: productionPhase.id,
      deliverable: '4 kich ban san sang quay',
      ownerName: 'Hao',
      team: 'media',
      priority: 'high',
      startDate: toDate(addDays(weekStart, 3)),
      deadline: toDate(addDays(weekStart, 9))
    },
    {
      title: 'Chup bo anh thuong hieu ABK',
      projectId: project.id,
      phaseId: productionPhase.id,
      deliverable: '20 anh da chon va hau ky',
      ownerName: 'Thuong',
      team: 'media',
      priority: 'medium',
      startDate: toDate(addDays(weekStart, 8)),
      deadline: toDate(addDays(weekStart, 14))
    },
    {
      title: 'Cap nhat tien do cong trinh tren website',
      projectId: operationProject.id,
      phaseId: webPhase.id,
      deliverable: 'Trang tien do duoc cap nhat du lieu moi',
      ownerName: 'Dang',
      team: 'content',
      priority: 'high',
      startDate: toDate(weekStart),
      deadline: toDate(addDays(weekStart, 4))
    },
    {
      title: 'Bao cao hieu qua kenh marketing hang tuan',
      workContext: 'operation',
      deliverable: 'Bao cao chi so va kien nghi cho tuan tiep theo',
      ownerName: 'Marketing Leader',
      team: 'performance',
      priority: 'medium',
      startDate: toDate(addDays(weekStart, 4)),
      deadline: toDate(addDays(weekStart, 5))
    }
  ];

  const tasks = [];
  for (const input of taskInputs) {
    tasks.push(await createMarketingTask({
      ...input,
      workContext: input.workContext || 'campaign',
      itemType: 'task',
      status: 'todo',
      userId
    }));
  }

  const weeklyPlan = await createWeeklyPlan({
    weekStart: toDate(weekStart),
    weekEnd: toDate(addDays(weekStart, 6)),
    status: 'member_planning',
    userId
  });

  for (let index = 0; index < tasks.length; index += 1) {
    await addWeeklyAllocation(weeklyPlan.id, {
      taskId: tasks[index].id,
      plannedDate: toDate(addDays(weekStart, Math.min(index, 5))),
      estimatedHours: index === 1 ? 12 : 6,
      commitmentStatus: 'committed'
    });
  }

  await updateWeeklyPlan(weeklyPlan.id, { status: 'committed' });

  return { created: true, workspace: await getCampaignWorkspace() };
};

module.exports = {
  getCampaignWorkspace,
  getProjectById,
  getPhaseById,
  getWeeklyPlanById,
  getWeeklyPlanByWeekStart,
  createProject,
  updateProject,
  createPhase,
  updatePhase,
  createWeeklyPlan,
  updateWeeklyPlan,
  addWeeklyAllocation,
  updateWeeklyAllocation,
  removeWeeklyAllocation,
  seedDemoWorkspace
};
