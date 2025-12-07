import { useState, useEffect, useCallback } from 'react';
import productosAPI from './productosAPI';

// Hook genérico para peticiones de productos
const useProductosAPI = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction();
        if (mounted && result.success) {
          setData(result);
        } else if (mounted && result.error) {
          setError(result.error);
        }
      } catch (err) {
        if (mounted) {
          // Manejar específicamente el error de ID interno
          if (err.message.includes('ID interno detectado') || err.message.includes('ID interno no válido')) {
            setError('Por favor, usa el código del producto en lugar del ID interno. ' + err.message);
          } else {
            setError(err.message);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Error en la respuesta del servidor');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  return { data, loading, error, refetch };
};

// ==================== HOOKS PARA CATEGORÍAS ACTUALIZADAS ====================

/**
 * Hook para categorías dinámicas del backend (con opciones)
 */
export const useCategoriasDinamicas = (options = {}) => 
  useProductosAPI(() => productosAPI.getCategoriasDinamicas(options), [JSON.stringify(options)]);

/**
 * Hook para categorías actualizadas automáticamente (recomendado)
 */
export const useCategoriasActualizadas = (refreshInterval = 60000) => {
  const [ultimaActualizacion, setUltimaActualizacion] = useState(Date.now());
  const hook = useProductosAPI(() => productosAPI.getCategoriasActualizadas(), [ultimaActualizacion]);

  // Actualizar automáticamente cada cierto tiempo
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      setUltimaActualizacion(Date.now());
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  const refetch = useCallback(() => {
    setUltimaActualizacion(Date.now());
  }, []);

  return {
    ...hook,
    refetch
  };
};

// Función para normalizar la existencia de un producto
export const normalizarProducto = (producto) => {
  if (!producto) return producto;
  
  const existencia = producto.existencia || producto.existenciaTotal || 0;
  const existenciaTotal = producto.existenciaTotal || producto.existencia || 0;
  
  return {
    ...producto,
    existencia,
    existenciaTotal,
    disponible: existencia > 0,
    tieneExistencia: existencia > 0,
    stock: existencia,
    // Información adicional útil para UI
    sinStock: existencia === 0,
    stockBajo: existencia > 0 && existencia <= 5,
    stockSuficiente: existencia > 5,
    // Información de precios
    precioOriginal: producto.precio,
    precioFinal: producto.precioPromocion > 0 ? producto.precioPromocion : producto.precio,
    tienePromocion: producto.precioPromocion > 0,
    porcentajeDescuento: producto.precioPromocion > 0 && producto.precio > 0 
      ? Math.round((1 - producto.precioPromocion / producto.precio) * 100) 
      : 0
  };
};

// Función para normalizar un array de productos
export const normalizarProductos = (productos = []) => {
  if (!Array.isArray(productos)) return [];
  return productos.map(producto => normalizarProducto(producto));
};

// ==================== HOOKS PRINCIPALES ====================

// Hook para todos los productos (XML - puede no tener existencia)
export const useTodosProductos = (options = {}) => 
  useProductosAPI(() => productosAPI.getTodosProductos(options), [JSON.stringify(options)]);

// Hook para productos con existencia (JSON - siempre tiene stock)
export const useProductosConExistencia = (options = {}) => 
  useProductosAPI(() => productosAPI.getProductosConExistencia(options), [JSON.stringify(options)]);

// Hook para productos unificados (recomendado - con existencia)
export const useProductosUnificados = (options = {}) => 
  useProductosAPI(() => productosAPI.getProductosUnificados(options), [JSON.stringify(options)]);

// ==================== HOOKS DE PRODUCTOS ESPECÍFICOS ====================

// ✅ HOOK MEJORADO: Producto por código con manejo de IDs internos
export const useProductoPorCodigo = (codigo, options = {}) => {
  // Verificar si es un ID interno
  const esIdInterno = codigo && (
    codigo.startsWith('json_') || 
    codigo.startsWith('xml_') || 
    codigo.startsWith('prod_')
  );

  return useProductosAPI(async () => {
    if (!codigo) {
      return { success: false, error: 'Código de producto requerido' };
    }
    
    console.log('🔍 useProductoPorCodigo - Buscando:', {
      codigo,
      esIdInterno,
      options
    });
    
    if (esIdInterno) {
      // Intentar convertir ID interno a código
      const codigoReal = await productosAPI.convertInternalIdToCode(codigo);
      if (codigoReal) {
        console.log('✅ useProductoPorCodigo - ID interno convertido:', {
          id: codigo,
          codigoReal
        });
        return productosAPI.getProductoPorCodigo(codigoReal, options);
      } else {
        throw new Error(`No se encontró el código real para el ID interno: ${codigo}`);
      }
    }
    
    // Si es un código real, buscar normalmente
    return productosAPI.getProductoPorCodigo(codigo, options);
  }, [codigo, JSON.stringify(options), esIdInterno]);
};

// ✅ HOOK MEJORADO: Producto combinado (recomendado)
export const useProductoCombinado = (codigo) => {
  // Verificar si es un ID interno
  const esIdInterno = codigo && (
    codigo.startsWith('json_') || 
    codigo.startsWith('xml_') || 
    codigo.startsWith('prod_')
  );

  return useProductosAPI(async () => {
    if (!codigo) {
      return { success: false, error: 'Código de producto requerido' };
    }
    
    console.log('🔍 useProductoCombinado - Buscando:', {
      codigo,
      esIdInterno
    });
    
    if (esIdInterno) {
      // Intentar convertir ID interno a código
      const codigoReal = await productosAPI.convertInternalIdToCode(codigo);
      if (codigoReal) {
        console.log('✅ useProductoCombinado - ID interno convertido:', {
          id: codigo,
          codigoReal
        });
        return productosAPI.getProductoCombinado(codigoReal);
      } else {
        throw new Error(`No se encontró el código real para el ID interno: ${codigo}`);
      }
    }
    
    // Si es un código real, buscar normalmente
    return productosAPI.getProductoCombinado(codigo);
  }, [codigo, esIdInterno]);
};

// Hook para producto unificado (alias)
export const useProductoUnificado = useProductoCombinado;

// Hook para producto detallado (con información extendida)
export const useProductoDetallado = (codigo) => 
  useProductosAPI(async () => {
    const result = await productosAPI.getProductoCombinado(codigo);
    if (result.success && result.data) {
      const producto = normalizarProducto(result.data);
      
      // Enriquecer con información adicional
      return {
        ...result,
        data: {
          ...producto,
          // Información de distribución por almacén
          almacenesArray: producto.almacenes ? 
            Object.entries(producto.almacenes)
              .map(([nombre, cantidad]) => ({ nombre, cantidad }))
              .filter(alm => alm.cantidad > 0)
              .sort((a, b) => b.cantidad - a.cantidad) 
            : [],
          
          // Resumen de especificaciones
          especificacionesResumen: producto.especificaciones 
            ? producto.especificaciones.slice(0, 5).map(esp => `${esp.tipo}: ${esp.valor}`)
            : [],
          
          // Información de categorías
          categoriaCompleta: producto.subcategoria 
            ? `${producto.categoria} > ${producto.subcategoria}`
            : producto.categoria
        }
      };
    }
    return result;
  }, [codigo]);

// ==================== HOOKS DE BÚSQUEDA ====================

// Hook para buscar productos
export const useBuscarProductos = (termino, options = {}) => 
  useProductosAPI(() => productosAPI.buscarProductos(termino, options), [termino, JSON.stringify(options)]);

// Hook para búsqueda rápida (con debounce)
export const useBusquedaRapida = (termino, delay = 300) => {
  const [terminoDebounced, setTerminoDebounced] = useState(termino);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerminoDebounced(termino);
    }, delay);

    return () => clearTimeout(timer);
  }, [termino, delay]);

  return useBuscarProductos(terminoDebounced, {
    tipo: 'existencias',
    conExistencia: true
  });
};

