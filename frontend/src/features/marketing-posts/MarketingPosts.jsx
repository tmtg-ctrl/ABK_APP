import { CalendarDays, FileText, Plus, Search } from 'lucide-react';
import { Badge } from '../../shared/components/Badge';

const samplePosts = [
  {
    id: 'post-1',
    title: 'Bai dang khai truong du an thang 6',
    channel: 'Facebook',
    owner: 'Marketing Team',
    status: 'review',
    publishDate: '2026-06-12'
  },
  {
    id: 'post-2',
    title: 'Noi dung tuyen dung nhan su kinh doanh',
    channel: 'Website',
    owner: 'Content',
    status: 'doing',
    publishDate: '2026-06-18'
  }
];

export function MarketingPosts() {
  return (
    <div className="module-layout">
      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Marketing Module</span>
            <h3>Quan ly bai dang</h3>
          </div>
          <button className="primary-action small">
            <Plus size={16} />
            New post
          </button>
        </div>
        <div className="search-box">
          <Search size={17} />
          <input placeholder="Search posts" />
        </div>
        <div className="data-table">
          <div className="table-row table-head">
            <span>Title</span>
            <span>Channel</span>
            <span>Owner</span>
            <span>Status</span>
            <span>Publish</span>
          </div>
          {samplePosts.map((post) => (
            <div className="table-row" key={post.id}>
              <strong>{post.title}</strong>
              <span>{post.channel}</span>
              <span>{post.owner}</span>
              <Badge value={post.status} />
              <span>{post.publishDate}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="module-note">
          <FileText size={24} />
          <h3>Next backend module</h3>
          <p>Man hinh nay la khung mau. Sau nay minh se them API luu bai dang, kenh dang, lich dang va luong duyet noi dung.</p>
        </div>
        <div className="quick-list">
          <div>
            <CalendarDays size={18} />
            <span>Lich dang bai theo ngay</span>
          </div>
          <div>
            <FileText size={18} />
            <span>Duyet noi dung truoc khi dang</span>
          </div>
        </div>
      </section>
    </div>
  );
}
