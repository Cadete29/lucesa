import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from '../Product Card/ProductCard';
import { 
  useProductoCombinado, 
  useProductosRelacionados,
  normalizarProducto 
} from '../../api/productosHooks';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import './ProductDetails.css';

// ✅ Configuración de URLs por entorno
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://lucesademexico-shop.com.mx/api/images/code'
  : 'http://localhost:4004/api/images/code';

// ✅ CONFIGURACIÓN DEL PORCENTAJE ADICIONAL (SINCRONIZADA)
const PORCENTAJE_ADICIONAL = 10; // 10% adicional a todos los productos

// ✅ Función para agregar el porcentaje adicional (SINCRONIZADA)
const agregarPorcentajeAdicional = (precio) => {
  if (!precio || typeof precio !== 'number' || isNaN(precio) || precio <= 0) {
    return 0;
  }
  return precio * (1 + (PORCENTAJE_ADICIONAL / 100));
};

// ✅ FUNCIÓN DE CÁLCULO DE PRECIOS SINCRONIZADA
const calcularPreciosConDescuentoSincronizado = (producto) => {
  console.log('🧮 ProductDetails - Iniciando cálculo sincronizado para:', producto?.codigo);
  
  if (!producto) {
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
  
  // ✅ 1. PRECIO BASE EN MXN (del backend) + 10%
  const precioMXNOriginal = producto.precioMXN || 0;
  const precioBaseCon10 = agregarPorcentajeAdicional(precioMXNOriginal);
  
  // ✅ 2. DETECCIÓN DE PROMOCIONES - LÓGICA COMPLETAMENTE SINCRONIZADA
  let precioPromoCon10 = null;
  let tienePromocionActiva = false;
  let discountPercentage = 0;
  
  // A. VERIFICAR SI HAY PROMOCIONES EN EL ARRAY
  if (producto.promociones && producto.promociones.length > 0) {
    // Tomar la primera promoción activa
    const promocionActiva = producto.promociones[0];
    
    if (promocionActiva) {
      // ✅ CORRECCIÓN CRÍTICA: Interpretar correctamente el campo "promocion"
      // Si "tipo" es "porcentaje", entonces "promocion" es el porcentaje (ej: 5 para 5%)
      // Si "tipo" no existe o es otro, "promocion" es el precio directo
      
      if (promocionActiva.tipo === 'porcentaje') {
        // ES PORCENTAJE: calcular descuento porcentual
        const porcentajeDescuento = promocionActiva.promocion;
        
        if (porcentajeDescuento > 0 && porcentajeDescuento < 100) {
          const descuento = (precioMXNOriginal * porcentajeDescuento) / 100;
          const precioConDescuento = precioMXNOriginal - descuento;
          
          // Aplicar 10% adicional al precio con descuento
          precioPromoCon10 = agregarPorcentajeAdicional(precioConDescuento);
          tienePromocionActiva = precioPromoCon10 < precioBaseCon10;
          
          if (tienePromocionActiva) {
            discountPercentage = Math.round(((precioBaseCon10 - precioPromoCon10) / precioBaseCon10) * 100);
          }
        }
      } else {
        // ES PRECIO DIRECTO: usar el valor como precio promocional
        const precioPromocionalDirecto = promocionActiva.promocion;
        
        if (precioPromocionalDirecto > 0 && precioPromocionalDirecto < precioMXNOriginal) {
          const porcentajePromocion = (precioPromocionalDirecto / precioMXNOriginal) * 100;
          
          // ✅ IGNORAR PROMOCIONES SOSPECHOSAS
          if (porcentajePromocion >= 10 && porcentajePromocion <= 90) {
            precioPromoCon10 = agregarPorcentajeAdicional(precioPromocionalDirecto);
            tienePromocionActiva = true;
            discountPercentage = Math.round(((precioBaseCon10 - precioPromoCon10) / precioBaseCon10) * 100);
          }
        }
      }
    }
  }
  
  // B. VERIFICAR precioPromocionMXN del backend
  if (!tienePromocionActiva && 
      producto.precioPromocionMXN !== undefined && 
      producto.precioPromocionMXN !== null && 
      producto.precioPromocionMXN > 0 &&
      producto.precioPromocionMXN < precioMXNOriginal) {
    
    const porcentajePromocion = (producto.precioPromocionMXN / precioMXNOriginal) * 100;
    
    // ✅ IGNORAR PROMOCIONES SOSPECHOSAS
    if (porcentajePromocion >= 10 && porcentajePromocion <= 90) {
      precioPromoCon10 = agregarPorcentajeAdicional(producto.precioPromocionMXN);
      tienePromocionActiva = true;
      discountPercentage = Math.round(((precioBaseCon10 - precioPromoCon10) / precioBaseCon10) * 100);
    }
  }
  
  // C. VERIFICAR precioPromocion directo
  if (!tienePromocionActiva && 
      producto.precioPromocion && 
      producto.precioPromocion > 0 &&
      producto.precioPromocion < precioMXNOriginal) {
    
    const porcentajePromocion = (producto.precioPromocion / precioMXNOriginal) * 100;
    
    if (porcentajePromocion >= 10 && porcentajePromocion <= 90) {
      precioPromoCon10 = agregarPorcentajeAdicional(producto.precioPromocion);
      tienePromocionActiva = true;
      discountPercentage = Math.round(((precioBaseCon10 - precioPromoCon10) / precioBaseCon10) * 100);
    }
  }

  // ✅ 3. Formatear precios
  const formatearPrecio = (precio) => {
    if (typeof precio !== 'number' || isNaN(precio) || precio <= 0) return '0.00';
    return precio.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // ✅ 4. Calcular ahorro
  const ahorroMXN = tienePromocionActiva && precioPromoCon10 ? 
      (precioBaseCon10 - precioPromoCon10) : 0;

  // ✅ 5. Determinar precio final
  const precioFinalMXNValor = tienePromocionActiva && precioPromoCon10 ? 
      precioPromoCon10 : precioBaseCon10;

  return {
    tienePromocionActiva,
    precioBaseMXN: formatearPrecio(precioBaseCon10),
    precioPromoMXN: tienePromocionActiva ? formatearPrecio(precioPromoCon10) : null,
    discountPercentage,
    precioFinalMXN: formatearPrecio(precioFinalMXNValor),
    ahorroMXN: formatearPrecio(ahorroMXN),
    porcentajeAdicional: PORCENTAJE_ADICIONAL,
    monedaOriginal: producto.moneda || 'USD'
  };
};

// ✅ HOOK: Obtener múltiples imágenes de un producto
const useProductImages = (codigo) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!codigo || codigo === 'N/A') {
      setImages([]);
      setLoading(false);
      return;
    }

    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // SOLUCIÓN SIMPLE: Primero intentar obtener todas las imágenes
        const allImagesResponse = await fetch(`${IMAGE_BASE_URL}/${codigo}/all`);
        
        if (!allImagesResponse.ok) {
          throw new Error(`Error HTTP: ${allImagesResponse.status}`);
        }
        
        const allImagesData = await allImagesResponse.json();
        
        if (allImagesData.success && allImagesData.availableImages && allImagesData.availableImages.length > 0) {
          // ✅ SOLUCIÓN DEFINITIVA: Usar la misma imagen para URL y miniatura
          const imageUrls = allImagesData.availableImages.map(img => {
            const imageUrl = `${IMAGE_BASE_URL}/${codigo}?index=${img.index}`;
            
            return {
              url: imageUrl,
              thumbnailUrl: imageUrl,
              index: img.index,
              isProxy: true,
              hasThumbnail: false
            };
          });
          
          setImages(imageUrls);
        } else {
          // Si no hay imágenes múltiples, usar solo la principal
          const singleImage = {
            url: `${IMAGE_BASE_URL}/${codigo}`,
            thumbnailUrl: `${IMAGE_BASE_URL}/${codigo}`,
            index: 0,
            isProxy: true,
            hasThumbnail: false
          };
          
          setImages([singleImage]);
        }
      } catch (err) {
        console.error('❌ ProductDetails - Error cargando imágenes:', err);
        setError(err.message);
        
        // Imagen de fallback SVG
        const fallbackSVG = generateFallbackSVG(codigo);
        const fallbackSmallSVG = generateFallbackSVG(codigo, 'small');
        
        setImages([{
          url: 'data:image/svg+xml;base64,' + btoa(fallbackSVG),
          thumbnailUrl: 'data:image/svg+xml;base64,' + btoa(fallbackSmallSVG),
          index: 0,
          isProxy: false,
          isFallback: true,
          hasThumbnail: false
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [codigo]);

  return { images, loading, error };
};

// ✅ Función para generar SVG de fallback
const generateFallbackSVG = (codigo, size = 'normal') => {
  const width = size === 'small' ? 100 : 400;
  const height = size === 'small' ? 75 : 300;
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="#f8f9fa"/>
    <rect x="80" y="80" width="240" height="140" fill="#e9ecef" rx="8"/>
    <circle cx="200" cy="150" r="30" fill="#adb5bd"/>
    <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6c757d">
      ${codigo || 'N/A'}
    </text>
    <text x="200" y="245" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#495057">
      Imagen no disponible
    </text>
  </svg>`;
};

const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [imageErrors, setImageErrors] = useState(new Set());
    const [showCartNotification, setShowCartNotification] = useState(false);
    const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);
    const [zoomImage, setZoomImage] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const [sidebarState, setSidebarState] = useState({ expanded: true, hidden: false });

    // Usar contextos
    const { addToCart, openCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();

    // ✅ DETECTAR ESTADO DEL SIDEBAR
    useEffect(() => {
        const checkSidebarState = () => {
            const sidebar = document.querySelector('.sidebar-categories');
            if (sidebar) {
                const isExpanded = sidebar.classList.contains('expanded');
                const isCollapsed = sidebar.classList.contains('collapsed');
                const isHidden = sidebar.style.display === 'none' || 
                                sidebar.style.visibility === 'hidden' ||
                                window.getComputedStyle(sidebar).display === 'none';
                
                setSidebarState({
                    expanded: isExpanded && !isHidden,
                    collapsed: isCollapsed && !isHidden,
                    hidden: isHidden
                });
            }
        };

        // Verificar inicialmente
        checkSidebarState();

        // Configurar observador para cambios en el sidebar
        const observer = new MutationObserver(checkSidebarState);
        const sidebar = document.querySelector('.sidebar-categories');
        
        if (sidebar) {
            observer.observe(sidebar, { 
                attributes: true, 
                attributeFilter: ['class', 'style'] 
            });
        }

        // Verificar en redimensiones de ventana
        window.addEventListener('resize', checkSidebarState);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', checkSidebarState);
        };
    }, []);

    // ✅ USAR EL HOOK COMBIANDO
    const { data: productResponse, loading, error } = useProductoCombinado(productId);
    
    // ✅ Normalizar el producto
    const productoNormalizado = useMemo(() => {
        if (!productResponse?.data) return null;
        
        const normalizado = normalizarProducto(productResponse.data);
        
        // ✅ Asegurar que el código esté en mayúsculas
        if (normalizado && normalizado.codigo) {
            normalizado.codigo = normalizado.codigo.trim().toUpperCase();
        }
        
        return normalizado;
    }, [productResponse, productId]);

    // ✅ Obtener todas las imágenes del producto
    const { images: productImages, loading: imagesLoading } = useProductImages(productoNormalizado?.codigo);

    // ✅ CALCULOS DE PRECIOS (USANDO FUNCIÓN SINCRONIZADA)
    const productCalculations = useMemo(() => {
        if (!productoNormalizado) {
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
        
        return calcularPreciosConDescuentoSincronizado(productoNormalizado);
    }, [productoNormalizado]);

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

    // ✅ VERIFICAR SI ES FAVORITO
    const productIsFavorite = useMemo(() => {
        if (!productoNormalizado) return false;
        return isFavorite(productoNormalizado.id);
    }, [productoNormalizado, isFavorite]);

    // ✅ MANEJAR FAVORITOS
    const handleToggleFavorite = useCallback(async () => {
        if (!productoNormalizado || isAddingToFavorites) return;
        
        setIsAddingToFavorites(true);
        try {
            await toggleFavorite(productoNormalizado);
        } catch (error) {
            console.error('❌ ProductDetails - Error al actualizar favorito:', error);
            alert('Error al actualizar favoritos: ' + error.message);
        } finally {
            setIsAddingToFavorites(false);
        }
    }, [productoNormalizado, toggleFavorite, productIsFavorite, isAddingToFavorites]);

    // ✅ USAR HOOK DE PRODUCTOS RELACIONADOS
    const { data: relatedProductsData, loading: loadingRelated } = useProductosRelacionados(
        productoNormalizado, 
        5
    );

    const relatedProducts = useMemo(() => {
        if (!relatedProductsData?.data) return [];
        
        const procesados = relatedProductsData.data.map(product => {
            const normalizado = normalizarProducto(product);
            return normalizado;
        }).filter(Boolean);
        
        return procesados;
    }, [relatedProductsData]);

    // ✅ STOCK TOTAL
    const getTotalStock = useCallback(() => {
        if (!productoNormalizado) return 0;

        const existencia = productoNormalizado.existencia || 0;
        
        if (existencia === undefined || existencia === null || existencia === '') {
            return 0;
        }

        if (existencia === 0 || existencia === '0') {
            return 0;
        }

        let stockCalculado = 0;

        try {
            if (typeof existencia === 'number') {
                stockCalculado = existencia;
            } else if (typeof existencia === 'string') {
                stockCalculado = Number(existencia) || 0;
            } else if (typeof existencia === 'object' && existencia !== null) {
                const valores = Object.values(existencia);
                stockCalculado = valores.reduce((total, stock) => {
                    const stockNum = Number(stock);
                    return total + (isNaN(stockNum) ? 0 : stockNum);
                }, 0);
            }
        } catch (error) {
            console.error('💥 ProductDetails - Error calculando stock:', error);
            stockCalculado = 0;
        }

        return stockCalculado;
    }, [productoNormalizado]);

    const totalStock = useMemo(() => getTotalStock(), [getTotalStock]);

    // ✅ MANEJAR CANTIDAD
    const handleQuantityChange = useCallback((value) => {
        if (value < 1) {
            setQuantity(1);
            return;
        }
        
        if (totalStock > 0 && value > totalStock) {
            setQuantity(totalStock);
            return;
        }
        
        const newQuantity = Math.max(1, Math.min(value, totalStock || 1));
        setQuantity(newQuantity);
    }, [totalStock]);

    const handleInputChange = useCallback((e) => {
        const value = parseInt(e.target.value) || 1;
        handleQuantityChange(value);
    }, [handleQuantityChange]);

    const handleDecrement = useCallback(() => {
        setQuantity(prev => Math.max(1, prev - 1));
    }, []);

    const handleIncrement = useCallback(() => {
        setQuantity(prev => totalStock > 0 ? Math.min(prev + 1, totalStock) : prev + 1);
    }, [totalStock]);

    // ✅ MANEJAR QUICK VIEW DE PRODUCTOS RELACIONADOS
    const handleQuickView = useCallback((relatedProduct) => {
        const productId = relatedProduct.idProducto || relatedProduct.id || relatedProduct.codigo;
        navigate(`/product/${productId}`);
    }, [navigate]);

    // ✅ FORMATO DE FECHAS
    const formatDate = useCallback((dateString) => {
        if (!dateString) return 'Fecha no disponible';
        try {
            return new Date(dateString).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Fecha no disponible';
        }
    }, []);

    // ✅ AGREGAR AL CARRITO (CON 10% INCLUIDO)
    const handleAddToCart = useCallback(() => {
        if (!productoNormalizado) return;
        
        const precioFinalNumerico = tienePromocionActiva && precioPromoMXN ? 
            parseFloat(precioPromoMXN.replace(/,/g, '')) : 
            parseFloat(precioFinalMXN.replace(/,/g, ''));
        
        const cartItem = {
            ...productoNormalizado,
            quantity,
            precioFinal: precioFinalNumerico,
            precioCon10Porciento: precioFinalNumerico,
            id: productoNormalizado.id,
            codigo: productoNormalizado.codigo,
            nombre: productoNormalizado.nombre,
            precio: precioFinalNumerico,
            precioOriginal: productoNormalizado.precio,
            tienePromocion: tienePromocionActiva,
            porcentajeDescuento: discountPercentage,
            stock: totalStock,
            disponible: productoNormalizado.disponible,
            porcentajeAdicional: PORCENTAJE_ADICIONAL,
            monedaOriginal: monedaOriginal
        };
        
        // Usar la función del contexto
        addToCart(cartItem, quantity);
        
        // Mostrar notificación
        setShowCartNotification(true);
        setTimeout(() => setShowCartNotification(false), 3000);
    }, [productoNormalizado, quantity, tienePromocionActiva, precioPromoMXN, precioFinalMXN, discountPercentage, totalStock, addToCart, monedaOriginal]);

    // ✅ COMPRAR AHORA
    const handleBuyNow = useCallback(() => {
        handleAddToCart();
        navigate('/cart');
    }, [handleAddToCart, navigate]);

    // ✅ MANEJO DE IMÁGENES
    const handleImageSelect = useCallback((index) => {
        setSelectedImage(index);
        setZoomImage(false);
    }, []);

    const handleNextImage = useCallback(() => {
        if (productImages.length > 1) {
            setSelectedImage((prev) => (prev + 1) % productImages.length);
            setZoomImage(false);
        }
    }, [productImages.length]);

    const handlePrevImage = useCallback(() => {
        if (productImages.length > 1) {
            setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length);
            setZoomImage(false);
        }
    }, [productImages.length]);

    const handleImageError = useCallback((e, imageIndex) => {
        setImageErrors(prev => {
            const newErrors = new Set(prev);
            newErrors.add(imageIndex);
            return newErrors;
        });
        
        e.target.src = 'data:image/svg+xml;base64,' + btoa(generateFallbackSVG(productoNormalizado?.codigo || 'N/A'));
        e.target.onerror = null;
    }, [productoNormalizado?.codigo]);

    // ✅ MANEJO DE ERRORES EN MINIATURAS
    const handleThumbnailError = useCallback((e, img, index) => {
        // Si es una imagen de fallback, no hacer nada
        if (img.isFallback) return;
        
        // Intentar usar la URL principal si la miniatura falla
        if (e.target.src !== img.url) {
            e.target.src = img.url;
            e.target.onerror = null;
        } else {
            // Si también falla la imagen principal, mostrar fallback
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent) {
                parent.innerHTML = `
                    <div class="prod-details-thumbnail-fallback">
                        <span>📷</span>
                        <small>${index + 1}</small>
                    </div>
                `;
            }
        }
    }, []);

    // ✅ ZOOM DE IMAGEN
    const handleImageMouseMove = useCallback((e) => {
        if (!zoomImage) return;
        
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        
        setZoomPosition({ x, y });
    }, [zoomImage]);

    const handleZoomToggle = useCallback(() => {
        setZoomImage(!zoomImage);
    }, [zoomImage]);

    // ✅ COMPARTIR PRODUCTO
    const handleShareProduct = useCallback(() => {
        if (!productoNormalizado) return;
        
        const shareUrl = window.location.href;
        const shareText = `Mira este producto: ${productoNormalizado.nombre} - $${precioFinalMXN} MXN`;
        
        if (navigator.share) {
            navigator.share({
                title: productoNormalizado.nombre,
                text: shareText,
                url: shareUrl,
            })
            .then(() => console.log('✅ Producto compartido'))
            .catch((error) => console.log('❌ Error compartiendo:', error));
        } else {
            navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
            alert('✅ Enlace copiado al portapapeles');
        }
    }, [productoNormalizado, precioFinalMXN]);

    // ✅ RENDERIZADO CONDICIONAL
    if (loading) {
        return (
            <div className="prod-details-loading">
                <div className="prod-details-loading-spinner"></div>
                <p>Cargando producto...</p>
                <small>Aplicando {PORCENTAJE_ADICIONAL}% adicional al precio</small>
            </div>
        );
    }

    if (error || !productoNormalizado) {
        return (
            <div className="prod-details-not-found">
                <div className="prod-details-error-icon">❌</div>
                <h2>Producto no encontrado</h2>
                <p>{error?.message || 'El producto que buscas no está disponible.'}</p>
                <div className="prod-details-not-found-actions">
                    <Link to="/products" className="prod-details-btn-primary">
                        Volver a Productos
                    </Link>
                    <button onClick={() => window.location.reload()} className="prod-details-btn-secondary">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`prod-details-page ${sidebarState.hidden ? 'sidebar-hidden' : ''} ${sidebarState.expanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
            {/* Notificación de carrito */}
            {showCartNotification && (
                <div className="cart-notification">
                    <div className="cart-notification-content">
                        <span className="cart-notification-icon">✅</span>
                        <div className="cart-notification-text">
                            <strong>¡Producto agregado!</strong>
                            <span>{quantity} x {productoNormalizado.nombre} agregado al carrito</span>
                            <small>Precio incluye {PORCENTAJE_ADICIONAL}% adicional</small>
                        </div>
                        <button 
                            className="cart-notification-view"
                            onClick={() => {
                                openCart();
                                setShowCartNotification(false);
                            }}
                        >
                            Ver Carrito
                        </button>
                        <button 
                            className="cart-notification-close"
                            onClick={() => setShowCartNotification(false)}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="prod-details-container">
                {/* Migas de pan */}
                <nav className="prod-details-breadcrumb">
                    <Link to="/">Inicio</Link>
                    <span> / </span>
                    <Link to="/products">Productos</Link>
                    <span> / </span>
                    <Link to={`/products?category=${encodeURIComponent(productoNormalizado.categoria || 'todos')}`}>
                        {productoNormalizado.categoria || 'Categoría'}
                    </Link>
                    <span> / </span>
                    <span className="prod-details-current">{productoNormalizado.nombre}</span>
                </nav>

                <div className="prod-details-content">
                    {/* ✅ Galería de imágenes */}
                    <div className="prod-details-gallery">
                        <div className="prod-details-main-image-container">
                            {/* Controles de navegación si hay múltiples imágenes */}
                            {productImages.length > 1 && (
                                <>
                                    <button 
                                        className="prod-details-gallery-nav prod-details-gallery-prev"
                                        onClick={handlePrevImage}
                                        aria-label="Imagen anterior"
                                    >
                                        ‹
                                    </button>
                                    <button 
                                        className="prod-details-gallery-nav prod-details-gallery-next"
                                        onClick={handleNextImage}
                                        aria-label="Siguiente imagen"
                                    >
                                        ›
                                    </button>
                                    <div className="prod-details-gallery-counter">
                                        {selectedImage + 1} / {productImages.length}
                                    </div>
                                </>
                            )}
                            
                            {/* Controles de zoom y acciones */}
                            <div className="prod-details-image-actions">
                                <button 
                                    className="prod-details-image-action-btn"
                                    onClick={handleZoomToggle}
                                    title={zoomImage ? 'Desactivar zoom' : 'Activar zoom'}
                                >
                                    {zoomImage ? '🔍' : '🔎'}
                                </button>
                                <button 
                                    className="prod-details-image-action-btn"
                                    onClick={handleShareProduct}
                                    title="Compartir producto"
                                >
                                    📤
                                </button>
                            </div>
                            
                            <div 
                                className={`prod-details-main-image ${zoomImage ? 'prod-details-image-zoomed' : ''}`}
                                onMouseMove={handleImageMouseMove}
                                onMouseLeave={() => setZoomImage(false)}
                            >
                                {imagesLoading ? (
                                    <div className="prod-details-image-loading">
                                        <div className="prod-details-loading-spinner"></div>
                                        <p>Cargando imagen...</p>
                                    </div>
                                ) : productImages.length > 0 ? (
                                    <>
                                        <img 
                                            src={productImages[selectedImage]?.url} 
                                            alt={`${productoNormalizado.nombre} - Imagen ${selectedImage + 1}`}
                                            onError={(e) => handleImageError(e, selectedImage)}
                                            crossOrigin="anonymous"
                                            loading="lazy"
                                            style={{
                                                transform: zoomImage ? 'scale(2)' : 'scale(1)',
                                                transformOrigin: zoomImage ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center'
                                            }}
                                        />
                                        {zoomImage && (
                                            <div className="prod-details-zoom-hint">
                                                 Mueve el cursor para explorar la imagen
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="prod-details-no-image">
                                        <div className="prod-details-no-image-icon"></div>
                                        <p>Imagen no disponible</p>
                                        <small>{productoNormalizado.codigo}</small>
                                    </div>
                                )}
                                
                                {/* ✅ Badge de promoción */}
                                {tienePromocionActiva && discountPercentage > 0 && discountPercentage < 99 && (
                                    <div className="prod-details-promotion-badge-large" title={`Descuento del ${discountPercentage}%`}>
                                        -{discountPercentage}%
                                    </div>
                                )}
                                
                                {/* ✅ Badge de agotado */}
                                {totalStock <= 0 && (
                                    <div className="prod-details-out-of-stock-badge">
                                        AGOTADO
                                    </div>
                                )}
                                
                                {/* ✅ Botón de favoritos */}
                                <button 
                                    className={`prod-details-favorite-btn ${productIsFavorite ? 'prod-details-favorite-active' : ''} ${isAddingToFavorites ? 'prod-details-favorite-loading' : ''}`}
                                    onClick={handleToggleFavorite}
                                    disabled={isAddingToFavorites}
                                    title={productIsFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                >
                                    {isAddingToFavorites ? (
                                        <div className="prod-details-favorite-spinner"></div>
                                    ) : (
                                        <svg 
                                            viewBox="0 0 24 24" 
                                            fill={productIsFavorite ? 'currentColor' : 'none'} 
                                            stroke="currentColor"
                                        >
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        {/* ✅ Miniaturas */}
                        {productImages.length > 1 && (
                            <div className="prod-details-image-thumbnails">
                                {productImages.map((img, index) => {
                                    const imageToUse = img.isFallback ? img.thumbnailUrl : img.url;
                                    
                                    return (
                                        <button
                                            key={index}
                                            className={`prod-details-thumbnail ${selectedImage === index ? 'prod-details-thumbnail-active' : ''}`}
                                            onClick={() => handleImageSelect(index)}
                                            aria-label={`Ver imagen ${index + 1}`}
                                        >
                                            {img.isFallback ? (
                                                <div className="prod-details-thumbnail-fallback">
                                                    <span></span>
                                                    <small>{index + 1}</small>
                                                </div>
                                            ) : (
                                                <img 
                                                    src={imageToUse} 
                                                    alt={`Miniatura ${index + 1}`}
                                                    onError={(e) => handleThumbnailError(e, img, index)}
                                                    crossOrigin="anonymous"
                                                    loading="lazy"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* ✅ Si solo hay una imagen, mostrar nota */}
                        {!imagesLoading && productImages.length === 1 && (
                            <div className="prod-details-single-image-note">
                                <small>Este producto tiene 1 imagen disponible</small>
                            </div>
                        )}
                    </div>

                    {/* ✅ Información principal del producto - MANTENIENDO EL DISEÑO ORIGINAL */}
                    <div className="prod-details-info-main">
                        {/* ✅ Encabezado - DISEÑO ORIGINAL */}
                        <div className="prod-details-header">
                            <span className="prod-details-brand">{productoNormalizado.marca}</span>
                            <h1 className="prod-details-title">{productoNormalizado.nombre}</h1>
                            <div className="prod-details-codes">
                                <span><strong>Clave:</strong> {productoNormalizado.codigo}</span>
                                {productoNormalizado.numParte && <span><strong>Número de parte:</strong> {productoNormalizado.numParte}</span>}
                            </div>
                        </div>

                        {/* ✅ Categorías - DISEÑO ORIGINAL */}
                        <div className="prod-details-categories">
                            <span className="prod-details-category-badge">
                                {productoNormalizado.categoria}
                            </span>
                            {productoNormalizado.subcategoria && productoNormalizado.subcategoria !== productoNormalizado.categoria && (
                                <span className="prod-details-category-badge">
                                    {productoNormalizado.subcategoria}
                                </span>
                            )}
                        </div>

                        {/* ✅ Precios - DISEÑO ORIGINAL pero con precios sincronizados */}
                        <div className="prod-details-pricing">
                            {tienePromocionActiva && discountPercentage > 0 && discountPercentage < 99 && precioPromoMXN ? (
                                <div className="prod-details-pricing-with-promo">
                                    <div className="prod-details-current-price">
                                        <span className="prod-details-currency">MXN </span>
                                        <span className="prod-details-price">${precioPromoMXN}</span>
                                    </div>
                                    <div className="prod-details-original-price">
                                        <span className="prod-details-price">${precioBaseMXN}</span>
                                        <span className="prod-details-discount">-{discountPercentage}%</span>
                                    </div>
                                    <div className="prod-details-savings-info">
                                        <span className="prod-details-savings-amount">Ahorras ${ahorroMXN} MXN</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="prod-details-pricing-normal">
                                    <span className="prod-details-currency">MXN </span>
                                    <span className="prod-details-price">${precioFinalMXN}</span>
                                </div>
                            )}
                            
                            {/* ✅ Información del porcentaje adicional */}
                            {/* <div className="prod-details-additional-percentage">
                                <small>
                                    <em>(Incluye {PORCENTAJE_ADICIONAL}% adicional)</em>
                                </small>
                            </div> */}
                        </div>

                        {/* ✅ Descripción corta - DISEÑO ORIGINAL */}
                        <div className="prod-details-description-short">
                            <p>{productoNormalizado.descripcion || productoNormalizado.descripcion_corta || 'Descripción no disponible'}</p>
                        </div>

                        {/* ✅ Stock - DISEÑO ORIGINAL */}
                        <div className="prod-details-stock-info">
                            {totalStock > 0 ? (
                                <span className="prod-details-in-stock">✓ En stock ({totalStock} disponibles)</span>
                            ) : (
                                <span className="prod-details-out-of-stock">✗ Agotado</span>
                            )}
                            
                            {totalStock > 0 && productoNormalizado.existencia && typeof productoNormalizado.existencia === 'object' && (
                                <div className="prod-details-stock-locations">
                                    <details>
                                        <summary>
                                            <strong>Disponible en:</strong>
                                        </summary>
                                        <div className="prod-details-locations-list">
                                            {Object.entries(productoNormalizado.existencia).map(([location, stock]) => {
                                                const stockNum = Number(stock) || 0;
                                                return stockNum > 0 ? (
                                                    <div key={location} className="prod-details-location-item">
                                                        <span className="prod-details-location-name">{location}:</span>
                                                        <span className="prod-details-location-stock">{stockNum} unidades</span>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    </details>
                                </div>
                            )}
                        </div>

                        {/* ✅ Cantidad y acciones - DISEÑO ORIGINAL */}
                        <div className="prod-details-actions">
                            <div className="prod-details-quantity-selector">
                                <label>Cantidad:</label>
                                <div className="prod-details-quantity-controls">
                                    <button 
                                        onClick={() => handleQuantityChange(quantity - 1)}
                                        disabled={quantity <= 1 || totalStock === 0}
                                        className="prod-details-quantity-btn"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number" 
                                        value={quantity}
                                        min="1"
                                        max={totalStock}
                                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                        disabled={totalStock === 0}
                                        className="prod-details-quantity-input"
                                    />
                                    <button 
                                        onClick={() => handleQuantityChange(quantity + 1)}
                                        disabled={quantity >= totalStock || totalStock === 0}
                                        className="prod-details-quantity-btn"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="prod-details-action-buttons">
                                <button 
                                    className={`prod-details-btn-add-cart ${totalStock === 0 ? 'disabled' : ''}`}
                                    onClick={handleAddToCart}
                                    disabled={totalStock === 0}
                                >
                                    {totalStock === 0 ? (
                                        'Agotado'
                                    ) : (
                                        ' Agregar al Carrito'
                                    )}
                                </button>
                                <button 
                                    className="prod-details-btn-buy-now"
                                    onClick={handleBuyNow}
                                    disabled={totalStock === 0}
                                >
                                    Comprar Ahora
                                </button>
                            </div>
                            
                            {/* ✅ Botón de favoritos en línea con los otros botones */}
                            <div className="prod-details-wishlist-container">
                                <button 
                                    className={`prod-details-btn-wishlist ${productIsFavorite ? 'active' : ''}`}
                                    onClick={handleToggleFavorite}
                                    disabled={isAddingToFavorites}
                                >
                                    {isAddingToFavorites ? (
                                        <div className="prod-details-favorite-spinner-small"></div>
                                    ) : productIsFavorite ? (
                                        ' En Favoritos'
                                    ) : (
                                        ' Añadir a Favoritos'
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ✅ Información adicional - DISEÑO ORIGINAL */}
                        <div className="prod-details-meta-info">
                            {productoNormalizado.ultimaActualizacion && (
                                <div className="prod-details-update-info">
                                    <strong>Última actualización:</strong>{' '}
                                    {formatDate(productoNormalizado.ultimaActualizacion)}
                                </div>
                            )}
                        </div>

                        {/* ✅ Envío y garantías - DISEÑO ORIGINAL */}
                        <div className="prod-details-shipping-preview">
                            <div className="prod-details-shipping-item">
                                
                                <div>
                                    <strong>Envío gratis</strong> en compras mayores a $1000 MXN
                                </div>
                            </div>
                            <div className="prod-details-shipping-item">
                                
                                <div>
                                    <strong>30 días</strong> para devoluciones
                                </div>
                            </div>
                            <div className="prod-details-shipping-item">
                                {/* <span className="prod-details-shipping-icon"></span> */}
                                <div>
                                    <strong>Garantía</strong> incluida
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✅ Tabs de información detallada - DISEÑO ORIGINAL */}
                <div className="prod-details-tabs">
                    <div className="prod-details-tab-headers">
                        <button 
                            className={`prod-details-tab-header ${activeTab === 'description' ? 'prod-details-tab-header-active' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Descripción
                        </button>
                        <button 
                            className={`prod-details-tab-header ${activeTab === 'specifications' ? 'prod-details-tab-header-active' : ''}`}
                            onClick={() => setActiveTab('specifications')}
                        >
                            Especificaciones
                        </button>
                        <button 
                            className={`prod-details-tab-header ${activeTab === 'details' ? 'prod-details-tab-header-active' : ''}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Detalles
                        </button>
                        <button 
                            className={`prod-details-tab-header ${activeTab === 'pricing' ? 'prod-details-tab-header-active' : ''}`}
                            onClick={() => setActiveTab('pricing')}
                        >
                            Precios
                        </button>
                        <button 
                            className={`prod-details-tab-header ${activeTab === 'images' ? 'prod-details-tab-header-active' : ''}`}
                            onClick={() => setActiveTab('images')}
                        >
                            Imágenes ({productImages.length})
                        </button>
                    </div>

                    <div className="prod-details-tab-content">
                        {/* ✅ Descripción - DISEÑO ORIGINAL */}
                        {activeTab === 'description' && (
                            <div className="prod-details-tab-panel">
                                <h3>Descripción del Producto</h3>
                                <p>{productoNormalizado.descripcion || productoNormalizado.descripcion_corta || 'Descripción no disponible'}</p>
                            </div>
                        )}

                        {/* ✅ Especificaciones - DISEÑO ORIGINAL */}
                        {activeTab === 'specifications' && (
                            <div className="prod-details-tab-panel">
                                <h3>Especificaciones Técnicas</h3>
                                <div className="prod-details-specifications-grid">
                                    {productoNormalizado.especificaciones && productoNormalizado.especificaciones.length > 0 ? (
                                        productoNormalizado.especificaciones.map((spec, index) => (
                                            <div key={index} className="prod-details-spec-item">
                                                <span className="prod-details-spec-label">{spec.tipo || `Especificación ${index + 1}`}:</span>
                                                <span className="prod-details-spec-value">{spec.valor}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="prod-details-no-specifications">
                                            <p>No hay especificaciones técnicas disponibles para este producto.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ✅ Detalles - DISEÑO ORIGINAL */}
                        {activeTab === 'details' && (
                            <div className="prod-details-tab-panel">
                                <h3>Detalles del Producto</h3>
                                <div className="prod-details-details-grid">
                                    <div className="prod-details-detail-item">
                                        <span className="prod-details-detail-label">Código:</span>
                                        <span className="prod-details-detail-value">{productoNormalizado.codigo}</span>
                                    </div>
                                    {productoNormalizado.ean && (
                                        <div className="prod-details-detail-item">
                                            <span className="prod-details-detail-label">EAN:</span>
                                            <span className="prod-details-detail-value">{productoNormalizado.ean}</span>
                                        </div>
                                    )}
                                    {productoNormalizado.upc && (
                                        <div className="prod-details-detail-item">
                                            <span className="prod-details-detail-label">UPC:</span>
                                            <span className="prod-details-detail-value">{productoNormalizado.upc}</span>
                                        </div>
                                    )}
                                    {productoNormalizado.sustituto && (
                                        <div className="prod-details-detail-item">
                                            <span className="prod-details-detail-label">Sustituto:</span>
                                            <span className="prod-details-detail-value">{productoNormalizado.sustituto}</span>
                                        </div>
                                    )}
                                    <div className="prod-details-detail-item">
                                        <span className="prod-details-detail-label">Estado:</span>
                                        <span className="prod-details-detail-value">
                                            {productoNormalizado.disponible ? ' Disponible' : ' Agotado'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ✅ Precios - DISEÑO ORIGINAL con información mejorada */}
                        {activeTab === 'pricing' && (
                            <div className="prod-details-tab-panel">
                                <h3>Detalles de Precios</h3>
                                <div className="prod-details-pricing-breakdown">
                                    <div className="prod-details-pricing-item">
                                        <span className="prod-details-pricing-label">Precio final:</span>
                                        <span className="prod-details-pricing-value">
                                            ${precioFinalMXN} MXN
                                        </span>
                                    </div>
                                    
                                    {tienePromocionActiva && (
                                        <>
                                            <div className="prod-details-pricing-item">
                                                <span className="prod-details-pricing-label">Descuento aplicado:</span>
                                                <span className="prod-details-pricing-value">
                                                    -{discountPercentage}%
                                                </span>
                                            </div>
                                            
                                            <div className="prod-details-pricing-item prod-details-pricing-savings">
                                                <span className="prod-details-pricing-label">Total ahorrado:</span>
                                                <span className="prod-details-pricing-value">
                                                    ${ahorroMXN} MXN
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    
                                    <div className="prod-details-pricing-item prod-details-pricing-info">
                                        <span className="prod-details-pricing-label">Información:</span>
                                        <span className="prod-details-pricing-value">
                                            Todos los precios incluyen un {PORCENTAJE_ADICIONAL}% adicional
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ✅ Imágenes - DISEÑO ORIGINAL */}
                        {activeTab === 'images' && (
                            <div className="prod-details-tab-panel">
                                <h3>Galería de Imágenes ({productImages.length})</h3>
                                
                                {productImages.length === 0 ? (
                                    <div className="prod-details-no-images-message">
                                        <div className="prod-details-no-images-icon">📷</div>
                                        <p>Este producto no tiene imágenes disponibles</p>
                                    </div>
                                ) : (
                                    <div className="prod-details-images-grid">
                                        <p>Este producto tiene <strong>{productImages.length} imágenes</strong> disponibles:</p>
                                        <div className="prod-details-all-images">
                                            {productImages.map((img, index) => (
                                                <div 
                                                    key={index}
                                                    className={`prod-details-image-item ${selectedImage === index ? 'prod-details-image-item-active' : ''}`}
                                                    onClick={() => handleImageSelect(index)}
                                                >
                                                    <img 
                                                        src={img.url}
                                                        alt={`${productoNormalizado.nombre} ${index + 1}`}
                                                        loading="lazy"
                                                    />
                                                    <div className="prod-details-image-number">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ✅ Productos relacionados - DISEÑO ORIGINAL */}
                {!loadingRelated && relatedProducts.length > 0 && (
                    <div className="prod-details-related-products">
                        <h2>📦 Productos Relacionados</h2>
                        <div className="prod-details-related-products-grid">
                            {relatedProducts.map(relatedProduct => (
                                <ProductCard 
                                    key={relatedProduct.id} 
                                    product={relatedProduct}
                                    onQuickView={handleQuickView}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ✅ Información de contacto - DISEÑO ORIGINAL */}
                <div className="prod-details-contact-info">
                    <h3>❓ ¿Tienes dudas sobre este producto?</h3>
                    <div className="prod-details-contact-options">
                        <div className="prod-details-contact-option">
                            <span className="prod-details-contact-icon">📞</span>
                            <div>
                                <strong>Llámanos</strong>
                                <p>+52 (56) 1017 7596 / +52 (56) 2739 1455</p>
                                <small>Lunes a Viernes 9:00 - 18:00</small>
                            </div>
                        </div>
                        <div className="prod-details-contact-option">
                            <span className="prod-details-contact-icon">✉️</span>
                            <div>
                                <strong>Escíbenos</strong>
                                <p>atenciónclientes@lucesademexico.com</p>
                                <small>Respuesta en menos de 24h</small>
                            </div>
                        </div>
                        <div className="prod-details-contact-option">
                            <span className="prod-details-contact-icon">💬</span>
                            <div>
                                <strong>Chat en vivo</strong>
                                <p>Disponible 24/7</p>
                                <small>Soporte inmediato</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;