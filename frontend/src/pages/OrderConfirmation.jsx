import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const location = useLocation();
  const { orderId, total } = location.state || {};

  if (!orderId) {
    return (
      <div className="order-confirmation">
        <div className="container">
          <div className="confirmation-error">
            <h2>Información de orden no disponible</h2>
            <Link to="/" className="btn-primary">Volver al Inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation">
      <div className="container">
        <div className="confirmation-card">
          <div className="confirmation-header">
            <div className="success-icon">✅</div>
            <h1>¡Pedido Confirmado!</h1>
            <p className="order-number">Número de orden: {orderId}</p>
          </div>

          <div className="confirmation-details">
            <div className="detail-section">
              <h3>Resumen del Pedido</h3>
              <div className="detail-row">
                <span>Total pagado:</span>
                <span className="amount">${total} MXN</span>
              </div>
              <div className="detail-row">
                <span>Fecha de pedido:</span>
                <span>{new Date().toLocaleDateString('es-MX')}</span>
              </div>
              <div className="detail-row">
                <span>Estado:</span>
                <span className="status confirmed">Confirmado</span>
              </div>
            </div>

            <div className="next-steps">
              <h3>¿Qué sigue?</h3>
              <div className="steps-timeline">
                <div className="step-item">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>Preparación del pedido</strong>
                    <p>Tu pedido está siendo preparado para el envío</p>
                  </div>
                </div>
                <div className="step-item">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>Envío</strong>
                    <p>Recibirás un email con el número de guía</p>
                  </div>
                </div>
                <div className="step-item">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <strong>Entrega</strong>
                    <p>Tu pedido llegará en 3-5 días hábiles</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="confirmation-actions">
            <Link to="/products" className="btn-primary">
              Seguir Comprando
            </Link>
            <Link to="/orders" className="btn-secondary">
              Ver Mis Pedidos
            </Link>
          </div>

          <div className="confirmation-support">
            <p>¿Tienes preguntas sobre tu pedido?</p>
            <div className="support-contacts">
              <a href="mailto:soporte@lucesa.com" className="support-link">
                📧 soporte@lucesa.com
              </a>
              <a href="tel:+525555555555" className="support-link">
                📞 +52 55 5555 5555
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;