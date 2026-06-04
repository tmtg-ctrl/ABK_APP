const createResponse = () => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
};

jest.mock('../modules/tasks/task.service', () => ({
  createTaskMetadata: jest.fn().mockResolvedValue(true),
  updateTaskStatus: jest.fn().mockResolvedValue(true),
  getTaskById: jest.fn().mockResolvedValue(null),
  listTasks: jest.fn().mockResolvedValue([]),
  assignTaskUser: jest.fn().mockResolvedValue(true),
  removeTaskAssignee: jest.fn().mockResolvedValue(true),
  getTaskAssignees: jest.fn().mockResolvedValue([]),
  getUserTasks: jest.fn().mockResolvedValue([])
}));

describe('Task Controller', () => {
  let taskController;
  let axios;
  let taskService;
  let next;

  beforeEach(() => {
    jest.resetModules();
    process.env.PYTHON_WORKERS_HOST = 'localhost';
    process.env.PYTHON_WORKERS_PORT = '5000';

    jest.doMock('axios', () => ({
      post: jest.fn(),
      get: jest.fn()
    }));

    taskController = require('../modules/tasks/task.controller');
    axios = require('axios');
    taskService = require('../modules/tasks/task.service');
    next = jest.fn();
  });

  it('should return 400 when taskType or data is missing', async () => {
    const req = { body: {}, user: { id: 'user-1' } };
    const res = createResponse();

    await taskController.submitTask(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'taskType and data are required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should submit a task and return taskId', async () => {
    axios.post.mockResolvedValue({ data: { status: 'processing' } });
    const req = { body: { taskType: 'data_processing', data: { key: 'value' } }, user: { id: 'user-1' } };
    const res = createResponse();

    await taskController.submitTask(req, res, next);

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5000/tasks',
      expect.objectContaining({
        taskType: 'data_processing',
        data: { key: 'value' }
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Task submitted successfully',
      taskId: expect.any(String),
      workerResponse: { status: 'processing' }
    });
  });

  it('should return task status from Python workers', async () => {
    axios.get.mockResolvedValue({ data: { taskId: 'task-123', status: 'pending' } });
    const req = { params: { taskId: 'task-123' } };
    const res = createResponse();

    await taskController.getTaskStatus(req, res, next);

    expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/tasks/task-123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ taskId: 'task-123', status: 'pending' });
  });

  it('should list tasks from Supabase storage', async () => {
    taskService.getUserTasks.mockResolvedValue([{ taskId: 'task-123', status: 'pending' }]);
    const req = { params: {}, user: { id: 'user-1' } };
    const res = createResponse();

    await taskController.listTasks(req, res, next);

    expect(taskService.getUserTasks).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ taskId: 'task-123', status: 'pending' }]);
  });
});
