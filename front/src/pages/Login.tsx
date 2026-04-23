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
      
      // Guardamos el token (con clave específica para permitir multi-tienda)
      if (slug) {
        localStorage.setItem(`token_${slug}`, data.access_token);
        // También guardamos el último slug activo para redirecciones rápidas si hace falta
        localStorage.setItem('last_active_slug', slug);
      }
      
      // Fallback para procesos que aún usen 'token' a secas
      localStorage.setItem('token', data.access_token);
      
      // Decodificar token para saber el rol (JWT payload es base64)
      const base64Url = data.access_token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      if (payload.role === 'WAITER') {
        navigate('/waiter');
      } else if (payload.role === 'KITCHEN') {
        navigate(`/admin/${slug}/kitchen`);
      } else if (payload.role === 'SUPERADMIN') {
        navigate('/admin/master');
      } else {
        navigate(`/admin/${slug}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
    }}>
      <div style={{
        background: 'white',
        padding: 'clamp(1.5rem, 5vw, 3rem)',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        width: '90%',
        maxWidth: '400px',
      }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 5vw, 1.8rem)', marginBottom: '2rem', color: '#0f172a' }}>
          Portal Administrativo
        </h2>
        
        {error && (
          <div style={{ 
            background: '#fef2f2', 
            color: '#ef4444', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            fontSize: '0.9rem',
            border: '1px solid #fee2e2'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Correo Electrónico</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <Mail size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '1rem' }} 
                placeholder="admin@demostore.com"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Contraseña</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', position: 'relative' }}>
              <KeyRound size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '1rem', paddingRight: '2.5rem' }} 
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', right: '0.75rem', background: 'none', border: 'none', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 
                }}
              >
                {showPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '1rem',
              background: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '1rem',
              transition: 'all 0.2s'
            }}>
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
