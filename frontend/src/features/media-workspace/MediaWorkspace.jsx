import {
  Camera,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Image,
  Layers,
  Palette,
  Search,
  Video
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';

const mediaStages = [
  {
    id: 'shooting',
    title: 'Chup anh cong trinh',
    icon: Camera,
    count: 8,
    status: 'doing'
  },
  {
    id: 'photo-edit',
    title: 'Chinh sua anh',
    icon: Image,
    count: 12,
    status: 'review'
  },
  {
    id: 'video',
    title: 'Quay / edit video',
    icon: Video,
    count: 5,
    status: 'doing'
  },
  {
    id: 'design',
    title: 'Thiet ke an pham',
    icon: Palette,
    count: 7,
    status: 'todo'
  }
];

const mediaItems = [
  {
    id: 'media-1',
    project: 'DA 01 - Long An',
    type: 'Photo',
    job: 'Chup mat tien va khu vuc ban giao',
    owner: 'Media Team',
    status: 'doing',
    source: 'Google Sheet cu'
  },
  {
    id: 'media-2',
    project: 'DA 10 - Dong Sai Gon',
    type: 'Video',
    job: 'Edit video gioi thieu cong trinh',
    owner: 'Video Editor',
    status: 'review',
    source: 'Drive Folder'
  },
  {
    id: 'media-3',
    project: 'DA 28 - Bac Sai Gon',
    type: 'Design',
    job: 'Banner campaign Facebook',
    owner: 'Designer',
    status: 'todo',
    source: 'App'
  }
];

const legacySheets = [
  {
    id: 'sheet-1',
    name: 'Sheet tong hop hinh anh cong trinh',
    owner: 'Nguoi cu',
    status: 'review',
    problem: 'Ten cot khong dong nhat, trung du lieu'
  },
  {
    id: 'sheet-2',
    name: 'Sheet video / content da dang',
    owner: 'Marketing',
    status: 'doing',
    problem: 'Kho tim file goc va trang thai edit'
  }
];

export function MediaWorkspace() {
  return (
    <div className="media-workspace">
      <section className="media-hero panel">
        <div>
          <span className="eyebrow">Marketing Media</span>
          <h3>Media operation workspace</h3>
          <p>
            Gom cong viec chup anh, chinh sua anh, quay video, edit video, thiet ke va du lieu cong trinh vao mot luong de doi media de quan ly hon.
          </p>
        </div>
        <div className="media-hero-actions">
          <button className="secondary-action">
            <FileSpreadsheet size={17} />
            Legacy sheets
          </button>
          <button className="primary-action">
            <Layers size={17} />
            New media job
          </button>
        </div>
      </section>

      <section className="media-stage-grid">
        {mediaStages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div className="media-stage-card" key={stage.id}>
              <Icon size={20} />
              <span>{stage.title}</span>
              <strong>{stage.count}</strong>
              <Badge value={stage.status} />
            </div>
          );
        })}
      </section>

      <div className="module-layout">
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Media jobs</span>
              <h3>Cong viec media dang xu ly</h3>
            </div>
            <CheckCircle2 size={20} />
          </div>
          <div className="search-box">
            <Search size={17} />
            <input placeholder="Search by project, type, owner" />
          </div>
          <div className="data-table">
            <div className="table-row table-head media-table-row">
              <span>Project</span>
              <span>Type</span>
              <span>Job</span>
              <span>Status</span>
              <span>Source</span>
            </div>
            {mediaItems.map((item) => (
              <div className="table-row media-table-row" key={item.id}>
                <strong>{item.project}</strong>
                <span>{item.type}</span>
                <span>{item.job}</span>
                <Badge value={item.status} />
                <span>{item.source}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="module-note">
            <Database size={24} />
            <h3>Luong doi du lieu phu hop</h3>
            <p>
              Truoc mat co the hien thi du lieu tu Google Sheet cu de moi nguoi van dung. Song song, app moi nen chuan hoa lai thanh media jobs, asset library va project data.
            </p>
          </div>
          <div className="workflow-steps">
            <div>
              <strong>1. Tam giu sheet cu</strong>
              <span>Khong cat ngang cong viec cua moi nguoi.</span>
            </div>
            <div>
              <strong>2. Tao view trong app</strong>
              <span>App doc/hien thi du lieu sheet theo form de xem de hon.</span>
            </div>
            <div>
              <strong>3. Chuan hoa dan</strong>
              <span>Moi du lieu moi nhap bang app, sheet chi lam legacy.</span>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Legacy data</span>
            <h3>Google Sheet dang can don lai</h3>
          </div>
          <FileSpreadsheet size={20} />
        </div>
        <div className="legacy-sheet-grid">
          {legacySheets.map((sheet) => (
            <div className="legacy-sheet-card" key={sheet.id}>
              <FileSpreadsheet size={20} />
              <div>
                <strong>{sheet.name}</strong>
                <span>{sheet.owner}</span>
                <p>{sheet.problem}</p>
              </div>
              <Badge value={sheet.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
