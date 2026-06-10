import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FileText, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { EmptyState } from '../../shared/components/EmptyState';
import { InlineError } from '../../shared/components/InlineError';
import { Modal } from '../../shared/components/Modal';
import { apiRequest } from '../../shared/services/api';

const CHANNELS = ['facebook', 'website', 'zalo', 'tiktok'];
const POST_STATUSES = ['draft', 'review', 'approved', 'scheduled', 'published'];

const channelLabels = {
  facebook: 'Facebook',
  website: 'Website',
  zalo: 'Zalo',
  tiktok: 'TikTok'
};

const emptyForm = {
  title: '',
  content: '',
  channel: 'facebook',
  owner_id: '',
  status: 'draft',
  publish_date: ''
};

function PostForm({ post, employees, isManager, currentUser, token, onSaved }) {
  const [form, setForm] = useState(post ? {
    title: post.title,
    content: post.content,
    channel: post.channel,
    owner_id: post.owner_id || '',
    status: post.status,
    publish_date: post.publish_date || ''
  } : {
    ...emptyForm,
    owner_id: currentUser.id
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const data = await apiRequest(
        post ? `/api/marketing/posts/${post.id}` : '/api/marketing/posts',
        {
          method: post ? 'PUT' : 'POST',
          token,
          body: {
            title: form.title,
            content: form.content,
            channel: form.channel,
            status: form.status,
            publish_date: form.publish_date || null,
            owner_id: isManager ? form.owner_id || currentUser.id : undefined
          }
        }
      );
      onSaved(data.post);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        Tieu de
        <input
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
        />
      </label>
      <label>
        Noi dung
        <textarea
          rows="7"
          value={form.content}
          onChange={(event) => setForm({ ...form, content: event.target.value })}
          placeholder="Nhap noi dung bai dang, caption hoac tom tat bai website"
        />
      </label>
      <div className="two-column">
        <label>
          Kenh dang
          <select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>
            {CHANNELS.map((channel) => (
              <option value={channel} key={channel}>{channelLabels[channel]}</option>
            ))}
          </select>
        </label>
        <label>
          Trang thai
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {POST_STATUSES.map((status) => (
              <option value={status} key={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="two-column">
        <label>
          Ngay dang
          <input
            type="date"
            value={form.publish_date}
            onChange={(event) => setForm({ ...form, publish_date: event.target.value })}
          />
        </label>
        {isManager ? (
          <label>
            Nguoi phu trach
            <select value={form.owner_id} onChange={(event) => setForm({ ...form, owner_id: event.target.value })}>
              <option value={currentUser.id}>{currentUser.email}</option>
              {employees
                .filter((employee) => employee.id !== currentUser.id)
                .map((employee) => (
                  <option value={employee.id} key={employee.id}>{employee.email}</option>
                ))}
            </select>
          </label>
        ) : (
          <div className="read-only-line">
            <span>Nguoi phu trach</span>
            <strong>{currentUser.email}</strong>
          </div>
        )}
      </div>
      {error && <InlineError message={error} />}
      <button className="primary-action" disabled={saving}>
        {saving ? <RefreshCw className="spin" size={18} /> : <FileText size={18} />}
        {post ? 'Luu thay doi' : 'Tao bai dang'}
      </button>
    </form>
  );
}

export function MarketingPosts({ token, employees, isManager, currentUser }) {
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingPost, setEditingPost] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPosts = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/api/marketing/posts', { token });
      setPosts(data.posts || []);
      setSelectedPostId((current) => {
        if (current && data.posts?.some((post) => post.id === current)) {
          return current;
        }
        return data.posts?.[0]?.id || null;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const employeeById = useMemo(
    () => Object.fromEntries(employees.map((employee) => [employee.id, employee])),
    [employees]
  );
  const selectedPost = posts.find((post) => post.id === selectedPostId) || null;
  const canEditSelected = selectedPost && (
    isManager ||
    selectedPost.created_by === currentUser.id ||
    selectedPost.owner_id === currentUser.id
  );
  const filteredPosts = posts.filter((post) => {
    if (statusFilter !== 'all' && post.status !== statusFilter) {
      return false;
    }

    const owner = employeeById[post.owner_id]?.email || '';
    return `${post.title} ${post.content} ${post.channel} ${post.status} ${owner}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  });

  const handleSaved = async (post) => {
    setShowCreate(false);
    setEditingPost(null);
    await loadPosts();
    setSelectedPostId(post.id);
  };

  const deletePost = async () => {
    if (!selectedPost || !window.confirm(`Xoa bai dang "${selectedPost.title}"?`)) {
      return;
    }

    setError('');
    try {
      await apiRequest(`/api/marketing/posts/${selectedPost.id}`, {
        method: 'DELETE',
        token
      });
      await loadPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="module-layout marketing-posts-layout">
      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Marketing Module</span>
            <h3>Quan ly bai dang</h3>
          </div>
          <button className="primary-action small" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Bai dang moi
          </button>
        </div>

        <div className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tim tieu de, noi dung, kenh hoac nguoi phu trach"
          />
        </div>

        <div className="post-filter-tabs">
          <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>
            Tat ca
          </button>
          {POST_STATUSES.map((status) => (
            <button
              className={statusFilter === status ? 'active' : ''}
              key={status}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>

        {error && <InlineError message={error} />}
        {loading ? (
          <EmptyState text="Dang tai danh sach bai dang..." />
        ) : (
          <div className="post-list">
            {filteredPosts.map((post) => (
              <button
                className={`post-row ${selectedPost?.id === post.id ? 'active' : ''}`}
                key={post.id}
                onClick={() => setSelectedPostId(post.id)}
              >
                <div className="post-row-copy">
                  <strong>{post.title}</strong>
                  <span>{post.content || 'Chua co noi dung'}</span>
                </div>
                <div className="row-tags">
                  <Badge value={channelLabels[post.channel] || post.channel} />
                  <Badge value={post.status} />
                  <span className="post-date">{post.publish_date || 'Chua dat lich'}</span>
                </div>
              </button>
            ))}
            {!filteredPosts.length && <EmptyState text="Khong tim thay bai dang phu hop." />}
          </div>
        )}
      </section>

      <section className="panel detail-panel">
        {selectedPost ? (
          <div className="detail-stack post-detail">
            <div>
              <span className="eyebrow">{channelLabels[selectedPost.channel]}</span>
              <h3>{selectedPost.title}</h3>
            </div>
            <div className="detail-meta">
              <Badge value={selectedPost.status} />
              <span>
                <CalendarDays size={15} />
                {selectedPost.publish_date || 'Chua dat lich'}
              </span>
            </div>
            <div className="post-content">
              {selectedPost.content || 'Bai dang nay chua co noi dung.'}
            </div>
            <div className="read-only-line">
              <span>Nguoi phu trach</span>
              <strong>
                {employeeById[selectedPost.owner_id]?.email ||
                  (selectedPost.owner_id === currentUser.id ? currentUser.email : 'Chua xac dinh')}
              </strong>
            </div>
            <div className="post-actions">
              {canEditSelected && (
                <button className="secondary-action" onClick={() => setEditingPost(selectedPost)}>
                  <Pencil size={17} />
                  Chinh sua
                </button>
              )}
              {isManager && (
                <button className="danger-action" onClick={deletePost}>
                  <Trash2 size={17} />
                  Xoa
                </button>
              )}
            </div>
          </div>
        ) : (
          <EmptyState text="Chon mot bai dang de xem chi tiet." />
        )}
      </section>

      {showCreate && (
        <Modal title="Tao bai dang moi" onClose={() => setShowCreate(false)} className="post-editor-modal">
          <PostForm
            employees={employees}
            isManager={isManager}
            currentUser={currentUser}
            token={token}
            onSaved={handleSaved}
          />
        </Modal>
      )}

      {editingPost && (
        <Modal title="Chinh sua bai dang" onClose={() => setEditingPost(null)} className="post-editor-modal">
          <PostForm
            post={editingPost}
            employees={employees}
            isManager={isManager}
            currentUser={currentUser}
            token={token}
            onSaved={handleSaved}
          />
        </Modal>
      )}
    </div>
  );
}
