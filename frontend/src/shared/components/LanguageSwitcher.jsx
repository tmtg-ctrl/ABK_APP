import { Languages } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className={`language-switcher${compact ? ' language-switcher--compact' : ''}`}
      aria-label={t('language.label')}
      title={t('language.label')}
    >
      <Languages size={16} aria-hidden="true" />
      <button
        type="button"
        className={language === 'vi' ? 'is-active' : ''}
        onClick={() => setLanguage('vi')}
        aria-pressed={language === 'vi'}
      >
        VI
      </button>
      <button
        type="button"
        className={language === 'en' ? 'is-active' : ''}
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
      >
        EN
      </button>
    </div>
  );
}
