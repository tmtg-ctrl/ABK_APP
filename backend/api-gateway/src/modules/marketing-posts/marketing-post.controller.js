const {
  createMarketingPost,
  listMarketingPosts,
  getMarketingPostById,
  updateMarketingPost,
  deleteMarketingPost
} = require('./marketing-post.service');

const VALID_CHANNELS = new Set(['facebook', 'website', 'zalo', 'tiktok']);
const VALID_STATUSES = new Set(['draft', 'review', 'approved', 'scheduled', 'published']);
const MANAGER_ROLES = new Set(['admin', 'marketing_manager', 'department_manager']);

const getUserRole = (req) => req.user?.app_metadata?.role || 'staff';
const getUserDepartment = (req) => req.user?.app_metadata?.department || null;
const isMarketingUser = (req) => getUserRole(req) === 'admin' || getUserDepartment(req) === 'marketing';
const canManageMarketing = (req) => MANAGER_ROLES.has(getUserRole(req));
const canEditPost = (req, post) =>
  canManageMarketing(req) || post.created_by === req.user.id || post.owner_id === req.user.id;

const requireMarketingAccess = (req, res) => {
  if (!isMarketingUser(req)) {
    res.status(403).json({ error: 'Marketing department access required' });
    return false;
  }

  return true;
};

const validatePost = ({ title, channel, status, publish_date: publishDate }, { partial = false } = {}) => {
  if (!partial && (typeof title !== 'string' || !title.trim())) {
    return 'title is required';
  }

  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return 'title cannot be empty';
  }

  if (channel && !VALID_CHANNELS.has(channel)) {
    return 'channel must be facebook, website, zalo, or tiktok';
  }

  if (status && !VALID_STATUSES.has(status)) {
    return 'status must be draft, review, approved, scheduled, or published';
  }

  if (publishDate && !/^\d{4}-\d{2}-\d{2}$/.test(publishDate)) {
    return 'publish_date must use YYYY-MM-DD format';
  }

  return null;
};

exports.createPost = async (req, res, next) => {
  try {
    if (!requireMarketingAccess(req, res)) {
      return;
    }

    const validationError = validatePost(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (req.body.owner_id && req.body.owner_id !== req.user.id && !canManageMarketing(req)) {
      return res.status(403).json({ error: 'Marketing manager permission required to assign post owners' });
    }

    const post = await createMarketingPost({
      title: req.body.title.trim(),
      content: req.body.content,
      channel: req.body.channel,
      ownerId: req.body.owner_id,
      publishDate: req.body.publish_date,
      status: req.body.status,
      userId: req.user.id
    });

    res.status(201).json({
      message: 'Marketing post created successfully',
      post
    });
  } catch (error) {
    next(error);
  }
};

exports.listPosts = async (req, res, next) => {
  try {
    if (!requireMarketingAccess(req, res)) {
      return;
    }

    const posts = await listMarketingPosts();

    res.status(200).json({
      total: posts.length,
      posts
    });
  } catch (error) {
    next(error);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    if (!requireMarketingAccess(req, res)) {
      return;
    }

    const post = await getMarketingPostById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Marketing post not found' });
    }

    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    if (!requireMarketingAccess(req, res)) {
      return;
    }

    const existing = await getMarketingPostById(req.params.postId);
    if (!existing) {
      return res.status(404).json({ error: 'Marketing post not found' });
    }

    if (!canEditPost(req, existing)) {
      return res.status(403).json({ error: 'You do not have permission to edit this marketing post' });
    }

    if (req.body.owner_id !== undefined && !canManageMarketing(req)) {
      return res.status(403).json({ error: 'Marketing manager permission required to assign post owners' });
    }

    const validationError = validatePost(req.body, { partial: true });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const post = await updateMarketingPost(req.params.postId, {
      title: req.body.title?.trim(),
      content: req.body.content,
      channel: req.body.channel,
      ownerId: req.body.owner_id,
      publishDate: req.body.publish_date,
      status: req.body.status
    });

    res.status(200).json({
      message: 'Marketing post updated successfully',
      post
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    if (!requireMarketingAccess(req, res)) {
      return;
    }

    if (!canManageMarketing(req)) {
      return res.status(403).json({ error: 'Marketing manager permission required' });
    }

    const existing = await getMarketingPostById(req.params.postId);
    if (!existing) {
      return res.status(404).json({ error: 'Marketing post not found' });
    }

    await deleteMarketingPost(req.params.postId);
    res.status(200).json({ message: 'Marketing post deleted successfully' });
  } catch (error) {
    next(error);
  }
};