// ==================== HOOKS DE CATEGORÍAS Y FILTROS ====================

// Hook para categorías (MANTENER para compatibilidad)
export const useCategoriasReales = () => 
  useProductosAPI(() => productosAPI.getCategorias());

// Hook para marcas
export const useMarcas = () => 
  useProductosAPI(() => productosAPI.getMarcas());

// Hook para productos por categoría
export const useProductosPorCategoria = (categoria, options = {}) => 
  useProductosAPI(() => productosAPI.getProductosPorCategoria(categoria, options), 
    [categoria, JSON.stringify(options)]);

// Hook para productos por marca
export const useProductosPorMarca = (marca, options = {}) => 
  useProductosAPI(() => productosAPI.getProductosPorMarca(marca, options), 
    [marca, JSON.stringify(options)]);

// ==================== HOOKS DE PRODUCTOS ESPECIALES ====================

// Hook para productos destacados
export const useProductosDestacados = (limit = 12) => 
  useProductosAPI(() => productosAPI.getProductosDestacados(limit), [limit]);

// Hook para productos en promoción
export const useProductosEnPromocion = (limit = 20) => 
  useProductosAPI(() => productosAPI.getProductosEnPromocion(limit), [limit]);

// ✅ HOOK MEJORADO: Productos relacionados
export const useProductosRelacionados = (producto, limit = 4) => 
  useProductosAPI(async () => {
    if (!producto) {
      return { success: true, data: [] };
    }

    console.log('🔍 Buscando productos relacionados para:', {
      id: producto.id,
      codigo: producto.codigo,
      categoria: producto.categoria,
      marca: producto.marca
    });

    const resultados = [];
    
    // Buscar por categoría si existe
    if (producto.categoria && producto.categoria.trim() !== '') {
      try {
        console.log('📂 Buscando por categoría:', producto.categoria);
        const porCategoria = await productosAPI.getProductosPorCategoria(producto.categoria, {
          limit: Math.ceil(limit / 2)
        });
        if (porCategoria.success && porCategoria.data) {
          // Filtrar por código, no por ID
          const productosFiltrados = porCategoria.data.filter(p => 
            p.codigo !== producto.codigo
          );
          console.log('✅ Encontrados por categoría:', productosFiltrados.length);
          resultados.push(...productosFiltrados);
        }
      } catch (error) {
        console.warn('❌ Error buscando por categoría:', error);
      }
    }

    // Buscar por marca si existe
    if (producto.marca && producto.marca.trim() !== '' && resultados.length < limit) {
      try {
        console.log('🏷️ Buscando por marca:', producto.marca);
        const porMarca = await productosAPI.getProductosPorMarca(producto.marca, {
          limit: Math.ceil(limit / 2)
        });
        if (porMarca.success && porMarca.data) {
          // Filtrar por código, no por ID
          const productosFiltrados = porMarca.data.filter(p => 
            p.codigo !== producto.codigo && 
            !resultados.some(r => r.codigo === p.codigo)
          );
          console.log('✅ Encontrados por marca:', productosFiltrados.length);
          resultados.push(...productosFiltrados);
        }
      } catch (error) {
        console.warn('❌ Error buscando por marca:', error);
      }
    }

    // Si no hay suficientes resultados, buscar productos destacados
    if (resultados.length < limit) {
      try {
        console.log('🌟 Buscando productos destacados para completar');
        const destacados = await productosAPI.getProductosDestacados(limit);
        if (destacados.success && destacados.data) {
          // Filtrar por código, no por ID
          const productosFiltrados = destacados.data.filter(p => 
            p.codigo !== producto.codigo && 
            !resultados.some(r => r.codigo === p.codigo)
          );
          console.log('✅ Encontrados destacados:', productosFiltrados.length);
          resultados.push(...productosFiltrados);
        }
      } catch (error) {
        console.warn('❌ Error buscando destacados:', error);
      }
    }

    // Eliminar duplicados por código y limitar resultados
    const productosUnicos = Array.from(
      new Map(resultados.map(p => [p.codigo, p])).values()
    ).slice(0, limit);

    console.log('🎯 Productos relacionados finales:', productosUnicos.length);

    return {
      success: true,
      data: normalizarProductos(productosUnicos),
      metadata: {
        total: productosUnicos.length,
        relacionadosPor: producto.categoria ? 'categoria' : 'marca'
      }
    };
  }, [producto?.codigo, producto?.categoria, producto?.marca, limit]);

