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
        secretKey: 'CREAR_DUEÑO_SECRETO',
      });

      Swal.fire({
        title: '¡Registro Exitoso!',
        text: 'Ahora puedes iniciar sesión con tus credenciales.',
        icon: 'success',
        confirmButtonText: 'Ir al Login',
      }).then(() => {
        navigate('/login');
      });
    } catch (err: unknown) {
      Swal.fire(
        'Error',
        err instanceof Error ? err.message : 'No se pudo completar el registro',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  const inputWrapperClass =
    'flex items-center rounded-lg border border-slate-200 bg-slate-50 p-3';
  const inputClass = 'w-full border-none bg-transparent text-base outline-none';
  const labelClass = 'mb-2 block font-medium text-slate-600';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-[450px] rounded-2xl bg-white p-12 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-full bg-blue-50 p-4">
            <ShieldCheck size={32} className="text-blue-500" />
          </div>
          <h2 className="m-0 text-3xl font-bold text-slate-900">Crear Super Admin</h2>
          <p className="mt-2 text-sm text-slate-500">
            Registra el primer administrador maestro del sistema.
          </p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Nombre Completo</label>
            <div className={inputWrapperClass}>
              <User size={18} className="mr-2 shrink-0 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Ej: Administrador Maestro"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Correo Electrónico</label>
            <div className={inputWrapperClass}>
              <Mail size={18} className="mr-2 shrink-0 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="admin@tuempresa.com"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Contraseña</label>
            <div className={inputWrapperClass}>
              <KeyRound size={18} className="mr-2 shrink-0 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 cursor-pointer rounded-lg border-none bg-blue-500 px-4 py-4 text-lg font-semibold text-white shadow-md shadow-blue-500/50 transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Procesando...' : 'Finalizar Registro'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="cursor-pointer border-none bg-transparent text-sm text-slate-500 underline"
          >
            Ya tengo una cuenta, ir al Login
          </button>
        </form>
      </div>
    </div>
  );
}
