import { useState } from 'react';
import { BriefcaseBusiness, RefreshCw, ShieldCheck } from 'lucide-react';
import { InlineError } from '../../shared/components/InlineError';
import { LanguageSwitcher } from '../../shared/components/LanguageSwitcher';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import { apiRequest } from '../../shared/services/api';

export function LoginScreen({ onLogin }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    email: 'test@example.com',
    password: '123456'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/controller/user/login', {
        method: 'POST',
        body: form
      });

      onLogin({
        token: data.session.access_token,
        user: data.user
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-language">
        <LanguageSwitcher />
      </div>
      <section className="login-panel">
        <div>
          <div className="brand-mark">
            <BriefcaseBusiness size={22} />
          </div>
          <h1>{t('app.internal')}</h1>
          <p>{t('login.description')}</p>
        </div>

        <form className="form-stack" onSubmit={submit}>
          <label>
            {t('login.email')}
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            {t('login.password')}
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          {error && <InlineError message={error} />}
          <button className="primary-action" disabled={loading}>
            {loading ? <RefreshCw className="spin" size={18} /> : <ShieldCheck size={18} />}
            {t('login.submit')}
          </button>
        </form>
      </section>
    </main>
  );
}
