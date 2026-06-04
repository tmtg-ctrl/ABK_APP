import { priorityLabels, statusLabels } from '../constants/marketing';

export function Badge({ value, tone }) {
  return <span className={`badge ${tone || value}`}>{statusLabels[value] || priorityLabels[value] || value}</span>;
}
