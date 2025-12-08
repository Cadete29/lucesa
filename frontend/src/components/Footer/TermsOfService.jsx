import React from 'react';
import './Terms.css';

const TermsOfService = () => {
  return (
    <div className="terms-container">
      <div className="terms-header">
        <h1 className="terms-title">Términos de Servicio</h1>
        <p className="terms-subtitle">Última actualización: {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="terms-content">
        <section className="terms-section">
          <h2 className="terms-section-title">1. Aceptación de los Términos</h2>
          <p className="terms-text">
            Al acceder y utilizar nuestros servicios, usted acepta cumplir con estos Términos de Servicio 
            y todas las leyes y regulaciones aplicables.
          </p>
          <p className="terms-text">
            Si no está de acuerdo con alguno de estos términos, tiene prohibido usar o acceder a nuestros servicios.
          </p>
        </section>
        
        <section className="terms-section">
          <h2 className="terms-section-title">2. Descripción del Servicio</h2>
          <p className="terms-text">
            Nuestro servicio proporciona diversos productos a sus necesidades. Nos reservamos el derecho de 
            modificar, suspender o discontinuar cualquier aspecto de nuestros servicios en cualquier momento.
          </p>
        </section>
        
        <section className="terms-section">
          <h2 className="terms-section-title">3. Registro de Cuenta</h2>
          <p className="terms-text">
            Para utilizar ciertas funciones de nuestros servicios, es posible que deba registrarse para una cuenta.
          </p>
          <p className="terms-text">
            Usted es responsable de:
          </p>
          <ul className="terms-list">
            <li className="terms-list-item">Mantener la confidencialidad de su contraseña</li>
            <li className="terms-list-item">Toda la actividad que ocurra bajo su cuenta</li>
            <li className="terms-list-item">Proporcionar información precisa y actualizada</li>
          </ul>
        </section>
        
        <section className="terms-section">
          <h2 className="terms-section-title">4. Conducta del Usuario</h2>
          <p className="terms-text">
            Usted acepta no utilizar nuestros servicios para:
          </p>
          <ul className="terms-list">
            <li className="terms-list-item">Violar cualquier ley o regulación local, estatal, nacional o internacional</li>
            <li className="terms-list-item">Infringir derechos de propiedad intelectual o de privacidad</li>
            <li className="terms-list-item">Transmitir contenido malicioso, como virus o código dañino</li>
            <li className="terms-list-item">Acosar, abusar o dañar a otros usuarios</li>
            <li className="terms-list-item">Realizar actividades fraudulentas o engañosas</li>
          </ul>
        </section>
        
        <section className="terms-section">
          <h2 className="terms-section-title">5. Propiedad Intelectual</h2>
          <p className="terms-text">
            Todo el contenido incluido en nuestros servicios, como texto, gráficos, logotipos, imágenes, 
            y software, es propiedad de Lucesa Distribucion o de sus proveedores de contenido y está 
            protegido por leyes de propiedad intelectual.
          </p>
        </section>
        
        <section className="terms-section">
          <h2 className="terms-section-title">6. Limitación de Responsabilidad</h2>
          <p className="terms-text">
            En la máxima medida permitida por la ley aplicable, Lucesa Distribucion no será responsable 
            por daños indirectos, incidentales, especiales o consecuentes que resulten del uso o la 
            imposibilidad de usar nuestros servicios.
          </p>
        </section>
        
        <section className="terms-section">
          <h2 className="terms-section-title">7. Modificaciones a los Términos</h2>
          <p className="terms-text">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. 
            Le notificaremos sobre cambios significativos publicando los nuevos términos en este sitio.
          </p>
        </section>
        
        <section className="terms-section">
          <h2 className="terms-section-title">8. Ley Aplicable</h2>
          <p className="terms-text">
            Estos términos se regirán e interpretarán de acuerdo con las leyes de Mexico, 
            sin tener en cuenta sus disposiciones sobre conflictos de leyes.
          </p>
        </section>
        
        <section className="terms-section">
          <h2 className="terms-section-title">9. Contacto</h2>
          <p className="terms-contact">
            Si tiene preguntas sobre estos Términos de Servicio, puede contactarnos en:
          </p>
          <p className="terms-contact-info">
            <strong>Correo electrónico:</strong> luis.lucio@lucesademexico.com<br />
            <strong>Teléfono:</strong> +52 (56) 1017 7596 / +52 (56) 2739 1455
          </p>
        </section>
      </div>
      
      <div className="terms-footer">
        <p className="terms-footer-text">
          Al utilizar nuestros servicios, usted reconoce haber leído, comprendido y aceptado estos Términos de Servicio.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;