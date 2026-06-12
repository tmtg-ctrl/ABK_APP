const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

jest.mock('../modules/marketing/marketing-task.service', () => ({
  createMarketingTask: jest.fn(),
  listMarketingTasks: jest.fn(),
  getMarketingTaskById: jest.fn(),
  updateMarketingTask: jest.fn(),
  deleteMarketingTask: jest.fn()
}));

const taskService = require('../modules/marketing/marketing-task.service');
const taskController = require('../modules/marketing/marketing-task.controller');

const staffUser = {
  id: 'staff-1',
  email: 'staff@abk.vn',
  app_metadata: { role: 'marketing_staff', department: 'marketing' }
};

const managerUser = {
  id: 'manager-1',
  email: 'manager@abk.vn',
  app_metadata: { role: 'marketing_manager', department: 'marketing' }
};

describe('Marketing Task Controller', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();
  });

  it('makes the creator the primary owner for a staff-created task', async () => {
    taskService.createMarketingTask.mockResolvedValue({ id: 'task-1' });
    const req = {
      user: staffUser,
      body: {
        title: 'Weekly report',
        collaborator_ids: ['support-1', 'staff-1', 'support-1']
      }
    };
    const res = createResponse();

    await taskController.createTask(req, res, next);

    expect(taskService.createMarketingTask).toHaveBeenCalledWith(expect.objectContaining({
      assigneeId: 'staff-1',
      collaboratorIds: ['support-1'],
      creatorName: 'staff@abk.vn',
      assignedById: 'staff-1'
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('prevents staff from assigning a new task to another employee', async () => {
    const req = {
      user: staffUser,
      body: { title: 'Assigned task', assignee_id: 'staff-2' }
    };
    const res = createResponse();

    await taskController.createTask(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(taskService.createMarketingTask).not.toHaveBeenCalled();
  });

  it('allows a support member to update execution status', async () => {
    taskService.getMarketingTaskById.mockResolvedValue({
      id: 'task-1',
      created_by: 'owner-1',
      assignee_id: 'owner-1',
      collaborator_ids: ['staff-1'],
      status: 'todo'
    });
    taskService.updateMarketingTask.mockResolvedValue({ id: 'task-1', status: 'doing' });
    const req = {
      user: staffUser,
      params: { taskId: 'task-1' },
      body: { status: 'doing' }
    };
    const res = createResponse();

    await taskController.updateTask(req, res, next);

    expect(taskService.updateMarketingTask).toHaveBeenCalledWith('task-1', expect.objectContaining({
      status: 'doing',
      actorId: 'staff-1'
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('prevents a support member from changing task ownership', async () => {
    taskService.getMarketingTaskById.mockResolvedValue({
      id: 'task-1',
      created_by: 'owner-1',
      assignee_id: 'owner-1',
      collaborator_ids: ['staff-1']
    });
    const req = {
      user: staffUser,
      params: { taskId: 'task-1' },
      body: { collaborator_ids: ['staff-2'] }
    };
    const res = createResponse();

    await taskController.updateTask(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(taskService.updateMarketingTask).not.toHaveBeenCalled();
  });

  it('does not replace the latest assigner when the assignee is unchanged', async () => {
    taskService.getMarketingTaskById.mockResolvedValue({
      id: 'task-1',
      created_by: 'staff-1',
      assignee_id: 'staff-1',
      collaborator_ids: []
    });
    taskService.updateMarketingTask.mockResolvedValue({ id: 'task-1' });
    const req = {
      user: managerUser,
      params: { taskId: 'task-1' },
      body: { assignee_id: 'staff-1', status: 'doing' }
    };
    const res = createResponse();

    await taskController.updateTask(req, res, next);

    expect(taskService.updateMarketingTask).toHaveBeenCalledWith('task-1', expect.objectContaining({
      assignedById: undefined,
      assignedByName: undefined
    }));
  });
});
