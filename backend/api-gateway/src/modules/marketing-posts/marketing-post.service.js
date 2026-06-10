const crypto = require('crypto');
const supabase = require('../../config/supabase');

const MARKETING_POST_TYPE = 'marketing_post';

const normalizeMarketingPost = (post) => {
  if (!post) {
    return null;
  }

  return {
    id: post.id,
    title: post.data?.title || '',
    content: post.data?.content || '',
    channel: post.data?.channel || 'facebook',
    owner_id: post.data?.owner_id || post.user_id,
    publish_date: post.data?.publish_date || null,
    status: post.status || 'draft',
    created_by: post.user_id,
    created_at: post.created_at,
    updated_at: post.data?.updated_at || null
  };
};

const createMarketingPost = async ({
  title,
  content,
  channel,
  ownerId,
  publishDate,
  status,
  userId
}) => {
  const now = new Date().toISOString();
  const payload = {
    title,
    content: content || '',
    channel: channel || 'facebook',
    owner_id: ownerId || userId,
    publish_date: publishDate || null,
    updated_at: now
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      id: crypto.randomUUID(),
      task_type: MARKETING_POST_TYPE,
      data: payload,
      status: status || 'draft',
      created_at: now,
      user_id: userId
    }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeMarketingPost(data);
};

const listMarketingPosts = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('task_type', MARKETING_POST_TYPE)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(normalizeMarketingPost);
};

const getMarketingPostById = async (postId) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', postId)
    .eq('task_type', MARKETING_POST_TYPE)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return normalizeMarketingPost(data);
};

const updateMarketingPost = async (postId, updates) => {
  const existing = await getMarketingPostById(postId);

  if (!existing) {
    return null;
  }

  const nextData = {
    title: updates.title ?? existing.title,
    content: updates.content ?? existing.content,
    channel: updates.channel ?? existing.channel,
    owner_id: updates.ownerId ?? existing.owner_id,
    publish_date: updates.publishDate === undefined ? existing.publish_date : updates.publishDate || null,
    updated_at: new Date().toISOString()
  };
  const updatePayload = { data: nextData };

  if (updates.status) {
    updatePayload.status = updates.status;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', postId)
    .eq('task_type', MARKETING_POST_TYPE)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeMarketingPost(data);
};

const deleteMarketingPost = async (postId) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', postId)
    .eq('task_type', MARKETING_POST_TYPE);

  if (error) {
    throw error;
  }
};

module.exports = {
  createMarketingPost,
  listMarketingPosts,
  getMarketingPostById,
  updateMarketingPost,
  deleteMarketingPost
};
