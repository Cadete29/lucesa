import React from 'react';
import './LegalPages.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-container">
      <div className="privacy-header">
        <h1 className="privacy-title">Política de Privacidad</h1>
        <p className="privacy-subtitle">Última actualización: {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="privacy-content">
        <section className="privacy-section">
          <h2 className="privacy-section-title">1. Información que Recopilamos</h2>
          <p className="privacy-text">
            Recopilamos información que usted nos proporciona directamente, como cuando crea una cuenta, 
            completa un formulario o se contacta con nuestro equipo de soporte.
          </p>
          <ul className="privacy-list">
            <li className="privacy-list-item">Información de contacto (nombre, correo electrónico, teléfono)</li>
            <li className="privacy-list-item">Información de perfil (nombre de usuario, foto de perfil)</li>
            <li className="privacy-list-item">Comunicaciones con nuestro equipo</li>
          </ul>
        </section>
        
        <section className="privacy-section">
          <h2 className="privacy-section-title">2. Cómo Utilizamos su Información</h2>
          <p className="privacy-text">
            Utilizamos la información que recopilamos para proporcionar, mantener y mejorar nuestros servicios.
          </p>
          <p className="privacy-text">
            También utilizamos su información para:
          </p>
          <ul className="privacy-list">
            <li className="privacy-list-item">Procesar transacciones y enviar notificaciones relacionadas</li>
            <li className="privacy-list-item">Personalizar su experiencia en nuestros servicios</li>
            <li className="privacy-list-item">Enviar información sobre actualizaciones y nuevos productos</li>
            <li className="privacy-list-item">Detectar y prevenir actividades fraudulentas</li>
          </ul>
        </section>
        
        <section className="privacy-section">
          <h2 className="privacy-section-title">3. Compartición de Información</h2>
          <p className="privacy-text">
            No vendemos su información personal a terceros. Solo compartimos información en las siguientes circunstancias:
          </p>
          <ul className="privacy-list">
            <li className="privacy-list-item">Con su consentimiento explícito</li>
            <li className="privacy-list-item">Con proveedores de servicios que nos ayudan a operar nuestro negocio</li>
            <li className="privacy-list-item">Para cumplir con obligaciones legales</li>
            <li className="privacy-list-item">Para proteger derechos, propiedad o seguridad nuestra o de otros</li>
          </ul>
        </section>
        
        <section className="privacy-section">
          <h2 className="privacy-section-title">4. Seguridad de Datos</h2>
          <p className="privacy-text">
            Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal 
            contra acceso no autorizado, alteración, divulgación o destrucción.
          </p>
        </section>
        
        <section className="privacy-section">
          <h2 className="privacy-section-title">5. Sus Derechos</h2>
          <p className="privacy-text">
            Dependiendo de su ubicación, puede tener ciertos derechos respecto a su información personal, como:
          </p>
          <ul className="privacy-list">
            <li className="privacy-list-item">Acceder a la información que tenemos sobre usted</li>
            <li className="privacy-list-item">Corregir información inexacta</li>
            <li className="privacy-list-item">Solicitar la eliminación de su información</li>
            <li className="privacy-list-item">Oponerse al procesamiento de sus datos</li>
            <li className="privacy-list-item">Solicitar la portabilidad de sus datos</li>
          </ul>
        </section>
        
        <section className="privacy-section">
          <h2 className="privacy-section-title">6. Contacto</h2>
          <p className="privacy-text">
            Si tiene preguntas sobre esta Política de Privacidad, puede contactarnos en:
          </p>
          <p className="privacy-contact">
            <strong>Correo electrónico:</strong> luis.lucio@lucesademexico.com<br />
            <strong>Teléfono:</strong> +52 (56) 1017 7596 / +52 (56) 2739 1455
          </p>
        </section>
      </div>
      
      <div className="privacy-footer">
        <p className="privacy-footer-text">
          Esta política puede actualizarse periódicamente. Le notificaremos sobre cambios significativos 
          publicando la nueva política en este sitio.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;