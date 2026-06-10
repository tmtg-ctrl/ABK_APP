const express = require('express');
const campaignController = require('./campaign.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', campaignController.getWorkspace);
router.post('/', campaignController.createProject);
router.put('/:projectId', campaignController.updateProject);
router.post('/:projectId/phases', campaignController.createPhase);
router.put('/phases/:phaseId', campaignController.updatePhase);
router.post('/weekly-plans', campaignController.createWeeklyPlan);
router.put('/weekly-plans/:planId', campaignController.updateWeeklyPlan);
router.post('/weekly-plans/:planId/allocations', campaignController.addAllocation);
router.put('/weekly-plans/:planId/allocations/:allocationId', campaignController.updateAllocation);
router.post('/seed-demo', campaignController.seedDemo);

module.exports = router;
