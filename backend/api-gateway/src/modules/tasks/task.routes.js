const express = require('express');
const router = express.Router();
const taskController = require('./task.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');

// All task routes require authentication
router.use(authenticate);

// Route to submit a task to Python workers
router.post('/submit', taskController.submitTask);

// Route to get task status
router.get('/:taskId', taskController.getTaskStatus);

// Route to list all tasks for current user
router.get('/', taskController.listTasks);

// Route to assign collaborator to task
router.post('/:taskId/assignees', taskController.assignTaskCollaborator);

// Route to get task collaborators
router.get('/:taskId/assignees', taskController.getTaskCollaborators);

// Route to remove collaborator from task
router.delete('/:taskId/assignees/:userId', taskController.removeTaskCollaborator);

module.exports = router;
