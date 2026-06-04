import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  CalendarDays,
  FileSpreadsheet,
  FolderOpen,
  ImagePlus,
  MapPin,
  Pencil,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Upload,
  Users
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { EmptyState } from '../../shared/components/EmptyState';
import { InlineError } from '../../shared/components/InlineError';
import { Modal } from '../../shared/components/Modal';
import { API_BASE_URL, apiRequest } from '../../shared/services/api';

const years = ['2026', '2025'];
const stageFields = [
  ['kickoff', 'Khoi cong'],
  ['foundation', 'Mong'],
  ['floor', 'San/Tang'],
  ['roof', 'Cat noc'],
  ['rough', 'Xay tho'],
  ['finishing', 'Hoan thien']
];
const uploadStages = [
  ['documents', '1. Giay to'],
  ['threeD', '2. 3D'],
  ['foundation', '3. Mong'],
  ['floor', '4. San tang'],
  ['rough', '5. Xay tho'],
  ['finishing', '6. Hoan thien']
];

const constructionColumnOptions = [
  { key: 'investorName', label: 'Chu dau tu', render: (record) => (
    <div>
      <strong>{record.investorName || 'Chua co ten'}</strong>
      <span>{record.oldAddress || record.newAddress || record.address || record.district || 'Chua co dia chi'}</span>
    </div>
  ) },
  { key: 'dataLink', label: 'Link du lieu', render: (record) => (
    <div className="folder-cell">
      <FolderOpen size={15} />
      <span title={record.dataLink}>{record.dataLink || 'Chua gan link'}</span>
    </div>
  ) },
  { key: 'zaloGroupName', label: 'Nhom Zalo', render: (record) => (
    <div>
      <strong>{record.zaloGroupName || '-'}</strong>
      <span>{record.gdk || '-'}</span>
    </div>
  ) },
  { key: 'shootingStatus', label: 'Quay', render: (record) => record.shootingStatus || '-' },
  { key: 'savedImageAt', label: 'Ngay luu anh', render: (record) => record.savedImageAt || '-' },
  { key: 'nextSaveAt', label: 'Ngay luu tiep', render: (record) => record.nextSaveAt || '-' },
  { key: 'stages', label: 'Giai doan anh', render: (record) => (
    <div className="stage-chip-list">
      {stageFields
        .filter(([field]) => record[field])
        .slice(0, 4)
        .map(([field, label]) => (
          <span key={field} title={record[field]}>
            {label}: {record[field]}
          </span>
        ))}
      {!stageFields.some(([field]) => record[field]) && <span>Chua co</span>}
    </div>
  ) },
  { key: 'imageProgress', label: 'Tien do hinh', render: (record) => record.imageProgress || '-' },
  { key: 'dataStatus', label: 'Tinh trang DL', render: (record) => record.dataStatus || '-' },
  { key: 'classification', label: 'Phan loai', render: (record) => record.classification || '-' },
  { key: 'area', label: 'Dien tich', render: (record) => record.area || '-' },
  { key: 'contractValue', label: 'Gia tri HD', render: (record) => record.contractValue || '-' },
  { key: 'note', label: 'Ghi chu', render: (record) => record.note || '-' },
  { key: 'status', label: 'Trang thai', render: (record) => (
    <Badge value={normalizeStatus(record.imageProgress || record.dataStatus || record.shootingStatus)} />
  ) },
  { key: 'action', label: 'Action', render: (record, setEditingRecord) => (
    <div className="construction-actions">
      <button className="secondary-action compact-action" onClick={() => setEditingRecord(record)}>
        <Pencil size={15} />
        Edit
      </button>
      <button className="secondary-action compact-action" onClick={() => setEditingRecord({ ...record, __mediaMode: true })}>
        <ImagePlus size={15} />
        Media
      </button>
    </div>
  ) }
];

const defaultConstructionColumns = ['investorName', 'dataLink', 'zaloGroupName', 'stages', 'status', 'action'];

const normalizeStatus = (value) => {
  const text = String(value || '').toLowerCase();

  if (text.includes('da') || text.includes('đã') || text.includes('fanpage') || text.includes('xong')) {
    return 'done';
  }

  if (text.includes('dang') || text.includes('đang') || text.includes('cho') || text.includes('chờ')) {
    return 'doing';
  }

  if (text.includes('thieu') || text.includes('thiếu')) {
    return 'review';
  }

  return 'todo';
};

