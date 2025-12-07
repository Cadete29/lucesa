import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  const [token, setToken] = useState('');

  const { resetPassword, verifyResetToken } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  useEffect(() => {
    console.log('🔍 ResetPassword component mounted');
    console.log('📍 Params:', params);
    console.log('📍 Location:', location);
    console.log('🔐 Token from params:', params.token);
    console.log('🔐 URL completa:', window.location.href);

    // Obtener el token de múltiples fuentes posibles
    let extractedToken = '';

    // 1. Intentar obtener de los parámetros de la ruta
    if (params.token) {
      extractedToken = params.token;
      console.log('✅ Token obtenido de params:', extractedToken);
    }
    // 2. Intentar obtener de la query string
    else {
      const queryParams = new URLSearchParams(location.search);
      extractedToken = queryParams.get('token');
      console.log('✅ Token obtenido de query string:', extractedToken);
    }

    // 3. Si no hay token en params ni query, intentar extraer de la URL
    if (!extractedToken) {
      const pathParts = location.pathname.split('/');
      const tokenFromPath = pathParts[pathParts.length - 1];
      if (tokenFromPath && tokenFromPath !== 'reset-password') {
        extractedToken = tokenFromPath;
        console.log('✅ Token obtenido de path:', extractedToken);
      }
    }

    setToken(extractedToken);

    if (extractedToken) {
      verifyToken(extractedToken);
    } else {
      setTokenValid(false);
      setError('No se encontró el token de recuperación en la URL');
    }
  }, [params, location]);

  const verifyToken = async (tokenToVerify) => {
    console.log('🔐 Verificando token:', tokenToVerify);
    const result = await verifyResetToken(tokenToVerify);
    console.log('✅ Resultado de verificación:', result);
    
    setTokenValid(result.valid);
    if (!result.valid) {
      setError(result.message || 'El enlace de recuperación es inválido o ha expirado');
    }
  };

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

    if (!token) {
      setError('Token no disponible');
      setLoading(false);
      return;
    }

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

    console.log('🔄 Enviando solicitud de reset con token:', token);

    const result = await resetPassword(token, formData.password);
    
    console.log('📨 Respuesta del reset:', result);
    
    if (result.success) {
      setMessage('✅ Tu contraseña ha sido restablecida correctamente. Redirigiendo al login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setError(result.error || 'Error al restablecer la contraseña');
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

              <div className="debug-info" style={{marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px'}}>
                <p><strong>🔍 Información para debugging:</strong></p>
                <p><strong>Token recibido:</strong> {token || 'No disponible'}</p>
                <p><strong>URL actual:</strong> {window.location.href}</p>
              </div>

              <div className="auth-footer" style={{marginTop: '20px'}}>
                <p>
                  <Link to="/forgot-password" className="auth-link">
                    🔄 Solicitar nuevo enlace
                  </Link>
                </p>
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
                <div>
                  <p>{message}</p>
                  {token && (
                    <div className="debug-info" style={{marginTop: '10px', padding: '10px', background: '#d1fae5', borderRadius: '6px'}}>
                      <p><strong>Token en uso:</strong> {token.substring(0, 20)}...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Ingresa tu nueva contraseña"
                  className="auth-input"
                  disabled={loading}
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirma tu nueva contraseña"
                  className="auth-input"
                  disabled={loading}
                  minLength="6"
                />
              </div>

              <button 
                type="submit" 
                className="btn-auth-primary"
                disabled={loading || tokenValid === false || !token}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Restableciendo...
                  </>
                ) : (
                  '🔄 Restablecer Contraseña'
                )}
              </button>
            </form>

            <div className="password-requirements">
              <p className="requirements-title">🔒 La contraseña debe tener:</p>
              <ul className="requirements-list">
                <li>✅ Mínimo 6 caracteres</li>
                <li>✅ Letras y números (recomendado)</li>
                <li>✅ Diferente a tu contraseña anterior</li>
              </ul>
            </div>

            {/* {token && (
              <div className="debug-info" style={{marginTop: '15px', padding: '12px', background: '#f3f4f6', borderRadius: '6px', fontSize: '12px'}}>
                <p><strong>Token detectado:</strong> {token.substring(0, 25)}...</p>
                <p><strong>Estado:</strong> {tokenValid === null ? 'Verificando...' : tokenValid ? '✅ Válido' : '❌ Inválido'}</p>
              </div>
            )} */}

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