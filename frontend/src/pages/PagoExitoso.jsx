import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const PagoExito = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    // Obtener parámetros de la URL de Mercado Pago
    const urlParams = new URLSearchParams(location.search);
    const paymentId = urlParams.get('payment_id');
    const status = urlParams.get('status');
    const externalReference = urlParams.get('external_reference');

    console.log('✅ Pago exitoso - Parámetros:', {
      paymentId,
      status,
      externalReference
    });

    // Redirigir a la página de confirmación de orden
    if (externalReference) {
      navigate(`/order-confirmation?orderId=${externalReference}`, {
        replace: true
      });
    } else {
      // Si no hay referencia, redirigir a la página principal
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>✅ Pago Exitoso</h1>
      <p>Redirigiendo a la confirmación de tu pedido...</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
};

export default PagoExito;