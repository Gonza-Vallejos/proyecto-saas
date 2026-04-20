import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, User, ShieldCheck } from 'lucide-react';
import { api } from '../utils/api';
import Swal from 'sweetalert2';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/register-superadmin', { 
        name, 
        email, 
        password,
        secretKey: 'CREAR_DUEÑO_SECRETO' // Llave requerida por el backend para seguridad
      });
      
      Swal.fire({
        title: '¡Registro Exitoso!',
        text: 'Ahora puedes iniciar sesión con tus credenciales.',
        icon: 'success',
        confirmButtonText: 'Ir al Login'
      }).then(() => {
        navigate('/login');
      });
    } catch (err: any) {
      Swal.fire('Error', err.message || 'No se pudo completar el registro', 'error');
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
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '450px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            background: '#eff6ff', 
            padding: '1rem', 
            borderRadius: '50%', 
            marginBottom: '1rem' 
          }}>
            <ShieldCheck size={32} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', margin: 0 }}>Crear Super Admin</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Registra el primer administrador maestro del sistema.
          </p>
        </div>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Nombre Completo</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <User size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '1rem' }} 
                placeholder="Ej: Administrador Maestro"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Correo Electrónico</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <Mail size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '1rem' }} 
                placeholder="admin@tuempresa.com"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Contraseña</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <KeyRound size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '1rem' }} 
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '1rem',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
            }}>
            {loading ? 'Procesando...' : 'Finalizar Registro'}
          </button>

          <button 
            type="button"
            onClick={() => navigate('/login')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#64748b', 
              fontSize: '0.9rem', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Ya tengo una cuenta, ir al Login
          </button>
        </form>
      </div>
    </div>
  );
}
