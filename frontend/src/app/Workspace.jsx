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
import { WeeklyPlanningModule } from '../features/weekly-planning/WeeklyPlanningModule';
import { TaskWorkspace } from '../features/marketing-tasks/TaskWorkspace';
import { MediaWorkspace } from '../features/media-workspace/MediaWorkspace';
import { InlineError } from '../shared/components/InlineError';
import { LanguageSwitcher } from '../shared/components/LanguageSwitcher';
import { NavButton } from '../shared/components/NavButton';
import { useLanguage } from '../shared/i18n/LanguageContext';
import { apiRequest } from '../shared/services/api';

export function Workspace({ session, onLogout }) {
  const { t } = useLanguage();
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
  const isAdmin = session.user?.role === 'admin';
  const isMarketingUser = session.user?.department === 'marketing' || session.user?.role === 'admin';

  const viewTitles = {
    'marketing-dashboard': t('nav.dashboard'),
    'marketing-campaign-demo': t('nav.campaign'),
    'marketing-weekly-planning': t('nav.weekly'),
    'marketing-media': t('nav.media'),
    'marketing-posts': t('nav.posts'),
    'marketing-construction': t('nav.construction'),
    'marketing-assigned-tasks': t('nav.assignedTasks'),
    'marketing-tasks': t('nav.manageTasks'),
    employees: t('nav.employees')
  };

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [taskData, employeeData] = await Promise.all([
        apiRequest('/api/marketing/tasks', { token: session.token }),
        apiRequest('/controller/user/directory', { token: session.token })
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
            <span>{t('app.internal')}</span>
          </div>
        </div>

        <button
          className="sidebar-edge-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? t('action.showSidebar') : t('action.hideSidebar')}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>

        <nav className="nav-list">
          {isMarketingUser && (
            <div className="department-nav">
              <button className="department-toggle">
                <span>{t('department.marketing')}</span>
                <ChevronDown size={16} />
              </button>
              <div className="department-links">
                <NavButton
                  icon={LayoutDashboard}
                  active={view === 'marketing-dashboard'}
                  onClick={() => setView('marketing-dashboard')}
                  collapsed={sidebarCollapsed}
                >
                  {t('nav.dashboard')}
                </NavButton>
                <NavButton
                  icon={FolderKanban}
                  active={view === 'marketing-campaign-demo'}
                  onClick={() => setView('marketing-campaign-demo')}
                  collapsed={sidebarCollapsed}
                >
                  {t('nav.campaign')}
                </NavButton>
                <NavButton
                  icon={CalendarDays}
                  active={view === 'marketing-weekly-planning'}
                  onClick={() => setView('marketing-weekly-planning')}
                  collapsed={sidebarCollapsed}
                >
                  {t('nav.weekly')}
                </NavButton>
                <NavButton
                  icon={Image}
                  active={view === 'marketing-media'}
                  onClick={() => setView('marketing-media')}
                  collapsed={sidebarCollapsed}
                >
                  {t('nav.media')}
                </NavButton>
                <NavButton
                  icon={FileText}
                  active={view === 'marketing-posts'}
                  onClick={() => setView('marketing-posts')}
                  collapsed={sidebarCollapsed}
                >
                  {t('nav.posts')}
                </NavButton>
                <NavButton
                  icon={Building2}
                  active={view === 'marketing-construction'}
                  onClick={() => setView('marketing-construction')}
                  collapsed={sidebarCollapsed}
                >
                  {t('nav.construction')}
                </NavButton>
                <NavButton
                  icon={ClipboardList}
                  active={view === 'marketing-assigned-tasks'}
                  onClick={() => setView('marketing-assigned-tasks')}
                  collapsed={sidebarCollapsed}
                >
                  {t('nav.assignedTasks')}
                </NavButton>
                {isManager && (
                  <NavButton
                    icon={CalendarDays}
                    active={view === 'marketing-tasks'}
                    onClick={() => setView('marketing-tasks')}
                    collapsed={sidebarCollapsed}
                  >
                    {t('nav.manageTasks')}
                  </NavButton>
                )}
                {isAdmin && (
                  <NavButton icon={Users} active={view === 'employees'} onClick={() => setView('employees')} collapsed={sidebarCollapsed}>
                    {t('nav.employees')}
                  </NavButton>
                )}
              </div>
            </div>
          )}
          <div className="department-nav muted">
            <button className="department-toggle">
              <span>{t('nav.otherDepartments')}</span>
              <ChevronDown size={16} />
            </button>
            <div className="department-links">
              <button className="nav-button disabled">{t('nav.finance')}</button>
              <button className="nav-button disabled">{t('nav.training')}</button>
              <button className="nav-button disabled">{t('nav.projectQc')}</button>
            </div>
          </div>
        </nav>

        <div className="session-box">
          <div className="avatar">{session.user?.email?.slice(0, 1).toUpperCase()}</div>
          <div className="sidebar-text">
            <strong>{session.user?.email}</strong>
            <span>{session.user?.role}</span>
          </div>
          <button className="icon-button" onClick={onLogout} title={t('action.signOut')}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">{t('department.marketing')}</span>
            <h2>{viewTitles[view] || t('app.workspace')}</h2>
          </div>
          <div className="topbar-actions">
            <LanguageSwitcher />
            <button className="secondary-action" onClick={loadData} disabled={loading}>
              <RefreshCw className={loading ? 'spin' : ''} size={17} />
              {t('action.refresh')}
            </button>
          </div>
        </header>

        {error && <InlineError message={error} />}

        {view === 'marketing-dashboard' && (
          <Dashboard tasks={tasks} employees={employees} isManager={isManager} onOpenTasks={() => setView('marketing-assigned-tasks')} />
        )}
        {view === 'marketing-campaign-demo' && (
          <CampaignModule
            token={session.token}
            isManager={isManager}
            currentUser={session.user}
            employees={employees}
            onWorkspaceChanged={loadData}
          />
        )}
        {view === 'marketing-weekly-planning' && (
          <WeeklyPlanningModule
            token={session.token}
            currentUser={session.user}
            isManager={isManager}
            employees={employees}
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
            mode={view === 'marketing-tasks' ? 'manage' : 'assigned'}
            onChanged={loadData}
            onSelect={setSelectedTaskId}
          />
        )}
        {view === 'employees' && isAdmin && (
          <Employees employees={employees} token={session.token} onChanged={loadData} />
        )}
      </section>
    </main>
  );
}
