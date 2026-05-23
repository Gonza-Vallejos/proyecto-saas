import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Eye, EyeOff } from 'lucide-react';
import { api } from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });

      const slug = data.slug;

      if (slug) {
        localStorage.setItem(`token_${slug}`, data.access_token);
        localStorage.setItem('last_active_slug', slug);
      }

      localStorage.setItem('token', data.access_token);

      const base64Url = data.access_token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      if (payload.role === 'SUPERADMIN') {
        navigate('/admin/master');
      } else {
        navigate(`/admin/${slug}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-[90%] max-w-md rounded-2xl bg-white p-[clamp(1.5rem,5vw,3rem)] shadow-xl">
        <h2 className="mb-8 text-center text-[clamp(1.5rem,5vw,1.8rem)] font-bold text-slate-900">
          Portal Administrativo
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block font-medium text-slate-600">Correo Electrónico</label>
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Mail size={18} className="mr-2 shrink-0 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full border-none bg-transparent text-base outline-none"
                placeholder="admin@demostore.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium text-slate-600">Contraseña</label>
            <div className="relative flex items-center rounded-lg border border-slate-200 bg-slate-50 p-3">
              <KeyRound size={18} className="mr-2 shrink-0 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-none bg-transparent pr-10 text-base outline-none"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 flex cursor-pointer items-center border-none bg-transparent p-0"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <EyeOff size={18} className="text-slate-500" />
                ) : (
                  <Eye size={18} className="text-slate-500" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 cursor-pointer rounded-lg border-none bg-sky-500 px-4 py-4 text-lg font-semibold text-white transition-all hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
