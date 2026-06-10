import { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardList,
  FileText,
  FolderKanban,
  Image,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Users
} from 'lucide-react';
import { ConstructionData } from '../features/construction-data/ConstructionData';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Employees } from '../features/employees/Employees';
import { MarketingPosts } from '../features/marketing-posts/MarketingPosts';
import { CampaignModule } from '../features/campaign-projects/CampaignModule';
import { TaskWorkspace } from '../features/marketing-tasks/TaskWorkspace';
import { MediaWorkspace } from '../features/media-workspace/MediaWorkspace';
import { InlineError } from '../shared/components/InlineError';
import { NavButton } from '../shared/components/NavButton';
import { apiRequest } from '../shared/services/api';

export function Workspace({ session, onLogout }) {
  const [view, setView] = useState(
    () => new URLSearchParams(window.location.search).get('view') || 'marketing-dashboard'
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || tasks[0] || null,
    [selectedTaskId, tasks]
  );

  const isManager = ['admin', 'marketing_manager', 'department_manager'].includes(session.user?.role);
  const isMarketingUser = session.user?.department === 'marketing' || session.user?.role === 'admin';

  const viewTitles = {
    'marketing-dashboard': 'Dashboard',
    'marketing-campaign-demo': 'Campaign / Project',
    'marketing-media': 'Media Workspace',
    'marketing-posts': 'Quan ly bai dang',
    'marketing-construction': 'Du lieu cong trinh',
    'marketing-assigned-tasks': 'Task duoc giao',
    'marketing-tasks': 'Quan ly task',
    employees: 'Employees'
  };

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [taskData, employeeData] = await Promise.all([
        apiRequest('/api/marketing/tasks', { token: session.token }),
        isManager
          ? apiRequest('/controller/user/employees?department=marketing', { token: session.token })
          : Promise.resolve({ employees: [] })
      ]);

      setTasks(taskData.tasks || []);
      setEmployees(employeeData.employees || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark compact">
            <BriefcaseBusiness size={20} />
          </div>
          <div className="sidebar-text">
            <strong>ABK</strong>
            <span>Internal</span>
          </div>
        </div>

        <button
          className="sidebar-edge-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>

        <nav className="nav-list">
          {isMarketingUser && (
            <div className="department-nav">
              <button className="department-toggle">
                <span>Marketing</span>
                <ChevronDown size={16} />
              </button>
              <div className="department-links">
                <NavButton
                  icon={LayoutDashboard}
                  active={view === 'marketing-dashboard'}
                  onClick={() => setView('marketing-dashboard')}
                  collapsed={sidebarCollapsed}
                >
                  Dashboard
                </NavButton>
                <NavButton
                  icon={FolderKanban}
                  active={view === 'marketing-campaign-demo'}
                  onClick={() => setView('marketing-campaign-demo')}
                  collapsed={sidebarCollapsed}
                >
                  Campaign / Project
                </NavButton>
                <NavButton
                  icon={Image}
                  active={view === 'marketing-media'}
                  onClick={() => setView('marketing-media')}
                  collapsed={sidebarCollapsed}
                >
                  Media workspace
                </NavButton>
                <NavButton
                  icon={FileText}
                  active={view === 'marketing-posts'}
                  onClick={() => setView('marketing-posts')}
                  collapsed={sidebarCollapsed}
                >
                  Quan ly bai dang
                </NavButton>
                <NavButton
                  icon={Building2}
                  active={view === 'marketing-construction'}
                  onClick={() => setView('marketing-construction')}
                  collapsed={sidebarCollapsed}
                >
                  Du lieu cong trinh
                </NavButton>
                <NavButton
                  icon={ClipboardList}
                  active={view === 'marketing-assigned-tasks'}
                  onClick={() => setView('marketing-assigned-tasks')}
                  collapsed={sidebarCollapsed}
                >
                  Task duoc giao
                </NavButton>
                {isManager && (
                  <NavButton
                    icon={CalendarDays}
                    active={view === 'marketing-tasks'}
                    onClick={() => setView('marketing-tasks')}
                    collapsed={sidebarCollapsed}
                  >
                    Quan ly task
                  </NavButton>
                )}
                {isManager && (
                  <NavButton icon={Users} active={view === 'employees'} onClick={() => setView('employees')} collapsed={sidebarCollapsed}>
                    Nhan vien
                  </NavButton>
                )}
              </div>
            </div>
          )}
          <div className="department-nav muted">
            <button className="department-toggle">
              <span>Phong ban khac</span>
              <ChevronDown size={16} />
            </button>
            <div className="department-links">
              <button className="nav-button disabled">Tai chinh</button>
              <button className="nav-button disabled">Dao tao</button>
              <button className="nav-button disabled">Du an / QC</button>
            </div>
          </div>
        </nav>

        <div className="session-box">
          <div className="avatar">{session.user?.email?.slice(0, 1).toUpperCase()}</div>
          <div className="sidebar-text">
            <strong>{session.user?.email}</strong>
            <span>{session.user?.role}</span>
          </div>
          <button className="icon-button" onClick={onLogout} title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Marketing Department</span>
            <h2>{viewTitles[view] || 'Workspace'}</h2>
          </div>
          <button className="secondary-action" onClick={loadData} disabled={loading}>
            <RefreshCw className={loading ? 'spin' : ''} size={17} />
            Refresh
          </button>
        </header>

        {error && <InlineError message={error} />}

        {view === 'marketing-dashboard' && (
          <Dashboard tasks={tasks} employees={employees} isManager={isManager} onOpenTasks={() => setView('marketing-assigned-tasks')} />
        )}
        {view === 'marketing-campaign-demo' && (
          <CampaignModule
            token={session.token}
            currentUser={session.user}
            isManager={isManager}
            onWorkspaceChanged={loadData}
          />
        )}
        {view === 'marketing-media' && (
          <MediaWorkspace token={session.token} />
        )}
        {view === 'marketing-posts' && (
          <MarketingPosts
            token={session.token}
            employees={employees}
            isManager={isManager}
            currentUser={session.user}
          />
        )}
        {view === 'marketing-construction' && (
          <ConstructionData token={session.token} />
        )}
        {(view === 'marketing-assigned-tasks' || view === 'marketing-tasks') && (
          <TaskWorkspace
            tasks={tasks}
            employees={employees}
            selectedTask={selectedTask}
            isManager={isManager}
            token={session.token}
            currentUser={session.user}
            onChanged={loadData}
            onSelect={setSelectedTaskId}
          />
        )}
        {view === 'employees' && isManager && (
          <Employees employees={employees} token={session.token} onCreated={loadData} />
        )}
      </section>
    </main>
  );
}
