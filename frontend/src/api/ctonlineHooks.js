/**
 * Custom Hooks para CTOnline API
 * Para usar en componentes React con estado de carga y error
 */
import { useState, useEffect } from 'react';
import ctonlineAPI from './ctonlineApi';

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

// Hooks específicos pre-configurados
export const usePromociones = () => 
  useCTOnlineAPI(() => ctonlineAPI.getPromociones());

export const useExistencias = () => 
  useCTOnlineAPI(() => ctonlineAPI.getExistencias());

export const useAlmacenes = () => 
  useCTOnlineAPI(() => ctonlineAPI.getAlmacenes());

export const useDetalleProducto = (codigo, almacen) => 
  useCTOnlineAPI(ctonlineAPI.getDetalleProducto, [codigo, almacen], [codigo, almacen]);

export const usePromocionPorCodigo = (codigo) => 
  useCTOnlineAPI(ctonlineAPI.getPromocionPorCodigo, [codigo], [codigo]);

export const useStatus = () => 
  useCTOnlineAPI(() => ctonlineAPI.getStatus());

// Nuevos hooks para productos y categorías
export const useProductos = () => 
  useCTOnlineAPI(() => ctonlineAPI.getProductos());

export const useProductosPorCategoria = (categoria) => 
  useCTOnlineAPI(ctonlineAPI.getProductosPorCategoria, [categoria], [categoria]);

export const useBuscarProductos = (termino) => 
  useCTOnlineAPI(ctonlineAPI.buscarProductos, [termino], [termino]);

export const useCategorias = () => 
  useCTOnlineAPI(() => ctonlineAPI.getCategorias());