import { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import './LoginForm.css';

export function LoginForm() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (token.length !== 6) {
      setError('El código debe tener 6 dígitos');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(token);
      if (!success) {
        setError('Código inválido. Por favor, inténtalo de nuevo.');
        setToken('');
      }
      // Si es exitoso, el componente se redirigirá, pero aún así establecemos isLoading en false
      // por si acaso hay algún problema con la redirección
    } catch (error) {
      console.error('[LoginForm] Error inesperado:', error);
      setError('Error de conexión. Por favor, verifica tu conexión e inténtalo de nuevo.');
      setToken('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setToken(value);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Radial Habit Tracker</h1>
        <p className="login-subtitle">Ingresa tu código de autenticación</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={token}
              onChange={handleChange}
              placeholder="000000"
              className={`token-input ${error ? 'error' : ''}`}
              maxLength={6}
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="error-message">{error}</p>}
          </div>
          <button
            type="submit"
            className="login-button"
            disabled={token.length !== 6 || isLoading}
          >
            {isLoading ? 'Validando...' : 'Ingresar'}
          </button>
        </form>
        <p className="login-hint">
          Usa el código de 6 dígitos de tu aplicación de autenticación
        </p>
      </div>
    </div>
  );
}

