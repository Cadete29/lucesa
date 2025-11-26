import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const result = await forgotPassword(email);
    
    if (result.success) {
      setMessage(result.message || 'Se ha enviado un email con las instrucciones para resetear tu contraseña');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Llenar email demo automáticamente
  const fillDemoEmail = () => {
    setEmail('demo@lucesa.com');
  };

  return (
    <main className="auth-main">
      <section className="auth-section">
        <div className="container">
          <div className="auth-card-compact">
            <div className="auth-header">
              <div className="auth-icon">🔑</div>
              <h2 className="auth-title">Recuperar Contraseña</h2>
              <p className="auth-subtitle">Te enviaremos instrucciones a tu email</p>
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

            {/* Botón de demo */}
            <div className="demo-credentials">
              <button 
                type="button" 
                onClick={fillDemoEmail}
                className="btn-demo"
              >
                Usar Email de Demo
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Tu email"
                  className="auth-input"
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="btn-auth-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar Instrucciones'
                )}
              </button>
            </form>

            <div className="recovery-info">
              <p className="info-text">
                ¿No recibiste el email? Revisa tu carpeta de spam o 
                <Link to="/forgot-password" className="auth-link"> solicita otro enlace</Link>.
              </p>
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

export default ForgotPassword;