import React from 'react';
import { Link } from 'react-router-dom';

const PagoPendiente = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>⏳ Pago Pendiente</h1>
      <p>Tu pago está siendo procesado. Recibirás una confirmación cuando se complete.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
};

export default PagoPendiente;