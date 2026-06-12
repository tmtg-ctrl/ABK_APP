import { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Image,
  Layers,
  Palette,
  RefreshCw,
  Search,
  Video
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { EmptyState } from '../../shared/components/EmptyState';
import { InlineError } from '../../shared/components/InlineError';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import { apiRequest } from '../../shared/services/api';

const needsWork = (record) => {
  const text = [
    record.imageProgress,
    record.foundation,
    record.floor,
    record.rough,
    record.finishing,
    record.fanpageProgress,
    record.websiteProgress
  ].join(' ').toLowerCase();

  return !text.includes('da dang') && !text.includes('đã đăng');
};

const inferStatus = (record) => {
  const imageProgress = String(record.imageProgress || '').toLowerCase();
  const fanpageProgress = String(record.fanpageProgress || '').toLowerCase();

  if (fanpageProgress.includes('da dang') || fanpageProgress.includes('đã đăng')) {
    return 'done';
  }

  if (imageProgress.includes('canva') || imageProgress.includes('dang') || imageProgress.includes('đang')) {
    return 'doing';
  }

  if (imageProgress.includes('xuat') || imageProgress.includes('logo')) {
    return 'review';
  }

  return 'todo';
};

const summarizeStages = (records) => [
  {
    id: 'saved',
    title: 'Anh da luu',
    icon: Camera,
    count: records.filter((record) => String(record.savedImageAt || '').trim()).length,
    status: 'done'
  },
  {
    id: 'canva',
    title: 'Dang lam Canva',
    icon: Palette,
    count: records.filter((record) => String(record.imageProgress || '').toLowerCase().includes('canva')).length,
    status: 'doing'
  },
  {
    id: 'logo',
    title: 'Can gan logo / xuat anh',
    icon: Image,
    count: records.filter((record) => {
      const text = String(record.imageProgress || '').toLowerCase();
      return text.includes('logo') || text.includes('xuat') || text.includes('xuất');
    }).length,
    status: 'review'
  },
  {
    id: 'publish',
    title: 'Cho dang fanpage',
    icon: Video,
    count: records.filter((record) => String(record.fanpageProgress || '').toLowerCase().includes('cho')).length,
    status: 'todo'
  }
];

export function MediaWorkspace({ token }) {
  const { t } = useLanguage();
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRecords = async (nextYear = year) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ year: nextYear, limit: '220' });
      const data = await apiRequest(`/api/construction-data?${params.toString()}`, { token });
      setRecords(data.records || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(year);
  }, [year]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records
      .filter(needsWork)
      .filter((record) => {
        if (!normalizedQuery) {
          return true;
        }

        return [
          record.investorName,
          record.zaloGroupName,
          record.gdk,
          record.oldAddress,
          record.newAddress,
          record.imageProgress,
          record.fanpageProgress
        ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
      });
  }, [records, query]);

  const mediaStages = summarizeStages(records);

  return (
    <div className="media-workspace">
      <section className="media-hero panel">
        <div>
          <span className="eyebrow">Kho Media Marketing</span>
          <h3>Hang doi san xuat Media / Canva</h3>
          <p>
            Gom cong trinh da co anh, dang lam Canva, can gan logo, cho xuat anh va cho dang fanpage vao mot hang doi de Media xu ly moi ngay.
          </p>
        </div>
        <div className="media-hero-actions">
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
          <button className="secondary-action" disabled={loading} onClick={() => loadRecords(year)}>
            <RefreshCw className={loading ? 'spin' : ''} size={17} />
            {t('action.refresh')}
          </button>
          <a className="primary-action" href="https://www.canva.com/design/" rel="noreferrer" target="_blank">
            <Layers size={17} />
            Canva
          </a>
        </div>
      </section>

      {error && <InlineError message={error} />}

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

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Cong viec Media</span>
            <h3>Cong trinh can xu ly anh</h3>
          </div>
          <CheckCircle2 size={20} />
        </div>
        <div className="search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tim theo cong trinh, GDK, Zalo, trang thai" />
        </div>
        <div className="data-table">
          <div className="table-row table-head media-queue-row">
            <span>Cong trinh</span>
            <span>Trang thai anh</span>
            <span>Fanpage / Website</span>
            <span>Canva</span>
            <span>{t('common.status')}</span>
          </div>
          {filteredRecords.map((record) => (
            <div className="table-row media-queue-row" key={record.id}>
              <div>
                <strong>{record.investorName || 'Chua co ten'}</strong>
                <span>{record.zaloGroupName || record.gdk || record.oldAddress || '-'}</span>
              </div>
              <div>
                <strong>{record.imageProgress || 'Chua cap nhat'}</strong>
                <span>{record.savedImageAt ? `Luu anh: ${record.savedImageAt}` : 'Chua co ngay luu anh'}</span>
              </div>
              <div>
                <strong>{record.fanpageProgress || 'Fanpage chua cap nhat'}</strong>
                <span>{record.websiteProgress || 'Website chua cap nhat'}</span>
              </div>
              <div>
                {record.latestProgressLink ? (
                  <a href={record.latestProgressLink} rel="noreferrer" target="_blank">
                    Mo thiet ke <ExternalLink size={14} />
                  </a>
                ) : (
                  <span>Chua co link Canva</span>
                )}
              </div>
              <Badge value={inferStatus(record)} />
            </div>
          ))}
          {!loading && !filteredRecords.length && <EmptyState text="Khong co cong trinh media nao trong hang doi." />}
        </div>
      </section>

      <section className="panel">
        <div className="module-note">
          <FileSpreadsheet size={24} />
          <h3>Luong lam anh de xuat</h3>
          <p>
            Vao Du lieu cong trinh, bam Media tren tung dong de luu link Canva, danh dau Da gan logo, Da xuat anh, Cho content hoac Da dang fanpage. Media Workspace se tu gom lai thanh hang doi.
          </p>
        </div>
      </section>
    </div>
  );
}
