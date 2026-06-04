import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { EmptyState } from '../../shared/components/EmptyState';
import { Modal } from '../../shared/components/Modal';
import { MARKETING_TEAMS, teamLabels, workTypeLabels } from '../../shared/constants/marketing';
import { TaskDetail } from './TaskDetail';
import { TaskForm } from './TaskForm';

export function TaskWorkspace({ tasks, employees, selectedTask, isManager, token, currentUser, onChanged, onSelect }) {
  const [query, setQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const filteredTasks = tasks.filter((task) => {
    if (teamFilter !== 'all' && task.team !== teamFilter) {
      return false;
    }

    const haystack = `${task.title} ${task.description} ${task.status} ${task.priority} ${task.team} ${task.work_type}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="task-layout">
      <section className="panel">
        <div className="section-heading">
          <h3>Tasks</h3>
          <button className="primary-action small" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            New task
          </button>
        </div>
        <div className="search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" />
        </div>
        <div className="team-filter-tabs" aria-label="Marketing team filter">
          <button className={teamFilter === 'all' ? 'active' : ''} onClick={() => setTeamFilter('all')} type="button">
            Tat ca
          </button>
          {MARKETING_TEAMS.map((team) => (
            <button className={teamFilter === team ? 'active' : ''} key={team} onClick={() => setTeamFilter(team)} type="button">
              {teamLabels[team]}
            </button>
          ))}
        </div>
        <div className="task-list">
          {filteredTasks.map((task) => (
            <button
              className={`task-row ${selectedTask?.id === task.id ? 'active' : ''}`}
              key={task.id}
              onClick={() => onSelect(task.id)}
            >
              <div>
                <strong>{task.title}</strong>
                <span>{task.description || 'No description'}</span>
              </div>
              <div className="row-tags">
                <Badge value={teamLabels[task.team] || task.team || 'Media'} />
                {task.work_type && <Badge value={workTypeLabels[task.work_type] || task.work_type} />}
                <Badge value={task.status} />
                <Badge value={task.priority} tone={task.priority} />
              </div>
            </button>
          ))}
          {!filteredTasks.length && <EmptyState text="No marketing tasks found." />}
        </div>
      </section>

      <section className="panel detail-panel">
        {selectedTask ? (
          <TaskDetail
            task={selectedTask}
            employees={employees}
            isManager={isManager}
            token={token}
            currentUser={currentUser}
            onChanged={onChanged}
          />
        ) : (
          <EmptyState text="Select a task to view details." />
        )}
      </section>

      {showCreate && (
        <Modal title="New Marketing Task" onClose={() => setShowCreate(false)}>
          <TaskForm
            employees={employees}
            isManager={isManager}
            token={token}
            onSaved={() => {
              setShowCreate(false);
              onChanged();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
