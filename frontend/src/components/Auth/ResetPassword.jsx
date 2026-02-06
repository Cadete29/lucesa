import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

/**
 * RESET PASSWORD COMPONENT
 * 
 * Componente para restablecer la contraseña de usuario mediante un token de recuperación.
 * Permite a los usuarios establecer una nueva contraseña después de solicitar recuperación.
 * 
 * Características principales:
 * - Verificación de token de recuperación desde múltiples fuentes
 * - Validación en tiempo real de coincidencia de contraseñas
 * - Feedback visual claro para el usuario
 * - Manejo robusto de errores y estados de carga
 * - Información de debug para troubleshooting
 * - Redirección automática al login después del éxito
 * 
 * @component
 * @example
 * // Uso en rutas de React Router
 * <Route path="/reset-password/:token?" element={<ResetPassword />} />
 */

/**
 * Componente ResetPassword - Restablecimiento de contraseña
 * 
 * Este componente maneja:
 * 1. Extracción y verificación del token de recuperación desde múltiples fuentes
 * 2. Validación de contraseña (longitud, coincidencia)
 * 3. Envío de la nueva contraseña al servidor
 * 4. Manejo de estados de carga, error y éxito
 * 5. Redirección tras restablecimiento exitoso
 * 
 * @returns {JSX.Element} Componente de restablecimiento de contraseña
 */
