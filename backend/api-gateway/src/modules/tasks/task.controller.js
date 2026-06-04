const axios = require('axios');
const crypto = require('crypto');
const {
  createTaskMetadata,
  updateTaskStatus,
  getTaskById,
  listTasks,
  assignTaskUser,
  removeTaskAssignee,
  getTaskAssignees,
  getUserTasks
} = require('./task.service');

const getPythonWorkersUrl = () => `http://${process.env.PYTHON_WORKERS_HOST}:${process.env.PYTHON_WORKERS_PORT}`;

exports.submitTask = async (req, res, next) => {
  try {
    const { taskType, data, assignees } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    if (!taskType || !data) {
      return res.status(400).json({ error: 'taskType and data are required' });
    }

    const taskId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await createTaskMetadata({
      taskId,
      taskType,
      data,
      status: 'submitted',
      createdAt,
      userId
    });

    // Assign additional users if provided
    if (assignees && Array.isArray(assignees)) {
      for (const assignee of assignees) {
        await assignTaskUser(taskId, assignee.userId, assignee.role || 'collaborator');
      }
    }

    const response = await axios.post(`${getPythonWorkersUrl()}/tasks`, {
      taskId,
      taskType,
      data
    });

    if (response.data && response.data.status) {
      await updateTaskStatus(taskId, response.data.status, response.data);
    }

    res.status(200).json({
      message: 'Task submitted successfully',
      taskId,
      workerResponse: response.data
    });
  } catch (error) {
    next(error);
  }
};

exports.getTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await getTaskById(taskId);
    if (task) {
      return res.status(200).json(task);
    }

    const response = await axios.get(`${getPythonWorkersUrl()}/tasks/${taskId}`);
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
};

exports.listTasks = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    // If userId provided, get tasks for that user (created or assigned)
    if (userId) {
      const tasks = await getUserTasks(userId);
      return res.status(200).json(tasks);
    }

    // Otherwise get all tasks (admin only - optional)
    const tasks = await listTasks();
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

exports.assignTaskCollaborator = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { userId, role } = req.body;
    const currentUserId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Verify current user is task creator or has permission
    const task = await getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.user_id !== currentUserId) {
      return res.status(403).json({ error: 'Only task creator can assign collaborators' });
    }

    const assignee = await assignTaskUser(taskId, userId, role || 'collaborator');

    res.status(201).json({
      message: 'Collaborator assigned successfully',
      assignee
    });
  } catch (error) {
    next(error);
  }
};

exports.removeTaskCollaborator = async (req, res, next) => {
  try {
    const { taskId, userId } = req.params;
    const currentUserId = req.user?.id;

    // Verify current user is task creator
    const task = await getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.user_id !== currentUserId) {
      return res.status(403).json({ error: 'Only task creator can remove collaborators' });
    }

    await removeTaskAssignee(taskId, userId);

    res.status(200).json({
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getTaskCollaborators = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const assignees = await getTaskAssignees(taskId);

    res.status(200).json({
      taskId,
      assignees
    });
  } catch (error) {
    next(error);
  }
};
