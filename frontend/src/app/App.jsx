import { useState } from 'react';
import { LoginScreen } from '../features/auth/LoginScreen';
import { clearSession, readSession, saveSession } from '../shared/services/session-storage';
import { Workspace } from './Workspace';

export function App() {
  const [session, setSession] = useState(readSession);

  const handleLogin = (nextSession) => {
    saveSession(nextSession);
    setSession(nextSession);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  if (!session?.token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Workspace session={session} onLogout={handleLogout} />;
}
