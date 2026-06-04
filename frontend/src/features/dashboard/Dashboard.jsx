import { AlertCircle, CheckCircle2, ClipboardList, Users } from 'lucide-react';
import { Metric } from '../../shared/components/Metric';
import { STATUS_OPTIONS, statusLabels } from '../../shared/constants/marketing';

export function Dashboard({ tasks, employees, isManager, onOpenTasks }) {
  const counts = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status).length;
    return acc;
  }, {});

  return (
    <div className="dashboard-grid">
      <Metric icon={ClipboardList} label="Marketing tasks" value={tasks.length} tone="green" />
      <Metric icon={Users} label="Marketing employees" value={isManager ? employees.length : '-'} tone="blue" />
      <Metric icon={AlertCircle} label="In review" value={counts.review || 0} tone="amber" />
      <Metric icon={CheckCircle2} label="Completed" value={(counts.approved || 0) + (counts.done || 0)} tone="violet" />

      <section className="wide-panel">
        <div className="section-heading">
          <h3>Status Overview</h3>
          <button className="text-action" onClick={onOpenTasks}>Open tasks</button>
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
