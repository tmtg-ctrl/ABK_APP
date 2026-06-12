export const TASK_BUCKETS = {
  pending: ['backlog', 'todo'],
  active: ['doing', 'blocked', 'revision'],
  review: ['review'],
  completed: ['approved', 'done']
};

export const TASK_BUCKET_LABELS = {
  pending: 'Chua lam',
  active: 'Dang xu ly',
  review: 'Cho duyet',
  completed: 'Da xong'
};

export const getTaskBucket = (status) => (
  Object.entries(TASK_BUCKETS).find(([, statuses]) => statuses.includes(status))?.[0] || 'pending'
);

export const isTaskCompleted = (task) => TASK_BUCKETS.completed.includes(task.status);

export const getChecklistProgress = (task) => {
  const checklist = Array.isArray(task.checklist) ? task.checklist : [];
  const completed = checklist.filter((item) => item.done).length;
  return {
    completed,
    total: checklist.length,
    percent: checklist.length ? Math.round((completed / checklist.length) * 100) : 0
  };
};

export const getTaskDueState = (task, today = new Date().toISOString().slice(0, 10)) => {
  const dueDate = task.deadline || task.end;
  if (!dueDate || isTaskCompleted(task)) return 'normal';
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  return 'normal';
};
