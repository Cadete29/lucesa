/**
 * Custom Hooks para CTOnline API
 * Para usar en componentes React con estado de carga y error
 */
import { useState, useEffect } from 'react';
import productosAPI from './productosAPI'; // ✅ Cambiar a productosAPI

/**
 * Hook para obtener datos con estado de carga y error
 * @param {function} apiFunction - Función de la API a ejecutar
 * @param {array} params - Parámetros para la función
 * @param {array} dependencies - Dependencias para re-ejecutar
 * @returns {object} Estado de la petición
 */
export const useCTOnlineAPI = (apiFunction, params = [], dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(...params);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          console.error('API Error:', err);
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

  return { 
    data, 
    loading, 
    error, 
    refetch: () => {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);
          const result = await apiFunction(...params);
          setData(result);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  };
};

// Hooks específicos pre-configurados usando productosAPI
export const useProductos = (options = {}) => 
  useCTOnlineAPI(productosAPI.getTodosProductos, [options], [JSON.stringify(options)]);

export const useProductosConExistencia = (options = {}) => 
  useCTOnlineAPI(productosAPI.getProductosConExistencia, [options], [JSON.stringify(options)]);

export const useBuscarProductos = (termino, options = {}) => 
  useCTOnlineAPI(productosAPI.buscarProductos, [termino, options], [termino, JSON.stringify(options)]);

export const useProductoPorCodigo = (codigo, incluirSinExistencia = false) => 
  useCTOnlineAPI(productosAPI.getProductoPorCodigo, [codigo, incluirSinExistencia], [codigo, incluirSinExistencia]);

export const useCategorias = () => 
  useCTOnlineAPI(productosAPI.getCategorias);

export const useMarcas = () => 
  useCTOnlineAPI(productosAPI.getMarcas);

export const useEstadisticas = () => 
  useCTOnlineAPI(productosAPI.getEstadisticas);

// Hooks legacy para compatibilidad (si los necesitas)
export const usePromociones = () => 
  useCTOnlineAPI(() => ({ data: [], success: true, message: 'No disponible' }));

export const useExistencias = () => 
  useCTOnlineAPI(() => ({ data: [], success: true, message: 'No disponible' }));

export const useAlmacenes = () => 
  useCTOnlineAPI(() => ({ data: [], success: true, message: 'No disponible' }));

export const useStatus = () => 
  useCTOnlineAPI(() => ({ status: 'ok', timestamp: new Date().toISOString() }));