// ==================== HOOKS DE ESTADÍSTICAS Y DIAGNÓSTICO ====================

// Hook para estadísticas
export const useEstadisticas = () => 
  useProductosAPI(() => productosAPI.getEstadisticas());

// Hook para health check
export const useProductosHealth = () => 
  useProductosAPI(() => productosAPI.getHealth());

// Hook para diagnóstico de producto
export const useDiagnosticoProducto = (codigo) => 
  useProductosAPI(() => productosAPI.getDiagnosticoProducto(codigo), [codigo]);

// ==================== HOOKS DE TIEMPO REAL ====================

// Hook para productos con actualización automática
export const useProductosEnTiempoReal = (options = {}, intervalo = 30000) => {
  const [ultimaActualizacion, setUltimaActualizacion] = useState(Date.now());
  const hook = useProductosUnificados({
    ...options,
    // Forzar recarga incluyendo timestamp
    _ts: ultimaActualizacion
  });

  useEffect(() => {
    if (!intervalo) return;

    const timer = setInterval(() => {
      setUltimaActualizacion(Date.now());
    }, intervalo);

    return () => clearInterval(timer);
  }, [intervalo]);

  const refetch = useCallback(() => {
    setUltimaActualizacion(Date.now());
  }, []);

  return {
    ...hook,
    refetch
  };
};

// ==================== ALIAS Y EXPORTACIÓN ====================

// Alias para compatibilidad
export const useProductos = useProductosUnificados;
export const useProductosDisponibles = useProductosConExistencia;
export const useBuscar = useBuscarProductos;
export const useProducto = useProductoCombinado;

// Exportación por defecto
export default {
  // HOOKS PRINCIPALES
  useProductos,
  useTodosProductos,
  useProductosConExistencia,
  useProductosUnificados,
  useProductosDisponibles,
  
  // CATEGORÍAS ACTUALIZADAS
  useCategoriasActualizadas,
  useCategoriasDinamicas,
  useCategoriasReales,
  
  // PRODUCTOS ESPECÍFICOS
  useProducto,
  useProductoPorCodigo,
  useProductoCombinado,
  useProductoUnificado,
  useProductoDetallado,
  
  // BÚSQUEDA
  useBuscar,
  useBuscarProductos,
  useBusquedaRapida,
  
  // CATEGORÍAS Y FILTROS
  useCategoriasReales,
  useMarcas,
  useProductosPorCategoria,
  useProductosPorMarca,
  
  // PRODUCTOS ESPECIALES
  useProductosDestacados,
  useProductosEnPromocion,
  useProductosRelacionados,
  
  // ESTADÍSTICAS Y DIAGNÓSTICO
  useEstadisticas,
  useProductosHealth,
  useDiagnosticoProducto,
  
  // TIEMPO REAL
  useProductosEnTiempoReal,
  
  // FUNCIONES HELPER
  normalizarProducto,
  normalizarProductos,
  
  // Instancia de API para uso directo
  api: productosAPI
};