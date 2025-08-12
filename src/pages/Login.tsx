import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const Login: React.FC = () => {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || '/';

  const handleLogin = () => {
    login({ user: { id: '1', name: 'Admin', role: 'admin' }, token: 'demo-token' });
    navigate(from, { replace: true });
  };

  return (
    <div className="max-w-sm mx-auto mt-10 space-y-4">
      <h1 className="text-xl font-semibold text-center">Вход</h1>
      <button onClick={handleLogin} className="w-full px-3 py-2 border rounded" aria-label="Login">
        Войти как Admin (demo)
      </button>
    </div>
  );
};

export default Login;
