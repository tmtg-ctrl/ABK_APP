import { getPriorityLabels, getStatusLabels } from '../constants/marketing';
import { useLanguage } from '../i18n/LanguageContext';

export function Badge({ value, tone }) {
  const { language } = useLanguage();
  const statusLabels = getStatusLabels(language);
  const priorityLabels = getPriorityLabels(language);
  return <span className={`badge ${tone || value}`}>{statusLabels[value] || priorityLabels[value] || value}</span>;
}
