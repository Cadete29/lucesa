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
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

// ✅ CONFIGURACIÓN DEL PORCENTAJE ADICIONAL
const PORCENTAJE_ADICIONAL = 10; // 10% adicional a todos los productos

// ✅ Función para agregar el porcentaje adicional (SINCRONIZADA CON PRODUCTS.JSX)
const agregarPorcentajeAdicional = (precio) => {
  if (!precio || typeof precio !== 'number' || isNaN(precio) || precio <= 0) {
    return 0;
  }
  return precio * (1 + (PORCENTAJE_ADICIONAL / 100));
};

// ✅ FUNCIONES OPTIMIZADAS CON MEMOIZACIÓN (SINCRONIZADAS)
const isDevelopment = process.env.NODE_ENV === 'development';
const log = (...args) => isDevelopment && console.log(...args);
const warn = (...args) => isDevelopment && console.warn(...args);

// ✅ CACHE GLOBAL PARA EVITAR CÁLCULOS REPETIDOS (SINCRONIZADO)
const precioCacheDetails = new Map();
const promocionCacheDetails = new Map();
const procesamientoCacheDetails = new Map();

// ✅ OPTIMIZAR: Usar fecha estática durante la sesión (SINCRONIZADO)
const fechaActualDetails = new Date();

// ✅ OPTIMIZAR: Función rápida para obtener precio con descuento (SINCRONIZADA)
const esPromocionVigenteDetails = (promocion) => {
  if (!promocion || !promocion.vigencia) return false;
  
  const inicio = new Date(promocion.vigencia.inicio);
  const fin = new Date(promocion.vigencia.fin);
  
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return false;
  }
  
  return fechaActualDetails >= inicio && fechaActualDetails <= fin;
};

// ✅ OPTIMIZAR: Función rápida para obtener precio con descuento (SINCRONIZADA)
const obtenerPrecioConDescuentoDetails = (producto, promocion) => {
  const cacheKey = `descuento_details_${producto.codigo}_${JSON.stringify(promocion)}`;
  if (precioCacheDetails.has(cacheKey)) {
    return precioCacheDetails.get(cacheKey);
  }
  
  if (!promocion) {
    precioCacheDetails.set(cacheKey, null);
    return null;
  }
  
  const precioOriginal = producto.precio || 0;
  let precioConDescuento = null;
  
  // Precio directo
  if (promocion.promocion !== undefined && promocion.promocion !== null) {
    const precioPromocional = parseFloat(promocion.promocion);
    if (!isNaN(precioPromocional) && precioPromocional > 0 && precioPromocional < precioOriginal) {
      precioConDescuento = precioPromocional;
    }
  }
  
  // Porcentaje
  if (!precioConDescuento && promocion.tipo === 'porcentaje' && promocion.porcentaje) {
    const porcentaje = parseFloat(promocion.porcentaje);
    if (!isNaN(porcentaje) && porcentaje > 0 && porcentaje < 100) {
      const descuento = (precioOriginal * porcentaje) / 100;
      precioConDescuento = precioOriginal - descuento;
    }
  }
  
  precioCacheDetails.set(cacheKey, precioConDescuento);
  return precioConDescuento;
};

