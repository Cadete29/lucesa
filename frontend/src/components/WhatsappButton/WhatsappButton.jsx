// components/WhatsappButton/WhatsappButton.jsx
import React from 'react';
import './WhatsappButton.css';

/**
 * WHATSAPP BUTTON COMPONENT
 * 
 * Componente de botón flotante para contacto rápido vía WhatsApp.
 * Se muestra como un botón flotante en la esquina inferior derecha de la pantalla
 * que permite a los usuarios contactar al negocio directamente por WhatsApp.
 * 
 * Características principales:
 * - Botón flotante con posicionamiento fijo
 * - Icono SVG de WhatsApp optimizado
 * - Tooltip al hacer hover
 * - URL de WhatsApp preconfigurada con mensaje predeterminado
 * - Accesibilidad implementada
 * - Compatible con dispositivos móviles
 * 
 * @component
 * @example
 * // Uso en el layout principal de la aplicación
 * <WhatsappButton />
 */

/**
 * Componente WhatsappButton - Botón de contacto vía WhatsApp
 * 
 * Este componente proporciona:
 * 1. Un botón flotante para contacto inmediato por WhatsApp
 * 2. Generación automática de URL de WhatsApp con mensaje predeterminado
 * 3. Icono SVG del logo de WhatsApp
 * 4. Tooltip informativo al hacer hover
 * 5. Atributos de accesibilidad
 * 
 * @returns {JSX.Element} Componente de botón de WhatsApp
 */
const WhatsappButton = () => {
  // ==========================================================================
  // CONFIGURACIÓN DE WHATSAPP
  // ==========================================================================
  
  /**
   * Número de teléfono de WhatsApp de destino
   * Formato: Solo números, sin espacios, guiones o código de país
   * @constant {string} phoneNumber - Número de WhatsApp del negocio
   */
  const phoneNumber = '5611926523'; // Cambia esto por tu número
  
  /**
   * Mensaje predeterminado que se enviará al iniciar la conversación
   * Este mensaje aparecerá pre-llenado en el chat de WhatsApp
   * @constant {string} defaultMessage - Mensaje inicial predeterminado
   */
  const defaultMessage = 'Hola, me gustaría obtener más información sobre sus productos.';
  
  // ==========================================================================
  // GENERACIÓN DE URL DE WHATSAPP
  // ==========================================================================
  
  /**
   * Genera la URL completa para iniciar chat de WhatsApp
   * Utiliza la API de WhatsApp Web con parámetros predefinidos
   * @constant {string} whatsappUrl - URL completa para abrir chat
   */
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;
  
  // ==========================================================================
  // RENDERIZADO DEL COMPONENTE
  // ==========================================================================
  
  return (
    /**
     * Enlace que funciona como botón flotante de WhatsApp
     * Se abre en una nueva pestaña para no interrumpir la navegación del usuario
     */
    <a 
      href={whatsappUrl} 
      className="whatsapp-button"
      target="_blank" 
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
    >
      {/* 
        Icono SVG del logo de WhatsApp
        Versión simplificada y optimizada para renderizado rápido
        Se usa currentColor para heredar el color del contenedor
      */}
      <svg 
        className="whatsapp-icon" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/*
          Path del logo de WhatsApp
          Tomado de los assets oficiales de WhatsApp
          Mantiene las proporciones y detalles del logo original
        */}
        <path 
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411"
          fill="currentColor"
        />
      </svg>
      
      {/* 
        Tooltip que aparece al hacer hover sobre el botón
        Proporciona contexto adicional al usuario
        Se oculta en dispositivos móviles o mediante CSS
      */}
      <span className="whatsapp-tooltip">¡Chatea con nosotros!</span>
    </a>
  );
};

export default WhatsappButton;