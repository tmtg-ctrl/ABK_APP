const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

jest.mock('../modules/marketing-posts/marketing-post.service', () => ({
  createMarketingPost: jest.fn(),
  listMarketingPosts: jest.fn(),
  getMarketingPostById: jest.fn(),
  updateMarketingPost: jest.fn(),
  deleteMarketingPost: jest.fn()
}));

const postService = require('../modules/marketing-posts/marketing-post.service');
const postController = require('../modules/marketing-posts/marketing-post.controller');

const marketingUser = {
  id: 'user-1',
  app_metadata: { role: 'marketing_staff', department: 'marketing' }
};

describe('Marketing Post Controller', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();
  });

  it('rejects post creation without a title', async () => {
    const req = { body: {}, user: marketingUser };
    const res = createResponse();

    await postController.createPost(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'title is required' });
  });

  it('creates a post for a marketing user', async () => {
    postService.createMarketingPost.mockResolvedValue({ id: 'post-1', title: 'June campaign' });
    const req = {
      body: {
        title: ' June campaign ',
        channel: 'facebook',
        status: 'draft',
        publish_date: '2026-06-20'
      },
      user: marketingUser
    };
    const res = createResponse();

    await postController.createPost(req, res, next);

    expect(postService.createMarketingPost).toHaveBeenCalledWith(expect.objectContaining({
      title: 'June campaign',
      channel: 'facebook',
      status: 'draft',
      publishDate: '2026-06-20',
      userId: 'user-1'
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('prevents another staff user from editing a post', async () => {
    postService.getMarketingPostById.mockResolvedValue({
      id: 'post-1',
      created_by: 'user-2',
      owner_id: 'user-2'
    });
    const req = {
      params: { postId: 'post-1' },
      body: { title: 'Changed' },
      user: marketingUser
    };
    const res = createResponse();

    await postController.updatePost(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(postService.updateMarketingPost).not.toHaveBeenCalled();
  });

  it('allows a marketing manager to delete a post', async () => {
    postService.getMarketingPostById.mockResolvedValue({ id: 'post-1' });
    postService.deleteMarketingPost.mockResolvedValue();
    const req = {
      params: { postId: 'post-1' },
      user: {
        id: 'manager-1',
        app_metadata: { role: 'marketing_manager', department: 'marketing' }
      }
    };
    const res = createResponse();

    await postController.deletePost(req, res, next);

    expect(postService.deleteMarketingPost).toHaveBeenCalledWith('post-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
