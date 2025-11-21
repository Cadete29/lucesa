import { useState, useEffect } from 'react';
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
        } else if (mounted) {
          setError(result.error || 'Error en la respuesta del servidor');
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
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

  const refetch = async () => {
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
  };

  return { data, loading, error, refetch };
};

// ==================== HOOKS PRINCIPALES ====================

// Hook para todos los productos
export const useProductos = (options = {}) => 
  useProductosAPI(() => productosAPI.getTodosProductos(options), [JSON.stringify(options)]);

// Hook para productos con existencia
export const useProductosConExistencia = (options = {}) => 
  useProductosAPI(() => productosAPI.getProductosConExistencia(options), [JSON.stringify(options)]);

// Hook para productos destacados (con mejor puntuación/existencia)
export const useProductosDestacados = (options = {}) => {
  const { limit = 12, minExistencia = 5, ...restOptions } = options;
  
  return useProductosAPI(() => productosAPI.getProductosConExistencia({
    limit,
    minExistencia,
    ...restOptions
  }), [JSON.stringify(options)]);
};

// Hook para productos en promoción
export const useProductosEnPromocion = (options = {}) => 
  useProductosAPI(async () => {
    const result = await productosAPI.getTodosProductos(options);
    if (result.success && result.data) {
      // Filtrar productos con promoción
      const productosEnPromocion = result.data.filter(
        producto => producto.precioPromocion && producto.precioPromocion > 0
      );
      return {
        ...result,
        data: productosEnPromocion,
        pagination: {
          ...result.pagination,
          total: productosEnPromocion.length
        }
      };
    }
    return result;
  }, [JSON.stringify(options)]);

// Hook para productos por categoría
export const useProductosPorCategoria = (categoria, options = {}) => 
  useProductosAPI(() => productosAPI.getTodosProductos({
    categoria,
    ...options
  }), [categoria, JSON.stringify(options)]);

// Hook para productos por marca
export const useProductosPorMarca = (marca, options = {}) => 
  useProductosAPI(() => productosAPI.getTodosProductos({
    marca,
    ...options
  }), [marca, JSON.stringify(options)]);

// ==================== HOOKS DE PRODUCTOS ESPECÍFICOS ====================

// Hook para producto por código (alias principal)
export const useProductoPorCodigo = (codigo, incluirSinExistencia = false) => 
  useProductosAPI(() => productosAPI.getProductoPorCodigo(codigo, incluirSinExistencia), [codigo, incluirSinExistencia]);

// Hook para producto por ID (alias de useProductoPorCodigo para compatibilidad)
export const useProductoPorId = (id, incluirSinExistencia = false) => 
  useProductosAPI(() => productosAPI.getProductoPorCodigo(id, incluirSinExistencia), [id, incluirSinExistencia]);

// Hook para producto por código con datos extendidos
export const useProductoDetallado = (codigo) => 
  useProductosAPI(async () => {
    const result = await productosAPI.getProductoPorCodigo(codigo, true);
    if (result.success && result.data) {
      // Aquí podrías enriquecer los datos con información adicional
      return {
        ...result,
        data: {
          ...result.data,
          // Agregar campos calculados o información adicional
          tieneDescuento: result.data.precioPromocion > 0,
          porcentajeDescuento: result.data.precioPromocion > 0 ? 
            Math.round((1 - result.data.precioPromocion / result.data.precio) * 100) : 0,
          disponible: (result.data.existencia || result.data.existenciaTotal) > 0
        }
      };
    }
    return result;
  }, [codigo]);

// Hook para productos relacionados (misma categoría/marca)
export const useProductosRelacionados = (productoActual, limit = 4) => 
  useProductosAPI(async () => {
    if (!productoActual) {
      return { success: true, data: [] };
    }

    const resultados = [];
    
    // Buscar por categoría
    if (productoActual.categoria) {
      const porCategoria = await productosAPI.getTodosProductos({
        categoria: productoActual.categoria,
        limit: Math.ceil(limit / 2)
      });
      if (porCategoria.success && porCategoria.data) {
        resultados.push(...porCategoria.data.filter(p => p.codigo !== productoActual.codigo));
      }
    }

    // Buscar por marca
    if (productoActual.marca) {
      const porMarca = await productosAPI.getTodosProductos({
        marca: productoActual.marca,
        limit: Math.ceil(limit / 2)
      });
      if (porMarca.success && porMarca.data) {
        resultados.push(...porMarca.data.filter(p => 
          p.codigo !== productoActual.codigo && 
          !resultados.some(r => r.codigo === p.codigo)
        ));
      }
    }

    // Eliminar duplicados y limitar
    const productosUnicos = resultados.reduce((acc, producto) => {
      if (!acc.some(p => p.codigo === producto.codigo)) {
        acc.push(producto);
      }
      return acc;
    }, []).slice(0, limit);

    return {
      success: true,
      data: productosUnicos,
      metadata: {
        total: productosUnicos.length,
        relacionadosPor: productoActual.categoria ? 'categoria' : 'marca'
      }
    };
  }, [productoActual?.codigo, limit]);

// ==================== HOOKS DE BÚSQUEDA ====================

export const useBuscarProductos = (termino, options = {}) => 
  useProductosAPI(() => productosAPI.buscarProductos(termino, options), [termino, JSON.stringify(options)]);

// Búsqueda simple
export const useBuscar = (termino) => 
  useProductosAPI(() => productosAPI.buscarProductos(termino), [termino]);

// Búsqueda en tiempo real con debounce
export const useBusquedaEnTiempoReal = (termino, delay = 300) => {
  const [terminoDebounced, setTerminoDebounced] = useState(termino);

  useEffect(() => {
    const handler = setTimeout(() => {
      setTerminoDebounced(termino);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [termino, delay]);

  return useBuscarProductos(terminoDebounced);
};

// ==================== HOOKS DE DATOS MAESTROS ====================

export const useEstadisticas = () => 
  useProductosAPI(() => productosAPI.getEstadisticas());

export const useCategorias = () => 
  useProductosAPI(() => productosAPI.getCategorias());

export const useMarcas = () => 
  useProductosAPI(() => productosAPI.getMarcas());

export const useProductosHealth = () => 
  useProductosAPI(() => productosAPI.getHealth());

// ==================== ALIAS Y COMPATIBILIDAD ====================

// Alias para compatibilidad
export const useTodosProductos = useProductos;
export const useProductosDisponibles = useProductosConExistencia;

// ==================== EXPORTACIÓN POR DEFECTO ====================

// Exportar todo en un objeto por defecto
export default {
  // Principales
  useProductos,
  useTodosProductos,
  useProductosConExistencia,
  useProductosDisponibles,
  useProductosDestacados,
  useProductosEnPromocion,
  useProductosPorCategoria,
  useProductosPorMarca,
  
  // Productos específicos
  useProductoPorCodigo,
  useProductoPorId,
  useProductoDetallado,
  useProductosRelacionados,
  
  // Búsqueda
  useBuscarProductos,
  useBuscar,
  useBusquedaEnTiempoReal,
  
  // Datos maestros
  useEstadisticas,
  useCategorias,
  useMarcas,
  useProductosHealth
};