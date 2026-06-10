const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

jest.mock('../modules/campaigns/campaign.service', () => ({
  getCampaignWorkspace: jest.fn(),
  getProjectById: jest.fn(),
  getPhaseById: jest.fn(),
  getWeeklyPlanById: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  createPhase: jest.fn(),
  updatePhase: jest.fn(),
  createWeeklyPlan: jest.fn(),
  updateWeeklyPlan: jest.fn(),
  addWeeklyAllocation: jest.fn(),
  updateWeeklyAllocation: jest.fn(),
  seedDemoWorkspace: jest.fn()
}));

const campaignService = require('../modules/campaigns/campaign.service');
const campaignController = require('../modules/campaigns/campaign.controller');

const staffUser = {
  id: 'staff-1',
  app_metadata: { role: 'marketing_staff', department: 'marketing' }
};

const managerUser = {
  id: 'manager-1',
  app_metadata: { role: 'marketing_manager', department: 'marketing' }
};

describe('Campaign Controller', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();
  });

  it('returns the campaign workspace to marketing staff', async () => {
    campaignService.getCampaignWorkspace.mockResolvedValue({
      projects: [],
      phases: [],
      tasks: [],
      weekly_plans: []
    });
    const req = { user: staffUser };
    const res = createResponse();

    await campaignController.getWorkspace(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ projects: [] }));
  });

  it('prevents staff from creating a campaign project', async () => {
    const req = { user: staffUser, body: { name: 'Brand campaign' } };
    const res = createResponse();

    await campaignController.createProject(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(campaignService.createProject).not.toHaveBeenCalled();
  });

  it('creates a campaign project for a marketing manager', async () => {
    campaignService.createProject.mockResolvedValue({ id: 'project-1', name: 'Brand campaign' });
    const req = {
      user: managerUser,
      body: { name: ' Brand campaign ', status: 'active' }
    };
    const res = createResponse();

    await campaignController.createProject(req, res, next);

    expect(campaignService.createProject).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Brand campaign',
      status: 'active',
      userId: 'manager-1'
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects a duplicate task in the same weekly plan', async () => {
    campaignService.addWeeklyAllocation.mockResolvedValue({
      reason: 'duplicate_task',
      plan: { id: 'plan-1' }
    });
    const req = {
      user: staffUser,
      params: { planId: 'plan-1' },
      body: { task_id: 'task-1' }
    };
    const res = createResponse();

    await campaignController.addAllocation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Task is already included in this weekly plan'
    });
  });
});