export function ConstructionData({ token }) {
  const [records, setRecords] = useState([]);
  const [sheetInfo, setSheetInfo] = useState(null);
  const [year, setYear] = useState('2026');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = window.localStorage.getItem('abk_construction_columns');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length ? parsed : defaultConstructionColumns;
    } catch {
      return defaultConstructionColumns;
    }
  });

  const activeColumns = constructionColumnOptions.filter((column) => visibleColumns.includes(column.key));
  const tableTemplate = activeColumns.map((column) => (column.key === 'action' ? '190px' : 'minmax(150px, 1fr)')).join(' ');

  const toggleColumn = (key) => {
    setVisibleColumns((current) => {
      const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key];
      const safeNext = next.includes('action') ? next : [...next, 'action'];
      window.localStorage.setItem('abk_construction_columns', JSON.stringify(safeNext));
      return safeNext;
    });
  };

  const loadData = async (nextSearch = search, nextYear = year) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        limit: '160',
        year: nextYear
      });

      if (nextSearch) {
        params.set('search', nextSearch);
      }

      const data = await apiRequest(`/api/construction-data?${params.toString()}`, { token });
      setRecords(data.records || []);
      setSheetInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData('', year);
  }, [year]);

  const submitSearch = (event) => {
    event.preventDefault();
    loadData(search, year);
  };

  const counts = useMemo(() => {
    const waiting = records.filter((record) =>
      [record.foundation, record.floor, record.rough, record.finishing].some((value) =>
        String(value || '').toLowerCase().includes('cho') || String(value || '').toLowerCase().includes('chờ')
      )
    ).length;
    const hasFolder = records.filter((record) => record.dataLink).length;
    const needShoot = records.filter((record) => String(record.shootingStatus || '').toLowerCase().includes('lich')).length;

    return { waiting, hasFolder, needShoot };
  }, [records]);

  return (
    <div className="module-layout construction-layout">
      <section className="panel construction-main-panel">
        <div className="construction-summary">
          <div className="module-note">
            <FileSpreadsheet size={24} />
            <h3>{sheetInfo?.sheetName || `Quan ly cong trinh ${year}`}</h3>
            <p>Man hinh nay doc va cap nhat truc tiep vao tab cong trinh cua Google Sheet. Sheet van la nguon du lieu chinh, app chi giup loc, xem nhanh va sua dung cot.</p>
          </div>
          <div className="quick-list construction-quick-list">
            <div>
              <Building2 size={18} />
              <span>{records.length} dong dang hien thi</span>
            </div>
            <div>
              <FolderOpen size={18} />
              <span>{counts.hasFolder} cong trinh da co link du lieu</span>
            </div>
            <div>
              <RefreshCw size={18} />
              <span>{counts.waiting} cong trinh co giai doan dang cho</span>
            </div>
            <div>
              <Pencil size={18} />
              <span>{counts.needShoot} cong trinh dang can len lich quay</span>
            </div>
          </div>
        </div>

        <div className="section-heading">
          <div>
            <span className="eyebrow">Google Sheet ABK</span>
            <h3>Du lieu cong trinh {year}</h3>
          </div>
          <div className="row-tags">
            <button className="primary-action small" onClick={() => setCreatingRecord(true)}>
              <Plus size={16} />
              New construction
            </button>
            <button className="secondary-action" onClick={() => loadData(search, year)} disabled={loading}>
              <RefreshCw className={loading ? 'spin' : ''} size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="construction-toolbar">
          <div className="year-selector" aria-label="Chon nam cong trinh">
            {years.map((item) => (
              <button
                key={item}
                className={item === year ? 'active' : ''}
                type="button"
                onClick={() => {
                  setYear(item);
                  setSearch('');
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <form className="search-box" onSubmit={submitSearch}>
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tim ten chu dau tu, GDK, Zalo, khu vuc" />
          </form>
          <div className="column-picker">
            <button className="secondary-action" onClick={() => setShowColumns((current) => !current)} type="button">
              <SlidersHorizontal size={16} />
              Columns
            </button>
            {showColumns && (
              <div className="column-picker-menu">
                {constructionColumnOptions.map((column) => (
                  <label key={column.key}>
                    <input
                      checked={visibleColumns.includes(column.key)}
                      disabled={column.key === 'action'}
                      onChange={() => toggleColumn(column.key)}
                      type="checkbox"
                    />
                    {column.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <InlineError message={error} />}

        <div className="data-table construction-data-table">
          <div className="table-row table-head construction-table-row" style={{ gridTemplateColumns: tableTemplate }}>
            {activeColumns.map((column) => (
              <span key={column.key}>{column.label}</span>
            ))}
          </div>
          {records.map((record) => (
            <div className="table-row construction-table-row" key={record.id} style={{ gridTemplateColumns: tableTemplate }}>
              {activeColumns.map((column) => (
                <div className="construction-cell" key={column.key}>
                  {column.render(record, setEditingRecord)}
                </div>
              ))}
            </div>
          ))}
          {!loading && !records.length && <EmptyState text="Khong tim thay cong trinh nao." />}
        </div>
      </section>

      {editingRecord && (
        <Modal
          className="construction-edit-modal"
          title={editingRecord.__mediaMode ? 'Media / Canva workflow' : 'Cap nhat cong trinh'}
          onClose={() => setEditingRecord(null)}
        >
          <ConstructionSheetForm
            mode={editingRecord.__mediaMode ? 'media' : 'edit'}
            record={editingRecord}
            token={token}
            onSaved={() => {
              setEditingRecord(null);
              loadData(search, year);
            }}
          />
        </Modal>
      )}

      {creatingRecord && (
        <Modal className="construction-edit-modal" title="Them cong trinh moi" onClose={() => setCreatingRecord(false)}>
          <ConstructionSheetForm
            mode="create"
            record={{ year }}
            token={token}
            onSaved={() => {
              setCreatingRecord(false);
              loadData(search, year);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function ConstructionSheetForm({ mode = 'edit', record, token, onSaved }) {
  const isCreating = mode === 'create';
  const isMediaOnly = mode === 'media';
  const [form, setForm] = useState({
    year: record.year || '2026',
    investorName: record.investorName || '',
    dataLink: record.dataLink || '',
    zaloGroupName: record.zaloGroupName || '',
    gdk: record.gdk || '',
    oldAddress: record.oldAddress || '',
    newAddress: record.newAddress || '',
    address: record.address || '',
    district: record.district || '',
    classification: record.classification || '',
    shootingStatus: record.shootingStatus || '',
    savedImageAt: record.savedImageAt || '',
    nextSaveAt: record.nextSaveAt || '',
    kickoff: record.kickoff || '',
    foundation: record.foundation || '',
    floor: record.floor || '',
    roof: record.roof || '',
    rough: record.rough || '',
    finishing: record.finishing || '',
    imageProgress: record.imageProgress || '',
    dataStatus: record.dataStatus || '',
    fanpageProgress: record.fanpageProgress || '',
    websiteProgress: record.websiteProgress || '',
    latestProgressLink: record.latestProgressLink || '',
    websiteUrl: record.websiteUrl || '',
    note: record.note || ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('foundation');
  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [loadingExistingPhotos, setLoadingExistingPhotos] = useState(false);
  const [photoLoadError, setPhotoLoadError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [logoDataUrl, setLogoDataUrl] = useState(() => window.localStorage.getItem('abk_media_logo') || '');
  const [error, setError] = useState('');

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const loadExistingPhotos = async (stage = uploadStage) => {
    if (isCreating || !record.dataLink) {
      setPhotoLoadError('');
      setExistingPhotos((current) => {
        current.forEach((photo) => photo.previewUrl && URL.revokeObjectURL(photo.previewUrl));
        return [];
      });
      return;
    }

    setLoadingExistingPhotos(true);
    setPhotoLoadError('');

    try {
      const params = new URLSearchParams({
        year: record.year,
        stage
      });
      const data = await apiRequest(`/api/construction-data/${record.sheetRowNumber}/photos?${params.toString()}`, { token });
      const files = data.files || [];
      const previews = await Promise.all(
        files.slice(0, 24).map(async (photo) => {
          try {
            const response = await fetch(`${API_BASE_URL}${photo.url}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            if (!response.ok) {
              throw new Error(`Photo preview failed: ${response.status}`);
            }

            const blob = await response.blob();

            return {
              ...photo,
              previewUrl: URL.createObjectURL(blob),
              previewError: ''
            };
          } catch (err) {
            return {
              ...photo,
              previewUrl: '',
              previewError: err.message
            };
          }
        })
      );
      setExistingPhotos((current) => {
        current.forEach((photo) => photo.previewUrl && URL.revokeObjectURL(photo.previewUrl));
        return previews;
      });
    } catch (err) {
      setExistingPhotos((current) => {
        current.forEach((photo) => photo.previewUrl && URL.revokeObjectURL(photo.previewUrl));
        return [];
      });
      setPhotoLoadError(err.message);
    } finally {
      setLoadingExistingPhotos(false);
    }
  };

  useEffect(() => {
    loadExistingPhotos(uploadStage);
  }, [uploadStage]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const endpoint = isCreating
        ? `/api/construction-data?year=${form.year}`
        : `/api/construction-data/${record.sheetRowNumber}?year=${record.year}`;

      await apiRequest(endpoint, {
        method: isCreating ? 'POST' : 'PUT',
        token,
        body: form
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadPhotos = async () => {
    if (!photos.length) {
      setError('Hay keo anh vao o upload truoc.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const body = new FormData();
      body.append('stage', uploadStage);
      body.append('year', record.year);
      photos.forEach((photo) => body.append('photos', photo));

      await apiRequest(`/api/construction-data/${record.sheetRowNumber}/photos?year=${record.year}`, {
        method: 'POST',
        token,
        body
      });

      setPhotos([]);
      await loadExistingPhotos(uploadStage);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setPhotos(Array.from(event.dataTransfer.files || []).filter((file) => file.type.startsWith('image/')));
  };

  const selectLogo = (file) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setLogoDataUrl(dataUrl);
      window.localStorage.setItem('abk_media_logo', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const uploadEditedPhoto = async (blob, filename) => {
    setUploading(true);
    setError('');

    try {
      const body = new FormData();
      body.append('stage', uploadStage);
      body.append('year', record.year);
      body.append('photos', new File([blob], filename, { type: 'image/jpeg' }));

      await apiRequest(`/api/construction-data/${record.sheetRowNumber}/photos?year=${record.year}`, {
        method: 'POST',
        token,
        body
      });

      await loadExistingPhotos(uploadStage);
      setSelectedPhoto(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="construction-edit-form" onSubmit={submit}>
      <div className="construction-edit-hero">
        <div>
          <span>{isCreating ? 'Dong moi' : `Dong ${record.sheetRowNumber}`} - {form.year}</span>
          <h3>{form.investorName || 'Chua co ten'}</h3>
          <p>{form.dataLink || 'Chua co LINK DU LIEU'}</p>
        </div>
        <Badge value={normalizeStatus(form.imageProgress || form.dataStatus || form.shootingStatus)} />
      </div>

      <div className="construction-edit-grid">
        <section className="edit-section">
          <div className="edit-section-title">
            <Building2 size={18} />
            <strong>Thong tin sheet</strong>
          </div>

          <div className="edit-field-grid">
            <label>
              Ho va ten
              <input value={form.investorName} onChange={(event) => updateField('investorName', event.target.value)} />
            </label>
            <label>
              GDK
              <input value={form.gdk} onChange={(event) => updateField('gdk', event.target.value)} />
            </label>
            <label className="wide-field">
              Link du lieu
              <input value={form.dataLink} onChange={(event) => updateField('dataLink', event.target.value)} />
            </label>
            <label className="wide-field">
              Ten nhom Zalo
              <input value={form.zaloGroupName} onChange={(event) => updateField('zaloGroupName', event.target.value)} />
            </label>
          </div>

          <div className="edit-info-strip">
            <div>
              <MapPin size={16} />
              <span>{form.oldAddress || form.district || 'Chua co khu vuc'}</span>
            </div>
            <div>
              <Users size={16} />
              <span>{form.zaloGroupName || 'Chua co nhom Zalo'}</span>
            </div>
          </div>

          <div className="edit-field-grid">
            <label>
              Dia chi cu / Khu vuc
              <input value={form.oldAddress || form.district} onChange={(event) => updateField(form.year === '2025' ? 'district' : 'oldAddress', event.target.value)} />
            </label>
            <label>
              Dia chi moi
              <input value={form.newAddress || form.address} onChange={(event) => updateField(form.year === '2025' ? 'address' : 'newAddress', event.target.value)} />
            </label>
            <label>
              Phan loai
              <input value={form.classification} onChange={(event) => updateField('classification', event.target.value)} />
            </label>
            <label>
              Quay cong trinh
              <select value={form.shootingStatus} onChange={(event) => updateField('shootingStatus', event.target.value)}>
                <option value="">Chua chon</option>
                <option value="Theo dõi">Theo doi</option>
                <option value="Lên lịch quay">Len lich quay</option>
                <option value="QUAY">Quay</option>
                <option value="KHÔNG QUAY">Khong quay</option>
              </select>
            </label>
          </div>

          <div className="edit-section-title compact-title">
            <CalendarDays size={18} />
            <strong>Tien do anh</strong>
          </div>

          <div className="stage-form-grid">
            {stageFields.map(([field, label]) => (
              <label key={field}>
                {label}
                <select value={form[field] || ''} onChange={(event) => updateField(field, event.target.value)}>
                  <option value="">Chua co</option>
                  <option value="Đang chờ">Dang cho</option>
                  <option value="Đã lưu ảnh">Da luu anh</option>
                  <option value="Đã làm ảnh">Da lam anh</option>
                  <option value="Fanpage">Fanpage</option>
                  <option value="Không lấy">Khong lay</option>
                  <option value="✅ Đã có">Da co</option>
                  <option value="❌ Bị Thiếu">Bi thieu</option>
                </select>
              </label>
            ))}
          </div>

          <div className="edit-field-grid">
            <label>
              Ngay luu anh
              <input value={form.savedImageAt} onChange={(event) => updateField('savedImageAt', event.target.value)} />
            </label>
            <label>
              Ngay luu ke tiep
              <input value={form.nextSaveAt} onChange={(event) => updateField('nextSaveAt', event.target.value)} />
            </label>
            <label>
              Tien do lam hinh
              <input value={form.imageProgress} onChange={(event) => updateField('imageProgress', event.target.value)} />
            </label>
            <label>
              Tinh trang du lieu
              <input value={form.dataStatus} onChange={(event) => updateField('dataStatus', event.target.value)} />
            </label>
            <label className="wide-field">
              Ghi chu
              <textarea rows={4} value={form.note} onChange={(event) => updateField('note', event.target.value)} />
            </label>
          </div>
        </section>

        {!isCreating && (
        <section className="edit-section media-edit-section">
          <div className="edit-section-title">
            <Palette size={18} />
            <strong>Canva va logo</strong>
          </div>
          <div className="edit-field-grid">
            <label className="wide-field">
              Link Canva / tien do gan nhat
              <input
                placeholder="Dan link Canva sau khi tao thiet ke"
                value={form.latestProgressLink}
                onChange={(event) => updateField('latestProgressLink', event.target.value)}
              />
            </label>
            <label>
              Tien do lam hinh
              <select value={form.imageProgress} onChange={(event) => updateField('imageProgress', event.target.value)}>
                <option value="">Chua chon</option>
                <option value="Can lay anh">Can lay anh</option>
                <option value="Da luu anh">Da luu anh</option>
                <option value="Dang lam Canva">Dang lam Canva</option>
                <option value="Da gan logo">Da gan logo</option>
                <option value="Da xuat anh">Da xuat anh</option>
                <option value="Da dang">Da dang</option>
              </select>
            </label>
            <label>
              Fanpage
              <select value={form.fanpageProgress} onChange={(event) => updateField('fanpageProgress', event.target.value)}>
                <option value="">Chua chon</option>
                <option value="Chua dang">Chua dang</option>
                <option value="Cho content">Cho content</option>
                <option value="Da dang fanpage">Da dang fanpage</option>
              </select>
            </label>
            <label>
              Website
              <select value={form.websiteProgress} onChange={(event) => updateField('websiteProgress', event.target.value)}>
                <option value="">Chua chon</option>
                <option value="Chua dang">Chua dang</option>
                <option value="Cho bai website">Cho bai website</option>
                <option value="Da dang website">Da dang website</option>
              </select>
            </label>
            <label className="wide-field">
              Link bai viet / file xuat
              <input value={form.websiteUrl} onChange={(event) => updateField('websiteUrl', event.target.value)} />
            </label>
          </div>
          <div className="canva-action-strip">
            <a className="secondary-action" href="https://www.canva.com/design/" rel="noreferrer" target="_blank">
              <Palette size={16} />
              Open Canva
            </a>
            {form.latestProgressLink && (
              <a className="primary-action" href={form.latestProgressLink} rel="noreferrer" target="_blank">
                <ImagePlus size={16} />
                Open design
              </a>
            )}
          </div>
          <label className="logo-picker">
            <span>Logo gan len anh</span>
            <input accept="image/*" type="file" onChange={(event) => selectLogo(event.target.files?.[0])} />
            <strong>{logoDataUrl ? 'Da co logo' : 'Chon file logo'}</strong>
          </label>

          <div className="photo-stage-tabs">
            {uploadStages.map(([value, label]) => (
              <button
                className={uploadStage === value ? 'active' : ''}
                key={value}
                onClick={() => {
                  setError('');
                  setUploadStage(value);
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <label className="drop-zone edit-drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
            <input
              accept="image/*"
              multiple
              type="file"
              onChange={(event) => setPhotos(Array.from(event.target.files || []))}
            />
            <ImagePlus size={26} />
            <strong>{photos.length ? `${photos.length} anh da chon` : 'Keo anh vao day'}</strong>
            <span>{record.dataLink ? 'Anh se duoc luu vao thu muc dang chon' : 'Dong nay chua co LINK DU LIEU.'}</span>
          </label>

          <button className="primary-action" disabled={uploading || !photos.length || !record.dataLink} type="button" onClick={uploadPhotos}>
            {uploading ? <RefreshCw className="spin" size={18} /> : <Upload size={18} />}
            Upload anh
          </button>

          <div className="existing-photo-strip">
            <div className="existing-photo-title">
              <span>Anh dang co</span>
              <strong>{loadingExistingPhotos ? 'Dang tai anh...' : `${existingPhotos.length} anh`}</strong>
            </div>
            {loadingExistingPhotos ? (
              <div className="existing-photo-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div className="photo-skeleton" key={index}>
                    <RefreshCw className="spin" size={18} />
                    <span>Dang tai</span>
                  </div>
                ))}
              </div>
            ) : photoLoadError ? (
              <div className="photo-load-state">
                <InlineError message={photoLoadError} />
                <button className="secondary-action" onClick={() => loadExistingPhotos(uploadStage)} type="button">
                  <RefreshCw size={16} />
                  Thu lai
                </button>
              </div>
            ) : existingPhotos.length > 0 ? (
              <div className="existing-photo-grid">
                {existingPhotos.map((photo) => (
                  <div className="photo-card" key={photo.name} title={photo.name}>
                    <a href={photo.previewUrl || '#'} rel="noreferrer" target="_blank">
                      {photo.previewUrl ? (
                        <img alt={photo.name} loading="lazy" src={photo.previewUrl} />
                      ) : (
                        <div className="photo-preview-fallback">
                          <ImagePlus size={20} />
                          <small>Preview loi</small>
                        </div>
                      )}
                    </a>
                    <span>{photo.name}</span>
                    <button
                      className="secondary-action compact-action"
                      disabled={!photo.previewUrl}
                      onClick={() => setSelectedPhoto(photo)}
                      type="button"
                    >
                      Chinh 1:1
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p>{record.dataLink ? 'Thu muc nay chua co anh.' : 'Chua co LINK DU LIEU.'}</p>
            )}
          </div>
          {selectedPhoto && (
            <PhotoSquareEditor
              logoDataUrl={logoDataUrl}
              onClose={() => setSelectedPhoto(null)}
              onUpload={uploadEditedPhoto}
              photo={selectedPhoto}
              uploading={uploading}
            />
          )}
        </section>
        )}
      </div>

      <div className="edit-modal-footer">
        {error && <InlineError message={error} />}
        <button className="primary-action" disabled={saving}>
          {saving ? <RefreshCw className="spin" size={18} /> : <Save size={18} />}
          {isCreating ? 'Them cong trinh vao Google Sheet' : 'Luu thong tin vao Google Sheet'}
        </button>
      </div>
    </form>
  );
}

function PhotoSquareEditor({ logoDataUrl, onClose, onUpload, photo, uploading }) {
  const canvasRef = useRef(null);
  const [imageElement, setImageElement] = useState(null);
  const [logoElement, setLogoElement] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [logoSize, setLogoSize] = useState(18);
  const [logoPosition, setLogoPosition] = useState('bottom-right');

  useEffect(() => {
    const image = new Image();
    image.onload = () => setImageElement(image);
    image.src = photo.previewUrl;
  }, [photo.previewUrl]);

  useEffect(() => {
    if (!logoDataUrl) {
      setLogoElement(null);
      return;
    }

    const logo = new Image();
    logo.onload = () => setLogoElement(logo);
    logo.src = logoDataUrl;
  }, [logoDataUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElement) {
      return;
    }

    const size = 1080;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const baseScale = Math.max(size / imageElement.width, size / imageElement.height);
    const scale = baseScale * zoom;
    const width = imageElement.width * scale;
    const height = imageElement.height * scale;
    const x = (size - width) / 2 + offsetX * size * 0.35;
    const y = (size - height) / 2 + offsetY * size * 0.35;

    ctx.drawImage(imageElement, x, y, width, height);

    if (logoElement) {
      const logoWidth = size * (logoSize / 100);
      const logoHeight = logoWidth * (logoElement.height / logoElement.width);
      const margin = size * 0.035;
      const positions = {
        'bottom-right': [size - logoWidth - margin, size - logoHeight - margin],
        'bottom-left': [margin, size - logoHeight - margin],
        'top-right': [size - logoWidth - margin, margin],
        'top-left': [margin, margin]
      };
      const [logoX, logoY] = positions[logoPosition] || positions['bottom-right'];
      ctx.drawImage(logoElement, logoX, logoY, logoWidth, logoHeight);
    }
  }, [imageElement, logoElement, logoPosition, logoSize, offsetX, offsetY, zoom]);

  const exportBlob = () =>
    new Promise((resolve) => {
      canvasRef.current.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });

  const download = async () => {
    const blob = await exportBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `abk-1x1-${photo.name.replace(/\.[^.]+$/, '')}.jpg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const upload = async () => {
    const blob = await exportBlob();
    await onUpload(blob, `abk-1x1-${photo.name.replace(/\.[^.]+$/, '')}.jpg`);
  };

  return (
    <div className="photo-editor">
      <div className="photo-editor-head">
        <div>
          <span>Crop 1:1 va gan logo</span>
          <strong>{photo.name}</strong>
        </div>
        <button className="secondary-action compact-action" onClick={onClose} type="button">
          Close
        </button>
      </div>
      <canvas height="1080" ref={canvasRef} width="1080" />
      <div className="photo-editor-controls">
        <label>
          Zoom
          <input max="2.4" min="1" onChange={(event) => setZoom(Number(event.target.value))} step="0.01" type="range" value={zoom} />
        </label>
        <label>
          Doi ngang
          <input max="1" min="-1" onChange={(event) => setOffsetX(Number(event.target.value))} step="0.01" type="range" value={offsetX} />
        </label>
        <label>
          Doi doc
          <input max="1" min="-1" onChange={(event) => setOffsetY(Number(event.target.value))} step="0.01" type="range" value={offsetY} />
        </label>
        <label>
          Logo size
          <input max="35" min="8" onChange={(event) => setLogoSize(Number(event.target.value))} step="1" type="range" value={logoSize} />
        </label>
        <label>
          Vi tri logo
          <select value={logoPosition} onChange={(event) => setLogoPosition(event.target.value)}>
            <option value="bottom-right">Duoi phai</option>
            <option value="bottom-left">Duoi trai</option>
            <option value="top-right">Tren phai</option>
            <option value="top-left">Tren trai</option>
          </select>
        </label>
      </div>
      <div className="canva-action-strip">
        <button className="secondary-action" onClick={download} type="button">
          Tai JPG
        </button>
        <button className="primary-action" disabled={uploading} onClick={upload} type="button">
          {uploading ? 'Dang luu...' : 'Luu vao thu muc'}
        </button>
      </div>
    </div>
  );
}
