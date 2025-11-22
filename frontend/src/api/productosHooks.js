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

/**
 * Función para extraer TODAS las categorías reales de los productos
 */
export const extraerTodasLasCategoriasReales = (productos = []) => {
  const categoriasSet = new Set();
  const subcategoriasSet = new Set();
  
  if (!Array.isArray(productos)) {
    console.warn('❌ productos no es un array:', productos);
    return [];
  }

  console.log(`🔍 Analizando ${productos.length} productos para categorías reales...`);

  productos.forEach((producto, index) => {
    // Extraer categoría principal (si existe y es válida)
    if (producto.categoria && 
        typeof producto.categoria === 'string' && 
        producto.categoria.trim() !== '' &&
        producto.categoria.trim() !== 'N/A' &&
        producto.categoria.trim() !== 'Sin categoría' &&
        producto.categoria.trim() !== 'null' &&
        producto.categoria.trim().length > 1) {
      
      const categoria = producto.categoria.trim();
      categoriasSet.add(categoria);
    }

    // Extraer subcategoría (si existe y es válida)
    if (producto.subcategoria && 
        typeof producto.subcategoria === 'string' && 
        producto.subcategoria.trim() !== '' &&
        producto.subcategoria.trim() !== 'N/A' &&
        producto.subcategoria.trim() !== 'Sin subcategoría' &&
        producto.subcategoria.trim() !== 'null' &&
        producto.subcategoria.trim().length > 1 &&
        producto.subcategoria !== producto.categoria) {
      
      const subcategoria = producto.subcategoria.trim();
      subcategoriasSet.add(subcategoria);
    }

    // Debug cada 1000 productos
    if ((index + 1) % 1000 === 0) {
      console.log(`📈 Procesados ${index + 1} productos - Categorías encontradas: ${categoriasSet.size}`);
    }
  });

  // Combinar categorías y subcategorías
  const todasLasCategorias = [...categoriasSet, ...subcategoriasSet];
  
  console.log('📋 RESUMEN CATEGORÍAS REALES:');
  console.log(`   ✅ Categorías principales: ${categoriasSet.size}`);
  console.log(`   ✅ Subcategorías: ${subcategoriasSet.size}`);
  console.log(`   📊 TOTAL: ${todasLasCategorias.length} categorías reales`);
  
  // Mostrar ejemplos de categorías encontradas
  if (todasLasCategorias.length > 0) {
    console.log('🏷️ EJEMPLOS DE CATEGORÍAS ENCONTRADAS:');
    todasLasCategorias.slice(0, 20).forEach((cat, i) => {
      console.log(`   ${i + 1}. ${cat}`);
    });
  }

  return todasLasCategorias.sort();
};

/**
 * Hook para obtener TODAS las categorías reales desde los productos
 */
export const useCategoriasReales = (options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener una cantidad grande de productos para extraer todas las categorías
  const { data: productosResponse, loading: productosLoading, error: productosError } = useProductos({
    page: 1,
    limit: 20000,
    ...options
  });

  useEffect(() => {
    if (!productosLoading && productosResponse) {
      try {
        setLoading(true);
        
        const productos = productosResponse.data || [];
        console.log(`📊 Total productos para extraer categorías: ${productos.length}`);

        // Extraer TODAS las categorías reales
        const todasLasCategorias = extraerTodasLasCategoriasReales(productos);
        
        console.log(`🏷️ CATEGORÍAS REALES ENCONTRADAS: ${todasLasCategorias.length}`);
        
        setData({
          success: true,
          data: todasLasCategorias,
          metadata: {
            total: todasLasCategorias.length,
            fuente: 'productos_reales',
            totalProductos: productos.length,
            timestamp: new Date().toISOString()
          }
        });
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else if (productosError) {
      setError(productosError);
      setLoading(false);
    }
  }, [productosLoading, productosResponse, productosError]);

  const refetch = () => {
    setLoading(true);
  };

  return { data, loading: loading || productosLoading, error, refetch };
};

// ==================== HOOKS PRINCIPALES ====================

// Hook para todos los productos con paginación real
export const useProductos = (options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await productosAPI.getTodosProductos(options);
        if (mounted) {
          if (result.success) {
            setData(result);
          } else {
            setError(result.error || 'Error en la respuesta del servidor');
          }
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
  }, [JSON.stringify(options)]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await productosAPI.getTodosProductos(options);
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

// Hook para productos con existencia
export const useProductosConExistencia = (options = {}) => 
  useProductosAPI(() => productosAPI.getProductosConExistencia(options), [JSON.stringify(options)]);

// Hook para productos destacados
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

export const useProductoPorCodigo = (codigo, incluirSinExistencia = false) => 
  useProductosAPI(() => productosAPI.getProductoPorCodigo(codigo, incluirSinExistencia), [codigo, incluirSinExistencia]);

export const useProductoPorId = (id, incluirSinExistencia = false) => 
  useProductosAPI(() => productosAPI.getProductoPorCodigo(id, incluirSinExistencia), [id, incluirSinExistencia]);

export const useProductoDetallado = (codigo) => 
  useProductosAPI(async () => {
    const result = await productosAPI.getProductoPorCodigo(codigo, true);
    if (result.success && result.data) {
      return {
        ...result,
        data: {
          ...result.data,
          tieneDescuento: result.data.precioPromocion > 0,
          porcentajeDescuento: result.data.precioPromocion > 0 ? 
            Math.round((1 - result.data.precioPromocion / result.data.precio) * 100) : 0,
          disponible: (result.data.existencia || result.data.existenciaTotal) > 0
        }
      };
    }
    return result;
  }, [codigo]);

export const useProductosRelacionados = (productoActual, limit = 4) => 
  useProductosAPI(async () => {
    if (!productoActual) {
      return { success: true, data: [] };
    }

    const resultados = [];
    
    if (productoActual.categoria) {
      const porCategoria = await productosAPI.getTodosProductos({
        categoria: productoActual.categoria,
        limit: Math.ceil(limit / 2)
      });
      if (porCategoria.success && porCategoria.data) {
        resultados.push(...porCategoria.data.filter(p => p.codigo !== productoActual.codigo));
      }
    }

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

export const useBuscar = (termino) => 
  useProductosAPI(() => productosAPI.buscarProductos(termino), [termino]);

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

export const useTodosProductos = useProductos;
export const useProductosDisponibles = useProductosConExistencia;

// ==================== EXPORTACIÓN POR DEFECTO ====================

export default {
  useProductos,
  useTodosProductos,
  useProductosConExistencia,
  useProductosDisponibles,
  useProductosDestacados,
  useProductosEnPromocion,
  useProductosPorCategoria,
  useProductosPorMarca,
  useProductoPorCodigo,
  useProductoPorId,
  useProductoDetallado,
  useProductosRelacionados,
  useBuscarProductos,
  useBuscar,
  useBusquedaEnTiempoReal,
  useEstadisticas,
  useCategorias,
  useCategoriasReales,
  useMarcas,
  useProductosHealth,
  extraerTodasLasCategoriasReales
};