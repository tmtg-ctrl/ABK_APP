import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { EmptyState } from '../../shared/components/EmptyState';
import { Modal } from '../../shared/components/Modal';
import { TaskDetail } from './TaskDetail';
import { TaskForm } from './TaskForm';

export function TaskWorkspace({ tasks, employees, selectedTask, isManager, token, currentUser, onChanged, onSelect }) {
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filteredTasks = tasks.filter((task) => {
    const haystack = `${task.title} ${task.description} ${task.status} ${task.priority}`.toLowerCase();
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
