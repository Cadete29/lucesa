// src/components/ImageDebug/ImageDebug.js

/**
 * Componente ImageDebug
 * 
 * Componente de depuración para diagnóstico de imágenes de productos que incluye:
 * - Visualización de estructura completa de productos
 * - Prueba de carga de imágenes originales y via proxy
 * - Validación de URLs de imágenes
 * - Debugging de problemas CORS y rutas
 * 
 * Responsabilidades:
 * 1. Mostrar estructura de datos de productos recibidos desde API
 * 2. Probar carga de imágenes desde diferentes fuentes
 * 3. Detectar problemas de URLs, CORS y accesibilidad
 * 4. Proporcionar información detallada para debugging
 * 5. Validar funcionalidad del proxy de imágenes
 * 
 * Características:
 * - Muestra primeros 3 productos para evitar sobrecarga
 * - Prueba simultánea de imágenes originales y proxy
 * - Feedback visual inmediato de éxito/error
 * - Logs de consola detallados
 * - Formateo JSON para fácil lectura
 */

import React from 'react';
import { useProductos } from '../../api/productosHooks';

/**
 * Componente de depuración de imágenes
 * @component
 * @returns {JSX.Element} Panel de depuración visual
 */
const ImageDebug = () => {
  // ============================================
  // HOOKS DE API
  // ============================================

  /** 
   * @hook useProductos
   * @description Obtiene todos los productos para debugging
   */
  const { data: productosData } = useProductos();
  
  /** 
   * @constant {Array} productos
   * @description Lista de productos para debugging (vacía si no hay datos)
   */
  const productos = productosData?.data || [];

  // ============================================
  // LOGS DE DEPURACIÓN INICIALES
  // ============================================

  /**
   * Logs detallados en consola para debugging
   * - Estructura completa del primer producto
   * - Todos los productos recibidos
   */
  console.log('🔍 DEBUG - Estructura completa del primer producto:', productos[0] || {});
  console.log('🔍 DEBUG - Todos los productos:', productos);

  // ============================================
  // FUNCIONES UTILITARIAS
  // ============================================

  /**
   * Obtener URL de imagen con proxy si corresponde
   * @function getImageUrl
   * @param {Object} producto - Producto a analizar
   * @returns {string|null} URL de imagen o null si no hay
   * 
   * @description
   * Lógica de proxy:
   * 1. Si no hay imagen: retorna null
   * 2. Si es de static.ctonline.mx y tiene código: usa proxy
   * 3. Otros casos: usa imagen original
   */
  const getImageUrl = (producto) => {
    // Validación básica
    if (!producto.imagen) return null;
    
    // Usar proxy para imágenes de static.ctonline.mx
    if (producto.imagen.includes('static.ctonline.mx') && producto.codigo) {
      return `https://lucesademexico-shop.com.mx/api/images/code/${producto.codigo}?size=full`;
    }
    
    // Usar imagen original para otros casos
    return producto.imagen;
  };

  // ============================================
  // RENDERIZADO PRINCIPAL
  // ============================================

  return (
    <div 
      style={{ 
        padding: '20px', 
        background: '#f5f5f5', 
        margin: '20px 0',
        border: '2px solid #dc3545',
        borderRadius: '8px'
      }}
      role="region"
      aria-label="Panel de depuración de imágenes"
    >
      {/* TÍTULO DEL PANEL */}
      <h3 
        style={{ 
          color: '#dc3545', 
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <span role="img" aria-label="Lupa de búsqueda">🔍</span>
        DEBUG de Imágenes - Primeros 3 productos
      </h3>
      
      {/* INFORMACIÓN GENERAL */}
      <div style={{ marginBottom: '20px' }}>
        <p>
          <strong>Total productos recibidos:</strong> {productos.length}
        </p>
        <p>
          <strong>Proxy activo:</strong> https://lucesademexico-shop.com.mx/api/images/code/
        </p>
      </div>

      {/* PANEL DE PRODUCTOS */}
      {productos.length === 0 ? (
        // ESTADO: SIN PRODUCTOS
        <div 
          style={{ 
            padding: '20px', 
            background: '#fff', 
            border: '2px dashed #dc3545',
            textAlign: 'center',
            color: '#dc3545',
            borderRadius: '4px'
          }}
          role="alert"
          aria-live="assertive"
        >
          <span role="img" aria-label="Advertencia">⚠️</span> NO HAY PRODUCTOS PARA MOSTRAR
        </div>
      ) : (
        // ESTADO: CON PRODUCTOS - Mostrar primeros 3
        productos.slice(0, 3).map((producto, index) => {
          // URLs para testing
          const imageUrl = getImageUrl(producto);
          const proxyUrl = producto.codigo ? 
            `https://lucesademexico-shop.com.mx/api/images/code/${producto.codigo}?size=full` : 
            null;

          return (
            <div 
              key={index}
              style={{
                margin: '15px 0',
                padding: '15px',
                background: 'white',
                border: '2px solid #007bff',
                borderRadius: '8px'
              }}
              role="article"
              aria-label={`Producto ${index + 1}: ${producto.nombre}`}
            >
              {/* CABECERA DEL PRODUCTO */}
              <h4 
                style={{ 
                  color: '#007bff', 
                  marginBottom: '10px',
                  borderBottom: '2px solid #e9ecef',
                  paddingBottom: '5px'
                }}
              >
                Producto {index + 1}: {producto.nombre || 'Sin nombre'}
              </h4>
              
              {/* CONTENIDO: DATOS + IMÁGENES */}
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                flexWrap: 'wrap',
                alignItems: 'flex-start'
              }}>
                
                {/* COLUMNA IZQUIERDA: DATOS DEL PRODUCTO */}
                <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <strong style={{ display: 'block', marginBottom: '10px' }}>
                    Datos del producto:
                  </strong>
                  
                  {/* JSON FORMATEADO */}
                  <pre 
                    style={{ 
                      fontSize: '12px', 
                      background: '#f8f9fa', 
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '200px',
                      lineHeight: '1.4',
                      tabSize: 2
                    }}
                    aria-label={`Datos estructurados del producto ${producto.nombre}`}
                  >
                    {JSON.stringify({
                      // Identificadores
                      idProducto: producto.idProducto,
                      id: producto.id,
                      codigo: producto.codigo,
                      
                      // Información básica
                      nombre: producto.nombre,
                      marca: producto.marca,
                      
                      // Categorización
                      categoria: producto.categoria,
                      subcategoria: producto.subcategoria,
                      
                      // Imágenes
                      imagenOriginal: producto.imagen,
                      imagenProxy: proxyUrl,
                      tieneImagen: !!producto.imagen,
                      tieneCodigo: !!producto.codigo,
                      
                      // Precios y stock
                      precio: producto.precio,
                      moneda: producto.moneda,
                      existencia: producto.existencia
                    }, null, 2)}
                  </pre>
                  
                  {/* RESUMEN ESTADÍSTICO */}
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '10px',
                    background: '#e9ecef',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    <strong>Resumen:</strong>
                    <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                      <li>
                        <span role="img" aria-label={producto.imagen ? "Sí" : "No"}>
                          {producto.imagen ? '✅' : '❌'}
                        </span>
                        {' '}Imagen: {producto.imagen ? 'Sí' : 'No'}
                      </li>
                      <li>
                        <span role="img" aria-label={producto.codigo ? "Sí" : "No"}>
                          {producto.codigo ? '✅' : '❌'}
                        </span>
                        {' '}Código: {producto.codigo || 'No'}
                      </li>
                      <li>
                        <span role="img" aria-label={proxyUrl ? "Aplicable" : "No aplicable"}>
                          {proxyUrl ? '🔄' : '➡️'}
                        </span>
                        {' '}Proxy: {proxyUrl ? 'Aplicable' : 'No aplicable'}
                      </li>
                    </ul>
                  </div>
                </div>
                
                {/* COLUMNA DERECHA: PRUEBAS DE IMÁGENES */}
                <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <strong style={{ display: 'block', marginBottom: '10px' }}>
                    Pruebas de imágenes:
                  </strong>
                  
                  {/* VALIDACIÓN: ¿TIENE IMAGEN? */}
                  {producto.imagen ? (
                    <div>
                      {/* INFORMACIÓN DE URLs */}
                      <div style={{ 
                        marginBottom: '20px',
                        padding: '10px',
                        background: '#f8f9fa',
                        borderRadius: '4px',
                        border: '1px solid #dee2e6'
                      }}>
                        <p>
                          <strong>URL Original:</strong>{' '}
                          <code style={{ 
                            fontSize: '12px',
                            wordBreak: 'break-all',
                            color: '#6c757d'
                          }}>
                            {producto.imagen}
                          </code>
                        </p>
                        <p>
                          <strong>URL Proxy:</strong>{' '}
                          <code style={{ 
                            fontSize: '12px',
                            wordBreak: 'break-all',
                            color: proxyUrl ? '#28a745' : '#dc3545'
                          }}>
                            {proxyUrl || 'No disponible'}
                          </code>
                        </p>
                      </div>
                      
                      {/* PRUEBA DE IMAGEN VIA PROXY */}
                      {proxyUrl && (
                        <div style={{ margin: '15px 0' }}>
                          <h5 style={{ 
                            marginBottom: '10px',
                            color: '#28a745',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <span role="img" aria-label="Prueba de proxy">🔄</span>
                            Imagen via Proxy:
                          </h5>
                          
                          <div 
                            style={{ 
                              border: '3px solid #28a745', 
                              padding: '10px', 
                              margin: '10px 0',
                              borderRadius: '4px',
                              background: '#f8f9fa'
                            }}
                            role="region"
                            aria-label="Prueba de carga de imagen via proxy"
                          >
                            {/* IMAGEN PROXY */}
                            <img 
                              src={proxyUrl}
                              alt={`Prueba proxy para ${producto.nombre || 'producto'}`}
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '200px',
                                display: 'block',
                                margin: '0 auto',
                                objectFit: 'contain'
                              }}
                              crossOrigin="anonymous"
                              loading="lazy"
                              onError={(e) => {
                                // Log de error
                                console.log('❌ ERROR cargando imagen via proxy:', {
                                  url: proxyUrl,
                                  producto: producto.nombre,
                                  codigo: producto.codigo
                                });
                                
                                // Feedback visual
                                e.target.style.border = '3px solid #dc3545';
                                e.target.style.padding = '5px';
                                
                                const statusElement = e.target.nextElementSibling;
                                if (statusElement) {
                                  statusElement.textContent = '❌ ERROR - Proxy no funciona';
                                  statusElement.style.color = '#dc3545';
                                  statusElement.style.fontWeight = 'bold';
                                }
                              }}
                              onLoad={(e) => {
                                // Log de éxito
                                console.log('✅ IMAGEN CARGADA via proxy:', {
                                  url: proxyUrl,
                                  producto: producto.nombre,
                                  codigo: producto.codigo
                                });
                                
                                // Feedback visual
                                e.target.style.border = '3px solid #28a745';
                                e.target.style.padding = '5px';
                                
                                const statusElement = e.target.nextElementSibling;
                                if (statusElement) {
                                  statusElement.textContent = '✅ IMAGEN CARGADA CORRECTAMENTE via Proxy';
                                  statusElement.style.color = '#28a745';
                                  statusElement.style.fontWeight = 'bold';
                                }
                              }}
                            />
                            
                            {/* ESTADO DE CARGA */}
                            <p 
                              style={{ 
                                textAlign: 'center', 
                                marginTop: '10px',
                                fontWeight: 'bold',
                                minHeight: '24px'
                              }}
                              aria-live="polite"
                              aria-atomic="true"
                            >
                              Probando proxy...
                            </p>
                            
                            {/* BOTÓN DE REINTENTO */}
                            <button
                              style={{
                                display: 'block',
                                margin: '10px auto 0',
                                padding: '5px 10px',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                              onClick={() => {
                                const img = document.querySelector(`img[src="${proxyUrl}"]`);
                                if (img) {
                                  img.src = `${proxyUrl}&retry=${Date.now()}`;
                                }
                              }}
                              aria-label="Reintentar carga de imagen proxy"
                            >
                              Reintentar Proxy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PRUEBA DE IMAGEN ORIGINAL */}
                      <div style={{ margin: '15px 0' }}>
                        <h5 style={{ 
                          marginBottom: '10px',
                          color: '#6c757d',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span role="img" aria-label="Prueba de imagen original">🔗</span>
                          Imagen Original:
                        </h5>
                        
                        <div 
                          style={{ 
                            border: '3px solid #6c757d', 
                            padding: '10px', 
                            margin: '10px 0',
                            borderRadius: '4px',
                            background: '#f8f9fa'
                          }}
                          role="region"
                          aria-label="Prueba de carga de imagen original"
                        >
                          {/* IMAGEN ORIGINAL */}
                          <img 
                            src={producto.imagen}
                            alt={`Prueba original para ${producto.nombre || 'producto'}`}
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '200px',
                              display: 'block',
                              margin: '0 auto',
                              objectFit: 'contain'
                            }}
                            crossOrigin="anonymous"
                            loading="lazy"
                            onError={(e) => {
                              // Log de error
                              console.log('❌ ERROR cargando imagen original:', {
                                url: producto.imagen,
                                producto: producto.nombre,
                                tipo: 'original'
                              });
                              
                              // Feedback visual
                              e.target.style.border = '3px solid #dc3545';
                              e.target.style.padding = '5px';
                              
                              const statusElement = e.target.nextElementSibling;
                              if (statusElement) {
                                statusElement.textContent = '❌ ERROR - Imagen original no carga';
                                statusElement.style.color = '#dc3545';
                                statusElement.style.fontWeight = 'bold';
                              }
                              
                              // Detectar posible problema CORS
                              if (producto.imagen.includes('static.ctonline.mx')) {
                                console.log('⚠️ POSIBLE PROBLEMA CORS con static.ctonline.mx');
                                const corsWarning = document.createElement('p');
                                corsWarning.textContent = '⚠️ Probable problema CORS - Usar proxy';
                                corsWarning.style.color = '#fd7e14';
                                corsWarning.style.fontWeight = 'bold';
                                corsWarning.style.marginTop = '10px';
                                e.target.parentNode.appendChild(corsWarning);
                              }
                            }}
                            onLoad={(e) => {
                              // Log de éxito
                              console.log('✅ IMAGEN CARGADA original:', {
                                url: producto.imagen,
                                producto: producto.nombre,
                                tipo: 'original'
                              });
                              
                              // Feedback visual
                              e.target.style.border = '3px solid #28a745';
                              e.target.style.padding = '5px';
                              
                              const statusElement = e.target.nextElementSibling;
                              if (statusElement) {
                                statusElement.textContent = '✅ IMAGEN ORIGINAL CARGADA';
                                statusElement.style.color = '#28a745';
                                statusElement.style.fontWeight = 'bold';
                              }
                            }}
                          />
                          
                          {/* ESTADO DE CARGA */}
                          <p 
                            style={{ 
                              textAlign: 'center', 
                              marginTop: '10px',
                              fontWeight: 'bold',
                              minHeight: '24px'
                            }}
                            aria-live="polite"
                            aria-atomic="true"
                          >
                            Probando original...
                          </p>
                          
                          {/* BOTÓN DE REINTENTO */}
                          <button
                            style={{
                              display: 'block',
                              margin: '10px auto 0',
                              padding: '5px 10px',
                              background: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            onClick={() => {
                              const img = document.querySelector(`img[src="${producto.imagen}"]`);
                              if (img) {
                                img.src = `${producto.imagen}?retry=${Date.now()}`;
                              }
                            }}
                            aria-label="Reintentar carga de imagen original"
                          >
                            Reintentar Original
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // ESTADO: SIN IMAGEN
                    <div 
                      style={{ 
                        color: '#dc3545', 
                        fontWeight: 'bold',
                        padding: '20px',
                        background: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                      role="alert"
                      aria-live="assertive"
                    >
                      <span role="img" aria-label="Error">❌</span>
                      {' '}NO TIENE IMAGEN ASIGNADA EN LA BASE DE DATOS
                      <p style={{ 
                        marginTop: '10px',
                        fontSize: '14px',
                        fontWeight: 'normal',
                        color: '#721c24'
                      }}>
                        Verificar en administración del sistema
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      
      {/* PIE DE PÁGINA INFORMATIVO */}
      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        background: '#e9ecef',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <strong>Información del Debugger:</strong>
        <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
          <li>
            <span role="img" aria-label="Correcto" style={{ color: '#28a745' }}>✅</span>
            {' '}Borde verde = Imagen cargada correctamente
          </li>
          <li>
            <span role="img" aria-label="Error" style={{ color: '#dc3545' }}>❌</span>
            {' '}Borde rojo = Error de carga (CORS, 404, etc.)
          </li>
          <li>
            <span role="img" aria-label="Proxy" style={{ color: '#007bff' }}>🔄</span>
            {' '}Proxy se usa para imágenes de static.ctonline.mx
          </li>
          <li>Ver consola del navegador para logs detallados</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageDebug;