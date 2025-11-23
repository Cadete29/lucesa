import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const result = await resetPassword(email);
    
    if (result.success) {
      setMessage('Se ha enviado un email con las instrucciones para resetear tu contraseña');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Recuperar Contraseña</h2>
          <p>Te enviaremos instrucciones a tu email</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-success">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary auth-btn"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Instrucciones'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login" className="auth-link">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;