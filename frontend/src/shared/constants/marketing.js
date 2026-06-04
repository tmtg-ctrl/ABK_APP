export const STATUS_OPTIONS = ['todo', 'doing', 'review', 'approved', 'done'];
export const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
export const ROLE_OPTIONS = ['marketing_staff', 'marketing_manager'];
export const MARKETING_TEAMS = ['media', 'sale', 'content'];

export const WORK_TYPES_BY_TEAM = {
  media: [
    'photo_shoot',
    'photo_intake',
    'photo_edit',
    'video_edit',
    'media_archive',
    'construction_update',
    'fanpage_publish'
  ],
  sale: [
    'lead_follow_up',
    'customer_care',
    'quote_support',
    'handoff_content'
  ],
  content: [
    'post_outline',
    'post_write',
    'post_review',
    'website_article',
    'fanpage_caption'
  ]
};

export const statusLabels = {
  todo: 'Todo',
  doing: 'Doing',
  review: 'Review',
  approved: 'Approved',
  done: 'Done'
};

export const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High'
};

export const teamLabels = {
  media: 'Media',
  sale: 'Sale',
  content: 'Content'
};

export const workTypeLabels = {
  photo_shoot: 'Chup anh cong trinh',
  photo_intake: 'Tong hop anh da chup',
  photo_edit: 'Chinh anh',
  video_edit: 'Edit video',
  media_archive: 'Quan ly kho hinh anh',
  construction_update: 'Cap nhat du lieu cong trinh',
  fanpage_publish: 'Dang fanpage',
  lead_follow_up: 'Theo doi khach hang',
  customer_care: 'Cham soc khach hang',
  quote_support: 'Ho tro bao gia',
  handoff_content: 'Ban giao thong tin cho content',
  post_outline: 'Len y bai',
  post_write: 'Viet bai',
  post_review: 'Kiem noi dung',
  website_article: 'Bai website',
  fanpage_caption: 'Caption fanpage'
};
