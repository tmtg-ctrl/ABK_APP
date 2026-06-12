import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LANGUAGE_KEY = 'abk_language';
const LanguageContext = createContext(null);

const translations = {
  vi: {
    'language.label': 'Ngon ngu',
    'app.internal': 'Noi bo ABK',
    'app.workspace': 'Khong gian lam viec',
    'department.marketing': 'Phong Marketing',
    'nav.dashboard': 'Tong quan',
    'nav.campaign': 'Chien dich / Du an',
    'nav.weekly': 'Cong viec tuan',
    'nav.media': 'Kho Media',
    'nav.posts': 'Bai dang Marketing',
    'nav.construction': 'Du lieu thi cong',
    'nav.assignedTasks': 'Viec duoc giao',
    'nav.manageTasks': 'Quan ly cong viec',
    'nav.employees': 'Nhan vien',
    'nav.otherDepartments': 'Phong ban khac',
    'nav.finance': 'Tai chinh',
    'nav.training': 'Dao tao',
    'nav.projectQc': 'Kiem soat du an',
    'action.refresh': 'Lam moi',
    'action.signOut': 'Dang xuat',
    'action.showSidebar': 'Mo thanh ben',
    'action.hideSidebar': 'An thanh ben',
    'login.description': 'Khong gian dieu hanh chien dich, cong viec tuan va nhiem vu cua doi ngu.',
    'login.email': 'Email',
    'login.password': 'Mat khau',
    'login.submit': 'Dang nhap',
    'dashboard.marketingTasks': 'Cong viec Marketing',
    'dashboard.employees': 'Nhan vien',
    'dashboard.inReview': 'Dang cho duyet',
    'dashboard.completed': 'Da hoan thanh',
    'dashboard.statusOverview': 'Tong quan trang thai',
    'dashboard.openTasks': 'Cong viec dang mo',
    'common.status': 'Trang thai',
    'common.priority': 'Muc uu tien',
    'common.team': 'Nhom',
    'common.workType': 'Loai cong viec',
    'common.deadline': 'Han hoan thanh',
    'common.assignee': 'Nguoi thuc hien',
    'common.unassigned': 'Chua giao',
    'common.noDeadline': 'Chua co han',
    'common.checklist': 'Danh sach kiem tra',
    'common.taskDetail': 'Chi tiet cong viec',
    'common.overview': 'Tong quan',
    'common.board': 'Bang viec',
    'common.timeline': 'Tien do',
    'common.portfolio': 'Danh sach chien dich',
    'common.owner': 'Nguoi phu trach',
    'common.sponsor': 'Nguoi bao tro',
    'common.milestone': 'Cot moc',
    'common.projectBrief': 'Tom tat du an',
    'common.projectStructure': 'Cau truc du an',
    'common.live': 'Dang hoat dong',
    'task.management': 'Quan ly cong viec',
    'task.myWork': 'Cong viec cua toi',
    'weekly.eyebrow': 'Ke hoach cong viec tuan',
    'campaign.eyebrow': 'Danh muc Marketing',
    'campaign.approvalQueue': 'Hang cho duyet',
    'campaign.attention': 'Can chu y',
    'campaign.worklist': 'Danh sach chien dich',
    'employee.adminOnly': 'Chi danh cho Admin'
  },
  en: {
    'language.label': 'Language',
    'app.internal': 'ABK Internal',
    'app.workspace': 'Workspace',
    'department.marketing': 'Marketing Department',
    'nav.dashboard': 'Dashboard',
    'nav.campaign': 'Campaign / Project',
    'nav.weekly': 'Weekly Work',
    'nav.media': 'Media Workspace',
    'nav.posts': 'Marketing Posts',
    'nav.construction': 'Construction Data',
    'nav.assignedTasks': 'Assigned Tasks',
    'nav.manageTasks': 'Manage Tasks',
    'nav.employees': 'Employees',
    'nav.otherDepartments': 'Other Departments',
    'nav.finance': 'Finance',
    'nav.training': 'Training',
    'nav.projectQc': 'Project QC',
    'action.refresh': 'Refresh',
    'action.signOut': 'Sign out',
    'action.showSidebar': 'Show sidebar',
    'action.hideSidebar': 'Hide sidebar',
    'login.description': 'A shared workspace for campaigns, weekly planning, and team tasks.',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'dashboard.marketingTasks': 'Marketing tasks',
    'dashboard.employees': 'Employees',
    'dashboard.inReview': 'In review',
    'dashboard.completed': 'Completed',
    'dashboard.statusOverview': 'Status overview',
    'dashboard.openTasks': 'Open tasks',
    'common.status': 'Status',
    'common.priority': 'Priority',
    'common.team': 'Team',
    'common.workType': 'Work type',
    'common.deadline': 'Deadline',
    'common.assignee': 'Assignee',
    'common.unassigned': 'Unassigned',
    'common.noDeadline': 'No deadline',
    'common.checklist': 'Checklist',
    'common.taskDetail': 'Task detail',
    'common.overview': 'Overview',
    'common.board': 'Board',
    'common.timeline': 'Timeline',
    'common.portfolio': 'Portfolio',
    'common.owner': 'Owner',
    'common.sponsor': 'Sponsor',
    'common.milestone': 'Milestone',
    'common.projectBrief': 'Project brief',
    'common.projectStructure': 'Project structure',
    'common.live': 'Live',
    'task.management': 'Task management',
    'task.myWork': 'My work',
    'weekly.eyebrow': 'Weekly planning',
    'campaign.eyebrow': 'Marketing portfolio',
    'campaign.approvalQueue': 'Approval queue',
    'campaign.attention': 'Attention',
    'campaign.worklist': 'Campaign worklist',
    'employee.adminOnly': 'Admin only'
  }
};

function readLanguage() {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  return saved === 'en' ? 'en' : 'vi';
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(readLanguage);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key) => translations[language][key] ?? translations.vi[key] ?? key
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
