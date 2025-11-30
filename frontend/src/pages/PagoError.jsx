import React from 'react';
import { Link } from 'react-router-dom';

const PagoError = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>❌ Error en el Pago</h1>
      <p>Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.</p>
      <div style={{ marginTop: '1rem' }}>
        <Link to="/checkout" style={{ marginRight: '1rem' }}>
          Reintentar Pago
        </Link>
        <Link to="/">
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
};

export default PagoError;