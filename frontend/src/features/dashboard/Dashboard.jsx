import { AlertCircle, CheckCircle2, ClipboardList, Users } from 'lucide-react';
import { Metric } from '../../shared/components/Metric';
import { STATUS_OPTIONS, getStatusLabels } from '../../shared/constants/marketing';
import { useLanguage } from '../../shared/i18n/LanguageContext';

export function Dashboard({ tasks, employees, isManager, onOpenTasks }) {
  const { language, t } = useLanguage();
  const statusLabels = getStatusLabels(language);
  const counts = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status).length;
    return acc;
  }, {});

  return (
    <div className="dashboard-grid">
      <Metric icon={ClipboardList} label={t('dashboard.marketingTasks')} value={tasks.length} tone="green" />
      <Metric icon={Users} label={t('dashboard.employees')} value={isManager ? employees.length : '-'} tone="blue" />
      <Metric icon={AlertCircle} label={t('dashboard.inReview')} value={counts.review || 0} tone="amber" />
      <Metric icon={CheckCircle2} label={t('dashboard.completed')} value={(counts.approved || 0) + (counts.done || 0)} tone="violet" />

      <section className="wide-panel">
        <div className="section-heading">
          <h3>{t('dashboard.statusOverview')}</h3>
          <button className="text-action" onClick={onOpenTasks}>{t('dashboard.openTasks')}</button>
        </div>
        <div className="status-row">
          {STATUS_OPTIONS.map((status) => (
            <div className="status-block" key={status}>
              <span>{statusLabels[status]}</span>
              <strong>{counts[status] || 0}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
