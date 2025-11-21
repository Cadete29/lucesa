/**
 * Exportaciones principales de la API
 */

// Exportar la API directamente
export { default as productosAPI } from './productosAPI';

// Exportar hooks individualmente
export { 
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
  useMarcas,
  useProductosHealth
} from './productosHooks';

// Exportar todo por defecto
export { default as productosHooks } from './productosHooks';

// Para compatibilidad con imports antiguos
export * from './productosHooks';