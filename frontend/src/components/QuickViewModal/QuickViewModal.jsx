import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './QuickViewModal.css';

// ✅ CONFIGURACIÓN DEL PORCENTAJE ADICIONAL (SINCRONIZADO)
const PORCENTAJE_ADICIONAL = 10; // 10% adicional a todos los productos

// ✅ Función sincronizada con Products.jsx y ProductDetails.jsx
const agregarPorcentajeAdicionalQvm = (precio) => {
  if (!precio || typeof precio !== 'number' || isNaN(precio) || precio <= 0) {
    return 0;
  }
  return precio * (1 + (PORCENTAJE_ADICIONAL / 100));
};

// ✅ Función de cálculo de precios sincronizada
const calcularPreciosConDescuentoQvm = (producto) => {
  if (!producto) {
    return {
      tienePromocionActiva: false,
      precioBaseMXN: '0.00',
      precioPromoMXN: null,
      discountPercentage: 0,
      precioFinalMXN: '0.00',
      ahorroMXN: '0.00',
      porcentajeAdicional: PORCENTAJE_ADICIONAL
    };
  }

  // ✅ PRECIO BASE EN MXN + 10%
  const precioMXNOriginal = producto.precioMXN || producto.precio || 0;
  const precioBaseCon10 = agregarPorcentajeAdicionalQvm(precioMXNOriginal);
  
  // ✅ PRECIO PROMOCIONAL EN MXN + 10%
  let precioPromoCon10 = null;
  let tienePromocionActiva = false;
  let discountPercentage = 0;

  // Verificar promociones del array
  if (producto.promociones && producto.promociones.length > 0) {
    const currentPromotion = producto.promociones[0];
    if (currentPromotion?.promocion) {
      let precioPromoMXN = currentPromotion.promocion;
      if (producto.moneda === 'USD') {
        precioPromoMXN = currentPromotion.promocion * (producto.tipo_cambio || 18.4);
      }
      precioPromoCon10 = agregarPorcentajeAdicionalQvm(precioPromoMXN);
    }
  } else if (producto.precioPromocion) {
    let precioPromoMXN = producto.precioPromocion;
    if (producto.moneda === 'USD') {
      precioPromoMXN = producto.precioPromocion * (producto.tipo_cambio || 18.4);
    }
    precioPromoCon10 = agregarPorcentajeAdicionalQvm(precioPromoMXN);
  }

  // Determinar si tiene promoción activa
  tienePromocionActiva = precioPromoCon10 !== null && precioPromoCon10 < precioBaseCon10;
  
  // Calcular porcentaje de descuento
  if (tienePromocionActiva && precioBaseCon10 > 0) {
    discountPercentage = Math.round(((precioBaseCon10 - precioPromoCon10) / precioBaseCon10) * 100);
  }

  // Formatear precios
  const formatearPrecioQvm = (precio) => {
    if (typeof precio !== 'number' || isNaN(precio)) return '0.00';
    return precio.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calcular ahorro
  const ahorroMXN = tienePromocionActiva ? (precioBaseCon10 - precioPromoCon10) : 0;

  return {
    tienePromocionActiva,
    precioBaseMXN: formatearPrecioQvm(precioBaseCon10),
    precioPromoMXN: tienePromocionActiva ? formatearPrecioQvm(precioPromoCon10) : null,
    discountPercentage,
    precioFinalMXN: tienePromocionActiva ? formatearPrecioQvm(precioPromoCon10) : formatearPrecioQvm(precioBaseCon10),
    ahorroMXN: formatearPrecioQvm(ahorroMXN),
    // Información para debug
    precioOriginalBase: precioMXNOriginal,
    precioBaseCon10,
    precioPromoCon10,
    porcentajeAdicional: PORCENTAJE_ADICIONAL,
    monedaOriginal: producto.moneda || 'USD'
  };
};

// ✅ Función helper para obtener valores de especificaciones
const getSpecValue = (spec) => {
  if (typeof spec === 'object' && spec !== null && 'valor' in spec) {
    return spec.valor;
  }
  return spec;
};

// ✅ Configuración de URLs por entorno
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

const QuickViewModal = ({ product, isOpen, onClose }) => {
  // ✅ TODOS LOS HOOKS DEBEN IR ANTES DE CUALQUIER CONDICIONAL
  const [quantityQvm, setQuantityQvm] = useState(1);
  const [selectedImageQvm, setSelectedImageQvm] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  // ✅ Usar el contexto del carrito
  const { addToCart, openCart } = useCart();

  // ✅ Hook useMemo DEBE estar antes de cualquier return
  const productCalculations = useMemo(() => {
    if (!product) {
      return {
        tienePromocionActiva: false,
        precioBaseMXN: '0.00',
        precioPromoMXN: null,
        discountPercentage: 0,
        precioFinalMXN: '0.00',
        ahorroMXN: '0.00',
        porcentajeAdicional: PORCENTAJE_ADICIONAL,
        monedaOriginal: 'USD'
      };
    }
    return calcularPreciosConDescuentoQvm(product);
  }, [product]); // ✅ Dependencia de product

  const {
    tienePromocionActiva,
    precioBaseMXN,
    precioPromoMXN,
    discountPercentage,
    precioFinalMXN,
    ahorroMXN,
    porcentajeAdicional,
    monedaOriginal
  } = productCalculations;

  // ✅ CORRECCIÓN: Usar la misma lógica de stock
  const totalStockQvm = useMemo(() => {
    if (!product?.existencia) return 0;
    
    if (typeof product.existencia === 'object' && product.existencia !== null) {
      return Object.values(product.existencia).reduce((total, stock) => {
        const stockNum = Number(stock);
        return total + (isNaN(stockNum) ? 0 : stockNum);
      }, 0);
    } else if (typeof product.existencia === 'number') {
      return product.existencia;
    } else if (typeof product.existencia === 'string') {
      return Number(product.existencia) || 0;
    }
    
    return 0;
  }, [product]);

  // ✅ FUNCIÓN: Obtener URL de imagen
  const getImageUrlQvm = (codigo, size = 'full') => {
    return `${IMAGE_BASE_URL}/${codigo}?size=${size}`;
  };

  const imagesQvm = useMemo(() => {
    if (!product?.codigo) return [];
    const mainImage = getImageUrlQvm(product.codigo);
    if (product.imagenes_adicionales && product.imagenes_adicionales.length > 0) {
      return [mainImage, ...product.imagenes_adicionales];
    }
    return [mainImage];
  }, [product]);

  // ✅ Obtener el ID correcto para el enlace
  const productDetailUrl = useMemo(() => {
    if (!product) return '#';
    const productId = product.idProducto || product.id || product.codigo;
    return `/product/${productId}`;
  }, [product]);

  // ✅ AHORA SÍ el return null va DESPUÉS de todos los hooks
  if (!isOpen || !product) return null;

  const handleQuantityChangeQvm = (value) => {
    if (value < 1) return;
    if (value > totalStockQvm) return;
    setQuantityQvm(value);
  };

  // ✅ FUNCIÓN MEJORADA: Agregar al carrito
  const handleAddToCartQvm = async () => {
    if (totalStockQvm === 0) return;
    
    setAddingToCart(true);
    
    try {
      // ✅ Preparar el producto con todos los datos necesarios
      const precioFinalNumerico = tienePromocionActiva && precioPromoMXN ? 
        parseFloat(precioPromoMXN.replace(/,/g, '')) : 
        parseFloat(precioFinalMXN.replace(/,/g, ''));
      
      const productToAdd = {
        ...product,
        // Asegurar que tenemos un ID único
        id: product.id || product.idProducto || product.codigo,
        idProducto: product.idProducto || product.id || product.codigo,
        // Precio final calculado (ya incluye 10%)
        precioFinal: precioFinalNumerico,
        // Información de stock
        existencia: totalStockQvm,
        // Información de promoción
        tienePromocion: tienePromocionActiva,
        discountPercentage,
        porcentajeAdicional: PORCENTAJE_ADICIONAL,
        // Información adicional para consistencia
        moneda: monedaOriginal,
        precioMXN: product.precioMXN || product.precio || 0
      };

      // ✅ Llamar a la función del contexto del carrito
      addToCart(productToAdd, quantityQvm);
      
      // ✅ Feedback visual breve
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ✅ Opcional: Abrir el carrito después de agregar
      openCart();
      
      // ✅ Cerrar el modal
      onClose();
      
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  // ✅ FUNCIÓN: Comprar ahora
  const handleQuickBuyQvm = () => {
    if (totalStockQvm === 0) return;
    
    const precioFinalNumerico = tienePromocionActiva && precioPromoMXN ? 
      parseFloat(precioPromoMXN.replace(/,/g, '')) : 
      parseFloat(precioFinalMXN.replace(/,/g, ''));
    
    const productToAdd = {
      ...product,
      id: product.id || product.idProducto || product.codigo,
      idProducto: product.idProducto || product.id || product.codigo,
      precioFinal: precioFinalNumerico,
      existencia: totalStockQvm,
      tienePromocion: tienePromocionActiva,
      discountPercentage,
      porcentajeAdicional: PORCENTAJE_ADICIONAL
    };

    addToCart(productToAdd, quantityQvm);
    openCart();
    onClose();
  };

  return (
    <div className="quickview-modal-qvm">
      <div className="modal-overlay-qvm" onClick={onClose}></div>
      <div className="modal-content-qvm">
        <button className="modal-close-qvm" onClick={onClose}>
          ×
        </button>

        <div className="quickview-content-qvm">
          {/* Galería de imágenes */}
          <div className="quickview-gallery-qvm">
            <div className="main-image-qvm">
              <img 
                src={imagesQvm[selectedImageQvm] || ''} 
                alt={product.nombre}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjAgMTIwSDE0MFYxNDBIMTIwVjEyMFpNMTYwIDEyMEgxODBWMTQwSDE2MFYxMjBaTTIwMCAxMjBIMjIwVjE0MEgyMDBWMTIwWk0xMjAgMTYwSDE0MFYxODBIMTIwVjE2MFpNMTYwIDE2MEgxODBWMTgwSDE2MFYxNjBaTTIwMCAxNjBIMjIwVjE4MEgyMDBWMTYwWk0xMjAgMjAwSDE0MFYyMjBIMTIwVjIwMFpNMTYwIDIwMEgxODBWMjIwSDE2MFYyMDBaTTIwMCAyMDBIMjIwVjIyMEgyMDBWMjAwWiIgZmlsbD0iI0RERURGMCIvPgo8dGV4dCB4PSIyMDAiIHk9IjI0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTY5Njk2IiB0ZXh0LWFuY2hvcj9taWRkbGUiPkltYWdlbiBObyBEaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4=';
                }}
              />
              {tienePromocionActiva && (
                <div className="promotion-badge-qvm">
                  -{discountPercentage}% OFF
                </div>
              )}
            </div>
            
            {imagesQvm.length > 1 && (
              <div className="image-thumbnails-qvm">
                {imagesQvm.map((img, index) => (
                  <button
                    key={index}
                    className={`thumbnail-qvm ${selectedImageQvm === index ? 'active-qvm' : ''}`}
                    onClick={() => setSelectedImageQvm(index)}
                  >
                    <img src={img} alt={`${product.nombre} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="quickview-info-qvm">
            <div className="product-header-qvm">
              <span className="product-brand-qvm">{product.marca}</span>
              <h2 className="product-title-qvm">{product.nombre}</h2>
              <div className="product-codes-qvm">
                <span><strong>Clave:</strong> {product.codigo}</span>
                {product.numParte && <span><strong>Número de parte:</strong> {product.numParte}</span>}
              </div>
            </div>

            <div className="product-pricing-qvm">
              {tienePromocionActiva ? (
                <div className="pricing-with-promo-qvm">
                  <div className="current-price-qvm">
                    <span className="currency-qvm">MXN </span>
                    <span className="price-qvm">${precioPromoMXN}</span>
                  </div>
                  <div className="original-price-qvm">
                    <span className="price-qvm">${precioBaseMXN}</span>
                    <span className="discount-qvm">-{discountPercentage}%</span>
                  </div>
                  <div className="savings-info-qvm">
                    <span className="savings-amount-qvm">Ahorras ${ahorroMXN} MXN</span>
                  </div>
                </div>
              ) : (
                <div className="pricing-normal-qvm">
                  <span className="currency-qvm">MXN </span>
                  <span className="price-qvm">${precioFinalMXN}</span>
                </div>
              )}
            </div>

            <div className="product-description-qvm">
              <p>{product.descripcion || product.descripcion_corta || 'Descripción no disponible'}</p>
            </div>

            {/* Stock */}
            <div className="product-stock-info-qvm">
              {totalStockQvm > 0 ? (
                <span className="in-stock-qvm">✓ En stock ({totalStockQvm} disponibles)</span>
              ) : (
                <span className="out-of-stock-qvm">✗ Agotado</span>
              )}
              
              {totalStockQvm > 0 && product.existencia && typeof product.existencia === 'object' && (
                <div className="stock-locations-quick-qvm">
                  <strong>Disponible en:</strong>
                  <div className="locations-list-qvm">
                    {Object.entries(product.existencia).map(([location, stock]) => {
                      const stockNum = Number(stock) || 0;
                      return stockNum > 0 ? (
                        <div key={location} className="location-item-qvm">
                          <span className="location-name-qvm">{location}:</span>
                          <span className="location-stock-qvm">{stockNum} unidades</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Cantidad y acciones */}
            <div className="product-actions-qvm">
              <div className="quantity-selector-qvm">
                <label>Cantidad:</label>
                <div className="quantity-controls-qvm">
                  <button 
                    onClick={() => handleQuantityChangeQvm(quantityQvm - 1)}
                    disabled={quantityQvm <= 1 || totalStockQvm === 0}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    value={quantityQvm}
                    min="1"
                    max={totalStockQvm}
                    onChange={(e) => handleQuantityChangeQvm(parseInt(e.target.value) || 1)}
                    disabled={totalStockQvm === 0}
                  />
                  <button 
                    onClick={() => handleQuantityChangeQvm(quantityQvm + 1)}
                    disabled={quantityQvm >= totalStockQvm || totalStockQvm === 0}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="action-buttons-qvm">
                <button 
                  className={`btn-add-cart-qvm ${addingToCart ? 'adding-to-cart' : ''}`}
                  onClick={handleAddToCartQvm}
                  disabled={totalStockQvm === 0 || addingToCart}
                >
                  {addingToCart ? (
                    <>
                      <div className="loading-spinner-qvm"></div>
                      Agregando...
                    </>
                  ) : (
                    '🛒 Agregar al Carrito'
                  )}
                </button>
              </div>
            </div>

            {/* Enlace a detalles */}
            <div className="view-details-link-qvm">
              <Link 
                to={productDetailUrl} 
                onClick={onClose}
                className="details-link-qvm"
              >
                Ver detalles completos del producto →
              </Link>
            </div>

            {/* Especificaciones principales */}
            {product.especificaciones && Object.keys(product.especificaciones).length > 0 && (
              <div className="quick-specs-qvm">
                <h4>Especificaciones principales:</h4>
                <div className="specs-grid-qvm">
                  {Object.entries(product.especificaciones)
                    .slice(0, 4)
                    .map(([key, value]) => {
                      const displayValue = getSpecValue(value);
                      return (
                        <div key={key} className="spec-item-qvm">
                          <span className="spec-label-qvm">{key}:</span>
                          <span className="spec-value-qvm">
                            {displayValue || 'N/A'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;