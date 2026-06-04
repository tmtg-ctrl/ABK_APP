const express = require('express');
const router = express.Router();
const marketingTaskController = require('./marketing-task.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');

router.use(authenticate);

router.post('/', marketingTaskController.createTask);
router.get('/', marketingTaskController.listTasks);
router.get('/:taskId', marketingTaskController.getTask);
router.put('/:taskId/assign', marketingTaskController.assignTask);
router.put('/:taskId', marketingTaskController.updateTask);
router.delete('/:taskId', marketingTaskController.deleteTask);

module.exports = router;
