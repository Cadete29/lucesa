import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import './Auth.css';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  const { resetPassword, verifyResetToken } = useAuth();
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        const result = await verifyResetToken(token);
        setTokenValid(result.valid);
        if (!result.valid) {
          setError('El enlace de recuperación es inválido o ha expirado');
        }
      }
    };

    verifyToken();
  }, [token, verifyResetToken]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    const result = await resetPassword(token, formData.password);
    
    if (result.success) {
      setMessage('Tu contraseña ha sido restablecida correctamente');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (tokenValid === false) {
    return (
      <main className="auth-main">
        <section className="auth-section">
          <div className="container">
            <div className="auth-card-compact">
              <div className="auth-header">
                <div className="auth-icon">❌</div>
                <h2 className="auth-title">Enlace Inválido</h2>
                <p className="auth-subtitle">El enlace de recuperación no es válido</p>
              </div>

              <div className="auth-error-compact">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>

              <div className="auth-footer">
                <p>
                  <Link to="/forgot-password" className="auth-link">
                    Solicitar nuevo enlace
                  </Link>
                </p>
                <p>
                  <Link to="/login" className="auth-link">
                    Volver al inicio de sesión
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-main">
      <section className="auth-section">
        <div className="container">
          <div className="auth-card-compact">
            <div className="auth-header">
              <div className="auth-icon">🔑</div>
              <h2 className="auth-title">Nueva Contraseña</h2>
              <p className="auth-subtitle">Crea una nueva contraseña para tu cuenta</p>
            </div>

            {error && (
              <div className="auth-error-compact">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="auth-success-compact">
                <span className="success-icon">✅</span>
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Nueva contraseña"
                  className="auth-input"
                  disabled={loading}
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirmar nueva contraseña"
                  className="auth-input"
                  disabled={loading}
                  minLength="6"
                />
              </div>

              <button 
                type="submit" 
                className="btn-auth-primary"
                disabled={loading || tokenValid === false}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Restableciendo...
                  </>
                ) : (
                  'Restablecer Contraseña'
                )}
              </button>
            </form>

            <div className="password-requirements">
              <p className="requirements-title">La contraseña debe tener:</p>
              <ul className="requirements-list">
                <li>Mínimo 6 caracteres</li>
                <li>Letras y números</li>
              </ul>
            </div>

            <div className="auth-footer">
              <p>
                <Link to="/login" className="auth-link">
                  ← Volver al inicio de sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;