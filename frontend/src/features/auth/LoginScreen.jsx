import { useState } from 'react';
import { BriefcaseBusiness, RefreshCw, ShieldCheck } from 'lucide-react';
import { InlineError } from '../../shared/components/InlineError';
import { apiRequest } from '../../shared/services/api';

export function LoginScreen({ onLogin }) {
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
      <section className="login-panel">
        <div>
          <div className="brand-mark">
            <BriefcaseBusiness size={22} />
          </div>
          <h1>ABK Internal</h1>
          <p>Operations workspace for teams, employees, and marketing tasks.</p>
        </div>

        <form className="form-stack" onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            Password
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
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
