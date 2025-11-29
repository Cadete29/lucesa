// src/components/auth/Register.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

/**
 * Componente de registro de usuario
 * Maneja la creación de nuevas cuentas sin campo username visible
 */
const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',    // Campo para nombre completo (opcional)
    acceptTerms: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, socialLogin } = useAuth();
  const navigate = useNavigate();

  /**
   * Maneja cambios en los campos del formulario
   */
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    setError('');
  };

  /**
   * Maneja el envío del formulario de registro
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones del frontend
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos obligatorios');
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

    if (!formData.acceptTerms) {
      setError('Debes aceptar los términos y condiciones');
      setLoading(false);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un email válido');
      setLoading(false);
      return;
    }

    // Preparar datos para enviar al backend
    // Generar username automáticamente desde el email
    const username = formData.email.split('@')[0]; // Usar la parte antes del @ como username
    const userData = {
      username: username,
      email: formData.email,
      password: formData.password,
      nombre: formData.nombre || '' // Enviar nombre si está presente
    };

    console.log('Enviando datos de registro:', userData);

    const result = await register(userData);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  /**
   * Maneja registro con redes sociales
   */
  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');

    const result = await socialLogin(provider);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  /**
   * Rellena automáticamente datos de demo
   */
  const fillDemoData = () => {
    setFormData({
      email: 'santiagoalanmichel@gmail.com',
      password: 'password123',
      confirmPassword: 'password123',
      nombre: 'Alan Michel Santiago Serrano',
      acceptTerms: true
    });
  };

  return (
    <main className="auth-main">
      <section className="auth-section">
        <div className="container">
          <div className="auth-card-compact">
            {/* Header de la tarjeta */}
            <div className="auth-header">
              <div className="auth-icon">👤</div>
              <h2 className="auth-title">Crear Cuenta</h2>
              <p className="auth-subtitle">Únete a la comunidad Lucesa</p>
            </div>

            {/* Mostrar errores */}
            {error && (
              <div className="auth-error-compact">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Botón de datos demo */}
            <div className="demo-credentials">
              <button 
                type="button" 
                onClick={fillDemoData}
                className="btn-demo"
                disabled={loading}
              >
                Usar Datos de Demo
              </button>
            </div>

            {/* Formulario de registro */}
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Campo Nombre Completo (opcional) */}
              <div className="form-group">
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Nombre completo (opcional)"
                  className="auth-input"
                  disabled={loading}
                />
              </div>

              {/* Campo Email (obligatorio) */}
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Email *"
                  className="auth-input"
                  disabled={loading}
                />
              </div>

              {/* Campo Contraseña (obligatorio) */}
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Contraseña *"
                  className="auth-input"
                  disabled={loading}
                  minLength="6"
                />
                <small className="input-help">Mínimo 6 caracteres</small>
              </div>

              {/* Campo Confirmar Contraseña (obligatorio) */}
              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirmar contraseña *"
                  className="auth-input"
                  disabled={loading}
                  minLength="6"
                />
              </div>

              {/* Checkbox Términos y Condiciones */}
              <div className="form-checkbox-compact">
                <label>
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <span>Acepto los <Link to="/terms" className="auth-link">términos y condiciones</Link> y la <Link to="/privacy" className="auth-link">política de privacidad</Link></span>
                </label>
              </div>

              {/* Botón de registro */}
              <button 
                type="submit" 
                className="btn-auth-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Creando cuenta...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>

            {/* Separador para registro social */}
            <div className="auth-separator-corrected">
              <div className="separator-line"></div>
              <div className="separator-text">o regístrate con</div>
              <div className="separator-line"></div>
            </div>

            {/* Botones de redes sociales */}
            <div className="social-buttons-compact">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="social-btn-compact google"
                disabled={loading}
              >
                <svg className="social-icon-svg" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              
              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                className="social-btn-compact facebook"
                disabled={loading}
              >
                <svg className="social-icon-svg" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>

            {/* Enlace a login */}
            <div className="auth-footer">
              <p>
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="auth-link">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Register;