// ✅ OPTIMIZAR: Formateador memoizado (SINCRONIZADO)
const formatearPrecioDetails = (precio) => {
  if (typeof precio !== 'number' || isNaN(precio)) return '0.00';
  return precio.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// ✅ OPTIMIZAR: Función de cálculo de precios ultra-rápida CON 10% ADICIONAL (SINCRONIZADA)
const calcularPreciosConDescuentoDetails = (producto) => {
  const cacheKey = `calculo_details_${producto.codigo}_${producto.precio}_${producto.precioPromocion}_${producto.promociones?.length || 0}_${PORCENTAJE_ADICIONAL}_${producto.moneda}`;
  
  if (promocionCacheDetails.has(cacheKey)) {
    return promocionCacheDetails.get(cacheKey);
  }
  
  if (!producto) {
    const resultado = {
      tienePromocionActiva: false,
      currentPromotion: null,
      precioBaseMXN: '0.00',
      precioPromoMXN: null,
      discountPercentage: 0,
      precioFinalMXN: '0.00',
      ahorroMXN: '0.00',
      tipoPromocion: null,
      porcentajeAdicional: PORCENTAJE_ADICIONAL,
      precioOriginalBase: 0,
      precioOriginalPromo: null,
      precioBaseUSD: 0,
      precioPromoUSD: null,
      monedaOriginal: 'USD',
      tipoCambio: 18.4
    };
    promocionCacheDetails.set(cacheKey, resultado);
    return resultado;
  }

  let promocionActiva = null;
  let mejorDescuento = 0;
  let precioConDescuentoUSD = null;
  let tipoPromocion = null;

  // Verificar promociones en array (solo si existe)
  if (producto.promociones && Array.isArray(producto.promociones)) {
    for (let i = 0; i < producto.promociones.length; i++) {
      const promocion = producto.promociones[i];
      if (esPromocionVigenteDetails(promocion)) {
        const precioDesc = obtenerPrecioConDescuentoDetails(producto, promocion);
        if (precioDesc !== null) {
          const descuento = ((producto.precio - precioDesc) / producto.precio) * 100;
          if (descuento > mejorDescuento) {
            mejorDescuento = descuento;
            promocionActiva = promocion;
            precioConDescuentoUSD = precioDesc;
            tipoPromocion = promocion.tipo || 'directo';
          }
        }
      }
    }
  }

  // Precio promocional directo
  if (!promocionActiva && producto.precioPromocion && producto.precioPromocion > 0) {
    if (producto.precioPromocion < producto.precio) {
      promocionActiva = { tipo: 'directo' };
      precioConDescuentoUSD = producto.precioPromocion;
      mejorDescuento = ((producto.precio - producto.precioPromocion) / producto.precio) * 100;
      tipoPromocion = 'directo';
    }
  }

  const tienePromocionActiva = precioConDescuentoUSD !== null && precioConDescuentoUSD < producto.precio;
  
  // ✅ CORRECCIÓN: CONVERTIR A MXN SI ES NECESARIO
  const tipoCambio = producto.tipo_cambio || producto.tipoCambio || 18.4;
  
  // Convertir precios base a MXN
  const precioBaseOriginalUSD = producto.precio || 0;
  let precioBaseOriginalMXN = producto.precioMXN || 0;
  
  // Si no tenemos precioMXN del backend, convertir de USD
  if (!producto.precioMXN && producto.moneda === 'USD' && precioBaseOriginalUSD > 0) {
    precioBaseOriginalMXN = precioBaseOriginalUSD * tipoCambio;
  }
  
  const precioBaseMXN = agregarPorcentajeAdicional(precioBaseOriginalMXN);
  
  // Convertir precio promocional a MXN
  let precioPromoOriginalMXN = null;
  if (tienePromocionActiva) {
    if (producto.moneda === 'USD') {
      // Convertir de USD a MXN
      precioPromoOriginalMXN = precioConDescuentoUSD * tipoCambio;
    } else {
      // Ya está en MXN
      precioPromoOriginalMXN = precioConDescuentoUSD;
    }
  }
  
  const precioPromoMXN = tienePromocionActiva ? agregarPorcentajeAdicional(precioPromoOriginalMXN) : null;
  
  const discountPercentage = tienePromocionActiva ? Math.round(mejorDescuento) : 0;
  const ahorroMXN = tienePromocionActiva ? (precioBaseMXN - precioPromoMXN) : 0;

  const resultado = {
    tienePromocionActiva,
    currentPromotion: promocionActiva,
    precioBaseMXN: formatearPrecioDetails(precioBaseMXN),
    precioPromoMXN: tienePromocionActiva ? formatearPrecioDetails(precioPromoMXN) : null,
    discountPercentage,
    precioFinalMXN: tienePromocionActiva ? formatearPrecioDetails(precioPromoMXN) : formatearPrecioDetails(precioBaseMXN),
    ahorroMXN: formatearPrecioDetails(ahorroMXN),
    tipoPromocion,
    porcentajeAdicional: PORCENTAJE_ADICIONAL,
    // Precios originales (antes del 10%)
    precioOriginalBase: precioBaseOriginalMXN,
    precioOriginalPromo: precioPromoOriginalMXN,
    precioBaseConIncremento: precioBaseMXN,
    precioPromoConIncremento: precioPromoMXN,
    // Precios en USD para referencia
    precioBaseUSD: precioBaseOriginalUSD,
    precioPromoUSD: precioConDescuentoUSD,
    monedaOriginal: producto.moneda || 'USD',
    tipoCambio: tipoCambio
  };
  
  promocionCacheDetails.set(cacheKey, resultado);
  return resultado;
};

// ✅ OPTIMIZAR: Procesamiento de producto ultra-rápido CON 10% ADICIONAL (SINCRONIZADO)
const procesarProductoDetails = (product) => {
  if (!product) return null;
  
  const cacheKey = `producto_details_${product.codigo}_${product.precio}_${product.precioPromocion}_${product.moneda}_${PORCENTAJE_ADICIONAL}`;
  if (procesamientoCacheDetails.has(cacheKey)) {
    return procesamientoCacheDetails.get(cacheKey);
  }
  
  // Extraer valores una sola vez
  const precio = typeof product.precio === 'number' ? product.precio : 
                typeof product.precio === 'string' ? parseFloat(product.precio) || 0 : 0;
  
  const precioPromocion = typeof product.precioPromocion === 'number' ? product.precioPromocion : 
                         typeof product.precioPromocion === 'string' ? parseFloat(product.precioPromocion) || 0 : 0;
  
  const existencia = typeof product.existencia === 'number' ? product.existencia : 
                    typeof product.existencia === 'string' ? parseInt(product.existencia) || 0 : 
                    typeof product.existenciaTotal === 'number' ? product.existenciaTotal : 
                    typeof product.existenciaTotal === 'string' ? parseInt(product.existenciaTotal) || 0 : 0;
  
  const existenciaTotal = product.existenciaTotal || existencia || 0;
  const tieneExistencia = existenciaTotal > 0;
  
  const moneda = product.moneda || 'USD';
  const tipoCambio = product.tipo_cambio || product.tipoCambio || 18.4;
  
  // ✅ CORRECCIÓN: CONVERTIR A MXN SI ES NECESARIO
  let precioMXNOriginal = product.precioMXN || 0;
  
  // Si no tenemos precioMXN del backend y el precio está en USD, convertirlo
  if (!product.precioMXN && moneda === 'USD' && precio > 0) {
    precioMXNOriginal = precio * tipoCambio;
  }
  
  const precioMXNCon10 = agregarPorcentajeAdicional(precioMXNOriginal);
  
  const productoProcesado = {
    id: product.id || product.idProducto || product.codigo || `prod_${Date.now()}`,
    codigo: product.codigo || 'N/A',
    nombre: product.nombre || 'Producto sin nombre',
    modelo: product.modelo || product.numParte || product.no_parte || '',
    marca: product.marca || 'Sin marca',
    categoria: product.categoria || 'General',
    subcategoria: product.subcategoria || '',
    descripcion_corta: product.descripcion_corta || product.descripcion || '',
    imagen: product.imagen || '',
    precio, // Precio original en su moneda original
    precioPromocion,
    moneda,
    // ✅ PRECIO MXN YA CON 10% ADICIONAL APLICADO (SINCRONIZADO)
    precioMXN: precioMXNCon10,
    precioMXNOriginal: precioMXNOriginal, // Para referencia
    tipo_cambio: tipoCambio,
    especificaciones: Array.isArray(product.especificaciones) ? product.especificaciones : [],
    existencia,
    disponible: product.disponible !== undefined ? Boolean(product.disponible) : tieneExistencia,
    stock: typeof product.stock === 'number' ? product.stock : existencia,
    promociones: Array.isArray(product.promociones) ? product.promociones : [],
    existenciaTotal,
    tieneExistencia,
    imagenFecha: product.imagenFecha || '',
    upc: product.upc || '',
    ean: product.ean || '',
    sustituto: product.sustituto || '',
    status: product.status || (product.activo === 1 ? 'Activo' : 'Inactivo'),
    fuente: product.fuente || 'unknown',
    ultimaActualizacion: product.ultimaActualizacion || new Date().toISOString(),
    almacenes: product.almacenes || {},
    sinStock: existenciaTotal === 0,
    stockBajo: existenciaTotal > 0 && existenciaTotal <= 5,
    stockSuficiente: existenciaTotal > 5,
    porcentajeAdicional: PORCENTAJE_ADICIONAL
  };
  
  // Calcular promoción (ya incluye 10% en precioMXN)
  const calculosPromocion = calcularPreciosConDescuentoDetails(productoProcesado);
  
  productoProcesado.tienePromocion = calculosPromocion.tienePromocionActiva;
  productoProcesado.porcentajeDescuento = calculosPromocion.discountPercentage;
  productoProcesado.precioFinal = calculosPromocion.tienePromocionActiva ? 
    parseFloat(calculosPromocion.precioFinalMXN.replace(/,/g, '')) : precioMXNCon10;
  productoProcesado.precioBaseUSD = calculosPromocion.precioBaseUSD;
  productoProcesado.precioPromoUSD = calculosPromocion.precioPromoUSD;
  
  procesamientoCacheDetails.set(cacheKey, productoProcesado);
  return productoProcesado;
};

// ✅ HOOK: Obtener múltiples imágenes de un producto (VERSIÓN SIMPLIFICADA)
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
        
        console.log('🔍 ProductDetails - Buscando imágenes para:', codigo);
        
        // SOLUCIÓN SIMPLE: Primero intentar obtener todas las imágenes
        const allImagesResponse = await fetch(`${IMAGE_BASE_URL}/${codigo}/all`);
        
        if (!allImagesResponse.ok) {
          throw new Error(`Error HTTP: ${allImagesResponse.status}`);
        }
        
        const allImagesData = await allImagesResponse.json();
        
        console.log('📸 ProductDetails - Datos de imágenes recibidos:', {
          success: allImagesData.success,
          count: allImagesData.count,
          availableImages: allImagesData.availableImages?.length || 0
        });
        
        if (allImagesData.success && allImagesData.availableImages && allImagesData.availableImages.length > 0) {
          // ✅ SOLUCIÓN DEFINITIVA: Usar la misma imagen para URL y miniatura
          // Pero crear URLs diferentes para mantener la estructura
          const imageUrls = allImagesData.availableImages.map(img => {
            // URL para imagen grande (misma para todas)
            const imageUrl = `${IMAGE_BASE_URL}/${codigo}?index=${img.index}`;
            
            return {
              url: imageUrl, // Imagen grande
              thumbnailUrl: imageUrl, // MISMA URL para miniatura (se escala con CSS)
              index: img.index,
              isProxy: true,
              hasThumbnail: false // Indicar que no tenemos miniatura separada
            };
          });
          
          console.log('✅ ProductDetails - URLs procesadas:', imageUrls.length, 'imágenes');
          setImages(imageUrls);
        } else {
          // Si no hay imágenes múltiples, usar solo la principal
          const singleImage = {
            url: `${IMAGE_BASE_URL}/${codigo}`,
            thumbnailUrl: `${IMAGE_BASE_URL}/${codigo}`, // Misma URL
            index: 0,
            isProxy: true,
            hasThumbnail: false
          };
          
          console.log('✅ ProductDetails - Solo imagen principal:', singleImage);
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

    // Usar contextos
    const { addToCart, openCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();

    // ✅ USAR EL HOOK COMBIANDO (RECOMENDADO) - TRAE DATOS DE XML+JSON
    const { data: productResponse, loading, error } = useProductoCombinado(productId);
    
    // ✅ Normalizar el producto con la función sincronizada
    const productoProcesado = useMemo(() => {
        log('🔄 ProductDetails - Procesando producto desde API:', {
            id: productId,
            tieneData: !!productResponse?.data,
            data: productResponse?.data
        });
        
        if (!productResponse?.data) return null;
        
        const normalized = normalizarProducto(productResponse.data);
        const procesadoCon10 = procesarProductoDetails(normalized);
        
        log('✅ ProductDetails - Producto procesado con 10%:', {
            id: procesadoCon10.id,
            codigo: procesadoCon10.codigo,
            nombre: procesadoCon10.nombre,
            moneda: procesadoCon10.moneda,
            precioOriginal: procesadoCon10.precio,
            precioMXNOriginal: procesadoCon10.precioMXNOriginal,
            precioMXNCon10: procesadoCon10.precioMXN,
            existencia: procesadoCon10.existencia,
            especificaciones: procesadoCon10.especificaciones?.length || 0,
            promociones: procesadoCon10.promociones?.length || 0,
            porcentajeAdicional: PORCENTAJE_ADICIONAL
        });
        
        return procesadoCon10;
    }, [productResponse, productId]);

    // ✅ Obtener todas las imágenes del producto
    const { images: productImages, loading: imagesLoading } = useProductImages(productoProcesado?.codigo);

    // ✅ CALCULOS DE PRECIOS (USANDO FUNCIONES SINCRONIZADAS)
    const productCalculations = useMemo(() => {
        if (!productoProcesado) {
            return {
                tienePromocionActiva: false,
                currentPromotion: null,
                precioBaseMXN: '0.00',
                precioPromoMXN: null,
                discountPercentage: 0,
                precioFinalMXN: '0.00',
                ahorroMXN: '0.00',
                porcentajeAdicional: PORCENTAJE_ADICIONAL,
                precioBaseUSD: 0,
                precioPromoUSD: null,
                monedaOriginal: 'USD',
                tipoCambio: 18.4
            };
        }
        
        return calcularPreciosConDescuentoDetails(productoProcesado);
    }, [productoProcesado]);

    const {
        tienePromocionActiva,
        currentPromotion,
        precioBaseMXN,
        precioPromoMXN,
        discountPercentage,
        precioFinalMXN,
        ahorroMXN,
        porcentajeAdicional,
        precioBaseUSD,
        precioPromoUSD,
        monedaOriginal,
        tipoCambio
    } = productCalculations;

    // ✅ VERIFICAR SI ES FAVORITO
    const productIsFavorite = useMemo(() => {
        if (!productoProcesado) return false;
        return isFavorite(productoProcesado.id);
    }, [productoProcesado, isFavorite]);

    // ✅ MANEJAR FAVORITOS
    const handleToggleFavorite = useCallback(async () => {
        if (!productoProcesado || isAddingToFavorites) return;
        
        setIsAddingToFavorites(true);
        try {
            await toggleFavorite(productoProcesado);
            log('❤️ ProductDetails - Favorito actualizado:', {
                producto: productoProcesado.nombre,
                ahoraEsFavorito: !productIsFavorite
            });
        } catch (error) {
            console.error('❌ ProductDetails - Error al actualizar favorito:', error);
            alert('Error al actualizar favoritos: ' + error.message);
        } finally {
            setIsAddingToFavorites(false);
        }
    }, [productoProcesado, toggleFavorite, productIsFavorite, isAddingToFavorites]);

    // ✅ USAR HOOK DE PRODUCTOS RELACIONADOS
    const { data: relatedProductsData, loading: loadingRelated } = useProductosRelacionados(
        productoProcesado, 
        4
    );

    const relatedProducts = useMemo(() => {
        if (!relatedProductsData?.data) return [];
        
        const procesados = relatedProductsData.data.map(product => {
            const normalizado = normalizarProducto(product);
            return procesarProductoDetails(normalizado);
        }).filter(Boolean);
        
        log('✅ ProductDetails - Productos relacionados procesados:', procesados.length);
        return procesados;
    }, [relatedProductsData]);

    // ✅ STOCK TOTAL
    const getTotalStock = useCallback(() => {
        if (!productoProcesado) return 0;

        const existencia = productoProcesado.existencia || 0;
        
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
    }, [productoProcesado]);

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
        if (!productoProcesado) return;
        
        const precioFinalNumerico = tienePromocionActiva && precioPromoMXN ? 
            parseFloat(precioPromoMXN.replace(/,/g, '')) : 
            parseFloat(precioFinalMXN.replace(/,/g, ''));
        
        const cartItem = {
            ...productoProcesado,
            quantity,
            precioFinal: precioFinalNumerico,
            precioCon10Porciento: precioFinalNumerico, // Ya incluye el 10%
            id: productoProcesado.id,
            codigo: productoProcesado.codigo,
            nombre: productoProcesado.nombre,
            precio: precioFinalNumerico,
            precioOriginal: productoProcesado.precio,
            tienePromocion: tienePromocionActiva,
            porcentajeDescuento: discountPercentage,
            stock: totalStock,
            disponible: productoProcesado.disponible,
            porcentajeAdicional: PORCENTAJE_ADICIONAL,
            // Información adicional para debug
            precioMXNOriginal: productoProcesado.precioMXNOriginal,
            precioMXNCon10: productoProcesado.precioMXN,
            precioBaseUSD: precioBaseUSD,
            precioPromoUSD: precioPromoUSD,
            monedaOriginal: monedaOriginal,
            tipoCambio: tipoCambio
        };
        
        log('🛒 ProductDetails - Agregando al carrito:', {
            producto: cartItem.nombre,
            cantidad: cartItem.quantity,
            precio: cartItem.precioFinal,
            codigo: cartItem.codigo,
            con10Porciento: PORCENTAJE_ADICIONAL + '%',
            promocion: tienePromocionActiva ? `-${discountPercentage}%` : 'No',
            moneda: monedaOriginal,
            tipoCambio: tipoCambio
        });
        
        // Usar la función del contexto
        addToCart(cartItem, quantity);
        
        // Mostrar notificación
        setShowCartNotification(true);
        setTimeout(() => setShowCartNotification(false), 3000);
    }, [productoProcesado, quantity, tienePromocionActiva, precioPromoMXN, precioFinalMXN, discountPercentage, totalStock, addToCart, precioBaseUSD, precioPromoUSD, monedaOriginal, tipoCambio]);

    // ✅ COMPRAR AHORA
    const handleBuyNow = useCallback(() => {
        handleAddToCart();
        navigate('/cart');
    }, [handleAddToCart, navigate]);

    // ✅ MANEJO DE IMÁGENES (SIMPLIFICADO)
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
        console.log('❌ ProductDetails - Error cargando imagen:', e.target.src);
        
        setImageErrors(prev => {
            const newErrors = new Set(prev);
            newErrors.add(imageIndex);
            return newErrors;
        });
        
        e.target.src = 'data:image/svg+xml;base64,' + btoa(generateFallbackSVG(productoProcesado?.codigo || 'N/A'));
        e.target.onerror = null;
    }, [productoProcesado?.codigo]);

    // ✅ MANEJO DE ERRORES EN MINIATURAS (SOLUCIÓN SIMPLE)
    const handleThumbnailError = useCallback((e, img, index) => {
        console.log('❌ ProductDetails - Error en miniatura:', {
            src: e.target.src,
            index,
            hasFallback: img.isFallback
        });
        
        // Si es una imagen de fallback, no hacer nada
        if (img.isFallback) return;
        
        // Intentar usar la URL principal si la miniatura falla
        if (e.target.src !== img.url) {
            console.log('🔄 Intentando con URL principal...');
            e.target.src = img.url;
            e.target.onerror = null; // Prevenir loop infinito
        } else {
            // Si también falla la imagen principal, mostrar fallback
            console.log('⚠️ Mostrando fallback SVG');
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
        if (!productoProcesado) return;
        
        const shareUrl = window.location.href;
        const shareText = `Mira este producto: ${productoProcesado.nombre} - $${precioFinalMXN} MXN`;
        
        if (navigator.share) {
            navigator.share({
                title: productoProcesado.nombre,
                text: shareText,
                url: shareUrl,
            })
            .then(() => console.log('✅ Producto compartido'))
            .catch((error) => console.log('❌ Error compartiendo:', error));
        } else {
            // Copiar al portapapeles como fallback
            navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
            alert('✅ Enlace copiado al portapapeles');
        }
    }, [productoProcesado, precioFinalMXN]);

    // ✅ IMPRIMIR DETALLES
    const handlePrintDetails = useCallback(() => {
        const printContent = document.querySelector('.prod-details-container');
        const originalContent = document.body.innerHTML;
        
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
    }, []);

    // ✅ DEBUG LOGS
    useEffect(() => {
        if (productoProcesado) {
            log('📊 ProductDetails - Información del producto:', {
                id: productoProcesado.id,
                codigo: productoProcesado.codigo,
                nombre: productoProcesado.nombre,
                moneda: productoProcesado.moneda,
                precioOriginalUSD: productoProcesado.precio,
                precioMXNOriginal: productoProcesado.precioMXNOriginal,
                precioCon10: precioFinalMXN,
                existencia: productoProcesado.existencia,
                stock: totalStock,
                porcentajeAdicional: PORCENTAJE_ADICIONAL,
                esFavorito: productIsFavorite,
                tienePromocion: tienePromocionActiva,
                descuento: tienePromocionActiva ? `${discountPercentage}%` : 'No',
                tipoCambio: tipoCambio,
                precioBaseUSD: precioBaseUSD,
                precioPromoUSD: precioPromoUSD,
                imagenes: productImages.length,
                urlsImagenes: productImages.map(img => ({
                    url: img.url,
                    thumbnailUrl: img.thumbnailUrl,
                    hasThumbnail: img.hasThumbnail,
                    isFallback: img.isFallback
                }))
            });
        }
    }, [productoProcesado, totalStock, productIsFavorite, precioFinalMXN, tienePromocionActiva, discountPercentage, productImages.length, productImages, tipoCambio, precioBaseUSD, precioPromoUSD]);

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

    if (error || !productoProcesado) {
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
        <div className="prod-details-page">
            {/* Notificación de carrito */}
            {showCartNotification && (
                <div className="cart-notification">
                    <div className="cart-notification-content">
                        <span className="cart-notification-icon">✅</span>
                        <div className="cart-notification-text">
                            <strong>¡Producto agregado!</strong>
                            <span>{quantity} x {productoProcesado.nombre} agregado al carrito</span>
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
                    <Link to={`/products?category=${encodeURIComponent(productoProcesado.categoria || 'todos')}`}>
                        {productoProcesado.categoria || 'Categoría'}
                    </Link>
                    <span> / </span>
                    <span className="prod-details-current">{productoProcesado.nombre}</span>
                </nav>

                <div className="prod-details-content">
                    {/* ✅ Galería de imágenes - SOLUCIÓN SIMPLIFICADA */}
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
                                {/* <button 
                                    className="prod-details-image-action-btn"
                                    onClick={handlePrintDetails}
                                    title="Imprimir detalles"
                                >
                                    🖨️
                                </button> */}
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
                                            alt={`${productoProcesado.nombre} - Imagen ${selectedImage + 1}`}
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
                                                🔍 Mueve el cursor para explorar la imagen
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="prod-details-no-image">
                                        <div className="prod-details-no-image-icon">📷</div>
                                        <p>Imagen no disponible</p>
                                        <small>{productoProcesado.codigo}</small>
                                    </div>
                                )}
                                
                                {/* ✅ Badge de múltiples imágenes */}
                                {productImages.length > 1 && (
                                    <div className="prod-details-multiple-images-badge">
                                        📸 {productImages.length} imágenes
                                    </div>
                                )}
                                
                                {/* ✅ Badge de promoción */}
                                {tienePromocionActiva && (
                                    <div className="prod-details-promotion-badge-large">
                                        -{discountPercentage}% OFF
                                    </div>
                                )}
                                
                                {/* ✅ Badge de 10% adicional */}
                                {/* <div className="prod-details-additional-badge">
                                    +{PORCENTAJE_ADICIONAL}%
                                </div> */}
                                
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
                        
                        {/* ✅ Miniaturas - SOLUCIÓN DEFINITIVA */}
                        {productImages.length > 1 && (
                            <div className="prod-details-image-thumbnails">
                                {productImages.map((img, index) => {
                                    // ✅ USAR LA MISMA IMAGEN PARA MINIATURAS
                                    // Esto resuelve el problema de que las miniaturas no se cargan
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
                                                    <span>📷</span>
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

                    {/* ✅ Información principal del producto */}
                    <div className="prod-details-info-main">
                        {/* ✅ Encabezado */}
                        <div className="prod-details-header">
                            <span className="prod-details-brand">{productoProcesado.marca}</span>
                            <h1 className="prod-details-title">{productoProcesado.nombre}</h1>
                            <div className="prod-details-codes">
                                <span><strong>Código:</strong> {productoProcesado.codigo}</span>
                                {productoProcesado.modelo && productoProcesado.modelo !== productoProcesado.codigo && (
                                    <span><strong>Modelo:</strong> {productoProcesado.modelo}</span>
                                )}
                            </div>
                        </div>

                        {/* ✅ Categorías */}
                        <div className="prod-details-categories">
                            <span className="prod-details-category-badge">
                                {productoProcesado.categoria}
                            </span>
                            {productoProcesado.subcategoria && productoProcesado.subcategoria !== productoProcesado.categoria && (
                                <span className="prod-details-category-badge">
                                    {productoProcesado.subcategoria}
                                </span>
                            )}
                        </div>

                        {/* ✅ Precios (SINCRONIZADO CON PRODUCTS.JSX) */}
                        <div className="prod-details-pricing">
                            {/* <div className="prod-details-price-info">
                                {productoProcesado.moneda === 'USD' && (
                                    <span className="prod-details-currency-note">
                                        Precio original: ${precioBaseUSD?.toFixed(2) || '0.00'} USD 
                                        (Tipo de cambio: {tipoCambio} MXN/USD) + {PORCENTAJE_ADICIONAL}%
                                    </span>
                                )}
                                {productoProcesado.moneda === 'MXN' && (
                                    <span className="prod-details-currency-note">
                                        Precio en MXN + {PORCENTAJE_ADICIONAL}%
                                    </span>
                                )}
                            </div> */}
                            
                            {tienePromocionActiva ? (
                                <div className="prod-details-pricing-with-promo">
                                    <div className="prod-details-current-price">
                                        <span className="prod-details-currency">MXN </span>
                                        <span className="prod-details-price">${precioPromoMXN}</span>
                                        {/* <span className="prod-details-additional-tag">+{PORCENTAJE_ADICIONAL}%</span> */}
                                    </div>
                                    <div className="prod-details-original-price">
                                        <span className="prod-details-price">${precioBaseMXN} MXN</span>
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
                                    {/* <span className="prod-details-additional-tag">+{PORCENTAJE_ADICIONAL}%</span> */}
                                </div>
                            )}
                        </div>

                        {/* ✅ Descripción corta */}
                        <div className="prod-details-description-short">
                            <p>{productoProcesado.descripcion_corta || productoProcesado.descripcion}</p>
                        </div>

                        {/* ✅ Stock */}
                        <div className="prod-details-stock-info">
                            <div className="prod-details-stock-status">
                                {totalStock > 0 ? (
                                    <>
                                        <span className="prod-details-in-stock">✓ Disponible</span>
                                        <span className="prod-details-stock-quantity">
                                            ({totalStock} {totalStock === 1 ? 'unidad' : 'unidades'})
                                        </span>
                                    </>
                                ) : (
                                    <span className="prod-details-out-of-stock">✗ Agotado</span>
                                )}
                            </div>
                            
                            {/* ✅ Distribución por almacén */}
                            {productoProcesado.almacenes && typeof productoProcesado.almacenes === 'object' && totalStock > 0 && (
                                <div className="prod-details-stock-locations">
                                    <details>
                                        <summary>
                                            <strong>📦 Disponible en {Object.keys(productoProcesado.almacenes).length} almacén(es)</strong>
                                        </summary>
                                        <div className="prod-details-locations-list">
                                            {Object.entries(productoProcesado.almacenes).map(([location, stock]) => {
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

                        {/* ✅ Cantidad y acciones */}
                        <div className="prod-details-actions">
                            <div className="prod-details-quantity-selector">
                                <label>Cantidad:</label>
                                <div className="prod-details-quantity-controls">
                                    <button 
                                        onClick={handleDecrement}
                                        disabled={quantity <= 1 || totalStock === 0}
                                        className="prod-details-quantity-btn"
                                        type="button"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number" 
                                        value={quantity}
                                        min="1"
                                        max={totalStock}
                                        onChange={handleInputChange}
                                        onBlur={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                        disabled={totalStock === 0}
                                        className="prod-details-quantity-input"
                                    />
                                    <button 
                                        onClick={handleIncrement}
                                        disabled={quantity >= totalStock || totalStock === 0}
                                        className="prod-details-quantity-btn"
                                        type="button"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="prod-details-action-buttons">
                                <button 
                                    className="prod-details-btn-add-cart"
                                    onClick={handleAddToCart}
                                    disabled={totalStock === 0}
                                >
                                    <span className="prod-details-btn-icon">🛒</span>
                                    Agregar al Carrito
                                    {/* <small>(+{PORCENTAJE_ADICIONAL}%)</small> */}
                                </button>
                                <button 
                                    className="prod-details-btn-buy-now"
                                    onClick={handleBuyNow}
                                    disabled={totalStock === 0}
                                >
                                    <span className="prod-details-btn-icon">⚡</span>
                                    Comprar Ahora
                                    {/* <small>(+{PORCENTAJE_ADICIONAL}%)</small> */}
                                </button>
                                <button 
                                    className="prod-details-btn-wishlist"
                                    onClick={handleToggleFavorite}
                                    disabled={isAddingToFavorites}
                                >
                                    <span className="prod-details-btn-icon">
                                        {isAddingToFavorites ? (
                                            <div className="prod-details-favorite-spinner-small"></div>
                                        ) : productIsFavorite ? '❤️' : '🤍'}
                                    </span>
                                    {productIsFavorite ? 'En Favoritos' : 'Añadir a Favoritos'}
                                </button>
                            </div>
                        </div>

                        {/* ✅ Información adicional */}
                        <div className="prod-details-meta-info">
                            {productoProcesado.ultimaActualizacion && (
                                <div className="prod-details-update-info">
                                    <strong>Última actualización:</strong>{' '}
                                    {formatDate(productoProcesado.ultimaActualizacion)}
                                </div>
                            )}
                            
                            {/* {productoProcesado.fuente && (
                                <div className="prod-details-source-info">
                                    <strong>Fuente:</strong> {productoProcesado.fuente}
                                </div>
                            )} */}
                        </div>

                        {/* ✅ Envío y garantías */}
                        <div className="prod-details-shipping-preview">
                            <div className="prod-details-shipping-item">
                                <span className="prod-details-shipping-icon">🚚</span>
                                <div>
                                    <strong>Envío gratis</strong> en compras mayores a $1000 MXN
                                </div>
                            </div>
                            <div className="prod-details-shipping-item">
                                <span className="prod-details-shipping-icon">↩️</span>
                                <div>
                                    <strong>30 días</strong> para devoluciones
                                </div>
                            </div>
                            <div className="prod-details-shipping-item">
                                <span className="prod-details-shipping-icon">🛡️</span>
                                <div>
                                    <strong>Garantía</strong> incluida
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✅ Tabs de información detallada */}
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
                        {/* ✅ Descripción */}
                        {activeTab === 'description' && (
                            <div className="prod-details-tab-panel">
                                <h3>Descripción del Producto</h3>
                                <p>{productoProcesado.descripcion_corta || productoProcesado.descripcion}</p>
                                
                                {productoProcesado.descripcion && productoProcesado.descripcion !== productoProcesado.descripcion_corta && (
                                    <div className="prod-details-description-full">
                                        <h4>Descripción completa:</h4>
                                        <p>{productoProcesado.descripcion}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ✅ Especificaciones */}
                        {activeTab === 'specifications' && (
                            <div className="prod-details-tab-panel">
                                <h3>Especificaciones Técnicas</h3>
                                <div className="prod-details-specifications-grid">
                                    {productoProcesado.especificaciones && productoProcesado.especificaciones.length > 0 ? (
                                        productoProcesado.especificaciones.map((spec, index) => (
                                            <div key={index} className="prod-details-spec-item">
                                                <span className="prod-details-spec-label">{spec.tipo || `Especificación ${index + 1}`}:</span>
                                                <span className="prod-details-spec-value">{spec.valor}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="prod-details-no-specifications">
                                            <p>No hay especificaciones técnicas disponibles para este producto.</p>
                                            <div className="prod-details-default-specs">
                                                {productoProcesado.modelo && (
                                                    <div className="prod-details-spec-item">
                                                        <span className="prod-details-spec-label">Modelo:</span>
                                                        <span className="prod-details-spec-value">{productoProcesado.modelo}</span>
                                                    </div>
                                                )}
                                                {productoProcesado.marca && (
                                                    <div className="prod-details-spec-item">
                                                        <span className="prod-details-spec-label">Marca:</span>
                                                        <span className="prod-details-spec-value">{productoProcesado.marca}</span>
                                                    </div>
                                                )}
                                                {productoProcesado.categoria && (
                                                    <div className="prod-details-spec-item">
                                                        <span className="prod-details-spec-label">Categoría:</span>
                                                        <span className="prod-details-spec-value">{productoProcesado.categoria}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ✅ Detalles */}
                        {activeTab === 'details' && (
                            <div className="prod-details-tab-panel">
                                <h3>Detalles del Producto</h3>
                                <div className="prod-details-details-grid">
                                    <div className="prod-details-detail-item">
                                        <span className="prod-details-detail-label">Código:</span>
                                        <span className="prod-details-detail-value">{productoProcesado.codigo}</span>
                                    </div>
                                    {productoProcesado.ean && (
                                        <div className="prod-details-detail-item">
                                            <span className="prod-details-detail-label">EAN:</span>
                                            <span className="prod-details-detail-value">{productoProcesado.ean}</span>
                                        </div>
                                    )}
                                    {productoProcesado.upc && (
                                        <div className="prod-details-detail-item">
                                            <span className="prod-details-detail-label">UPC:</span>
                                            <span className="prod-details-detail-value">{productoProcesado.upc}</span>
                                        </div>
                                    )}
                                    {productoProcesado.sustituto && (
                                        <div className="prod-details-detail-item">
                                            <span className="prod-details-detail-label">Sustituto:</span>
                                            <span className="prod-details-detail-value">{productoProcesado.sustituto}</span>
                                        </div>
                                    )}
                                    <div className="prod-details-detail-item">
                                        <span className="prod-details-detail-label">Estado:</span>
                                        <span className="prod-details-detail-value">
                                            {productoProcesado.disponible ? '🟢 Disponible' : '🔴 Agotado'}
                                        </span>
                                    </div>
                                    {/* {productoProcesado.fuente && (
                                        <div className="prod-details-detail-item">
                                            <span className="prod-details-detail-label">Fuente de datos:</span>
                                            <span className="prod-details-detail-value">{productoProcesado.fuente}</span>
                                        </div>
                                    )} */}
                                </div>
                            </div>
                        )}

                        {/* ✅ Precios */}
                        {activeTab === 'pricing' && (
                            <div className="prod-details-tab-panel">
                                <h3>Detalles de Precios</h3>
                                <div className="prod-details-pricing-breakdown">
                                    {/* <div className="prod-details-pricing-item">
                                        <span className="prod-details-pricing-label">Moneda original:</span>
                                        <span className="prod-details-pricing-value">{productoProcesado.moneda}</span>
                                    </div> */}
                                    
                                    {/* {productoProcesado.moneda === 'USD' && (
                                        <>
                                            <div className="prod-details-pricing-item">
                                                <span className="prod-details-pricing-label">Precio original (USD):</span>
                                                <span className="prod-details-pricing-value">
                                                    ${precioBaseUSD?.toFixed(2) || '0.00'} USD
                                                </span>
                                            </div>
                                            
                                            <div className="prod-details-pricing-item">
                                                <span className="prod-details-pricing-label">Tipo de cambio:</span>
                                                <span className="prod-details-pricing-value">
                                                    {tipoCambio} MXN/USD
                                                </span>
                                            </div>
                                            
                                            <div className="prod-details-pricing-item">
                                                <span className="prod-details-pricing-label">Precio en MXN (convertido):</span>
                                                <span className="prod-details-pricing-value">
                                                    ${productoProcesado.precioMXNOriginal?.toFixed(2) || '0.00'} MXN
                                                </span>
                                            </div>
                                        </>
                                    )} */}
                                    
                                    {/* {productoProcesado.moneda === 'MXN' && (
                                        <div className="prod-details-pricing-item">
                                            <span className="prod-details-pricing-label">Precio original (MXN):</span>
                                            <span className="prod-details-pricing-value">
                                                ${productoProcesado.precioMXNOriginal?.toFixed(2) || '0.00'} MXN
                                            </span>
                                        </div>
                                    )} */}
                                    
                                    {/* <div className="prod-details-pricing-item">
                                        <span className="prod-details-pricing-label">Porcentaje adicional:</span>
                                        <span className="prod-details-pricing-value">
                                            +{PORCENTAJE_ADICIONAL}%
                                        </span>
                                    </div> */}
                                    
                                    <div className="prod-details-pricing-item total">
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
                                            
                                            <div className="prod-details-pricing-item savings">
                                                <span className="prod-details-pricing-label">Total ahorrado:</span>
                                                <span className="prod-details-pricing-value">
                                                    ${ahorroMXN} MXN
                                                </span>
                                            </div>
                                            
                                            {/* {productoProcesado.moneda === 'USD' && precioPromoUSD && (
                                                <div className="prod-details-pricing-item">
                                                    <span className="prod-details-pricing-label">Precio promocional (USD):</span>
                                                    <span className="prod-details-pricing-value">
                                                        ${precioPromoUSD?.toFixed(2) || '0.00'} USD
                                                    </span>
                                                </div>
                                            )} */}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ✅ Imágenes */}
                        {activeTab === 'images' && (
                            <div className="prod-details-tab-panel">
                                <h3>Galería de Imágenes ({productImages.length})</h3>
                                
                                {productImages.length === 0 ? (
                                    <div className="prod-details-no-images-message">
                                        <div className="prod-details-no-images-icon">📷</div>
                                        <p>Este producto no tiene imágenes disponibles</p>
                                    </div>
                                ) : productImages.length === 1 ? (
                                    <div className="prod-details-single-image-view">
                                        <p>Este producto tiene <strong>1 imagen</strong> disponible:</p>
                                        <div className="prod-details-single-image-preview">
                                            <img 
                                                src={productImages[0].url} 
                                                alt={productoProcesado.nombre}
                                                className="prod-details-fullsize-image"
                                            />
                                        </div>
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
                                                        src={img.url} // Usar siempre la URL principal
                                                        alt={`${productoProcesado.nombre} ${index + 1}`}
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

                {/* ✅ Productos relacionados */}
                {!loadingRelated && relatedProducts.length > 0 && (
                    <div className="prod-details-related-products">
                        <h2>📦 Productos Relacionados</h2>
                        <p className="prod-details-related-note">
                            (Todos los productos incluyen {PORCENTAJE_ADICIONAL}% adicional)
                        </p>
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

                {/* ✅ Información de contacto */}
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
                                <p>luis.lucio@lucesademexico.com</p>
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