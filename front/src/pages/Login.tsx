import { useState, useEffect } from 'react';
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

  const handleGoogleLogin = async (response: any) => {
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/auth/google', { token: response.credential });

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
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      const google = (window as any).google;
      if (google) {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
        });

        // Calcular dinámicamente el ancho adecuado según la pantalla del dispositivo
        const screenWidth = window.innerWidth;
        // En móviles restamos padding, en pantallas mayores limitamos a 350px para una estética perfecta
        const buttonWidth = screenWidth < 450 ? Math.max(screenWidth - 80, 240) : 350;

        google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: buttonWidth.toString(),
            text: 'signin_with',
            shape: 'pill', // Redondeado premium
          }
        );
      }
    };

    const interval = setInterval(() => {
      const google = (window as any).google;
      if (google) {
        initGoogle();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

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
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 overflow-hidden px-4">
      {/* Círculos fluidos decorativos en background para un acabado súper premium */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-sky-400/20 to-indigo-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-violet-400/10 to-sky-400/20 blur-3xl pointer-events-none"></div>
      
      {/* Tarjeta con Glassmorphism y bordes suaves */}
      <div className="relative w-[100%] max-w-[430px] rounded-[28px] bg-white/70 backdrop-blur-md p-8 md:p-10 shadow-[0_20px_50px_rgba(8,112,184,0.06)] border border-white/60">
        
        {/* Cabecera de la tarjeta */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 text-white shadow-md shadow-sky-500/25 mb-4">
            <KeyRound size={22} className="animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 leading-none">
            Portal Administrativo
          </h2>
          <p className="mt-2.5 text-sm text-slate-500 font-medium">
            Ingresa a tu panel de gestión
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-100 bg-red-50/70 p-4 text-sm text-red-500 font-medium backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Correo Electrónico</label>
            <div className="flex items-center rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 transition-all duration-300 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100/50">
              <Mail size={18} className="mr-3 shrink-0 text-slate-400 transition-colors duration-200" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full border-none bg-transparent text-base text-slate-800 placeholder-slate-400 outline-none"
                placeholder="admin@demostore.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</label>
            <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 transition-all duration-300 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100/50">
              <KeyRound size={18} className="mr-3 shrink-0 text-slate-400 transition-colors duration-200" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-none bg-transparent pr-10 text-base text-slate-800 placeholder-slate-400 outline-none"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 flex cursor-pointer items-center border-none bg-transparent p-0 transition-transform active:scale-95"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <EyeOff size={18} className="text-slate-400 hover:text-slate-600 transition-colors" />
                ) : (
                  <Eye size={18} className="text-slate-400 hover:text-slate-600 transition-colors" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 cursor-pointer rounded-2xl border-none bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 px-4 py-4 text-base font-bold text-white transition-all duration-300 hover:from-sky-600 hover:to-blue-700 shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center min-h-[52px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="relative my-7 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/80"></div>
          </div>
          <span className="relative bg-white/70 backdrop-blur-md px-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            o continúa con
          </span>
        </div>

        {/* Contenedor del botón de Google perfectamente centrado */}
        <div className="flex w-full justify-center">
          <div 
            id="google-signin-button" 
            className="flex w-full justify-center min-h-[44px] transition-all duration-300 hover:scale-[1.01]"
          ></div>
        </div>
      </div>
    </div>
  );
}
