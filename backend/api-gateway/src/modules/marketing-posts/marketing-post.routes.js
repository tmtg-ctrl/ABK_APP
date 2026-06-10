const express = require('express');
const marketingPostController = require('./marketing-post.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);
router.post('/', marketingPostController.createPost);
router.get('/', marketingPostController.listPosts);
router.get('/:postId', marketingPostController.getPost);
router.put('/:postId', marketingPostController.updatePost);
router.delete('/:postId', marketingPostController.deletePost);

module.exports = router;