const ResetPassword = () => {
  // ==========================================================================
  // ESTADOS DEL COMPONENTE
  // ==========================================================================
  
  /**
   * @state {Object} formData - Datos del formulario de restablecimiento
   * @property {string} password - Nueva contraseña
   * @property {string} confirmPassword - Confirmación de la nueva contraseña
   */
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  /**
   * @state {string} error - Mensaje de error a mostrar al usuario
   */
  const [error, setError] = useState('');
  
  /**
   * @state {string} message - Mensaje de éxito o información
   */
  const [message, setMessage] = useState('');
  
  /**
   * @state {boolean} loading - Estado de carga durante operaciones asíncronas
   */
  const [loading, setLoading] = useState(false);
  
  /**
   * @state {boolean|null} tokenValid - Estado de validez del token (null = verificando)
   */
  const [tokenValid, setTokenValid] = useState(null);
  
  /**
   * @state {string} token - Token de recuperación extraído de la URL
   */
  const [token, setToken] = useState('');

  // ==========================================================================
  // HOOKS DE ROUTER Y CONTEXT
  // ==========================================================================
  
  /**
   * Contexto de autenticación para operaciones de restablecimiento
   * @const {Object} authContext - Funciones del contexto de auth
   * @const {function} resetPassword - Función para restablecer contraseña
   * @const {function} verifyResetToken - Función para verificar token
   */
  const { resetPassword, verifyResetToken } = useAuth();
  
  /**
   * Hook para navegación programática
   * @const {function} navigate - Función de navegación de React Router
   */
  const navigate = useNavigate();
  
  /**
   * Hook para obtener parámetros de la ruta
   * @const {Object} params - Parámetros de la ruta actual
   */
  const params = useParams();
  
  /**
   * Hook para obtener información de ubicación
   * @const {Object} location - Objeto de ubicación actual
   */
  const location = useLocation();

  // ==========================================================================
  // EFECTO: EXTRACCIÓN Y VERIFICACIÓN DEL TOKEN
  // ==========================================================================
  
  /**
   * Efecto para extraer el token de recuperación de múltiples fuentes
   * y verificar su validez con el backend
   * 
   * @effect
   * @dependencies [params, location] - Se ejecuta al cambiar parámetros o ubicación
   */
  useEffect(() => {
    console.log('🔍 ResetPassword component mounted');
    console.log('📍 Params:', params);
    console.log('📍 Location:', location);
    console.log('🔐 Token from params:', params.token);
    console.log('🔐 URL completa:', window.location.href);

    // Estrategia multi-fuente para extraer el token
    let extractedToken = '';

    // 1. Intentar obtener de los parámetros de la ruta (ej: /reset-password/:token)
    if (params.token) {
      extractedToken = params.token;
      console.log('✅ Token obtenido de params:', extractedToken);
    }
    // 2. Intentar obtener de la query string (ej: /reset-password?token=...)
    else {
      const queryParams = new URLSearchParams(location.search);
      extractedToken = queryParams.get('token');
      console.log('✅ Token obtenido de query string:', extractedToken);
    }

    // 3. Fallback: extraer de la última parte del path
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

  // ==========================================================================
  // FUNCIONES DE MANEJO
  // ==========================================================================
  
  /**
   * Verifica la validez del token con el backend
   * 
   * @async
   * @function verifyToken
   * @param {string} tokenToVerify - Token a verificar
   */
  const verifyToken = async (tokenToVerify) => {
    console.log('🔐 Verificando token:', tokenToVerify);
    const result = await verifyResetToken(tokenToVerify);
    console.log('✅ Resultado de verificación:', result);
    
    setTokenValid(result.valid);
    if (!result.valid) {
      setError(result.message || 'El enlace de recuperación es inválido o ha expirado');
    }
  };

  /**
   * Maneja cambios en los inputs del formulario
   * 
   * @function handleChange
   * @param {Object} e - Evento del input
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  /**
   * Maneja el envío del formulario de restablecimiento
   * 
   * @async
   * @function handleSubmit
   * @param {Object} e - Evento del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación del token
    if (!token) {
      setError('Token no disponible');
      setLoading(false);
      return;
    }

    // Validación de coincidencia de contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Validación de longitud mínima
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    console.log('🔄 Enviando solicitud de reset con token:', token);

    // Llamada al backend para restablecer contraseña
    const result = await resetPassword(token, formData.password);
    
    console.log('📨 Respuesta del reset:', result);
    
    if (result.success) {
      setMessage('✅ Tu contraseña ha sido restablecida correctamente. Redirigiendo al login...');
      // Redirección automática después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setError(result.error || 'Error al restablecer la contraseña');
    }
    setLoading(false);
  };

  // ==========================================================================
  // RENDERIZADO CONDICIONAL: TOKEN INVÁLIDO
  // ==========================================================================
  
  /**
   * Renderiza una vista de error cuando el token es inválido
   * Incluye información de debug para troubleshooting
   */
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

  // ==========================================================================
  // RENDERIZADO PRINCIPAL: FORMULARIO DE RESTABLECIMIENTO
  // ==========================================================================
  
  return (
    <main className="auth-main">
      <section className="auth-section">
        <div className="container">
          <div className="auth-card-compact">
            {/* Encabezado */}
            <div className="auth-header">
              <div className="auth-icon">🔑</div>
              <h2 className="auth-title">Nueva Contraseña</h2>
              <p className="auth-subtitle">Crea una nueva contraseña para tu cuenta</p>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="auth-error-compact">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Mensaje de éxito */}
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

            {/* Formulario de restablecimiento */}
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

            {/* Requisitos de contraseña */}
            <div className="password-requirements">
              <p className="requirements-title">🔒 La contraseña debe tener:</p>
              <ul className="requirements-list">
                <li>✅ Mínimo 6 caracteres</li>
                <li>✅ Letras y números (recomendado)</li>
                <li>✅ Diferente a tu contraseña anterior</li>
              </ul>
            </div>

            {/* Sección de debug (comentada en producción) */}
            {/* {token && (
              <div className="debug-info" style={{marginTop: '15px', padding: '12px', background: '#f3f4f6', borderRadius: '6px', fontSize: '12px'}}>
                <p><strong>Token detectado:</strong> {token.substring(0, 25)}...</p>
                <p><strong>Estado:</strong> {tokenValid === null ? 'Verificando...' : tokenValid ? '✅ Válido' : '❌ Inválido'}</p>
              </div>
            )} */}

            {/* Enlaces de navegación */}
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