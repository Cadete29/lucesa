import React from 'react';
import { useProductos, useProductosConExistencia } from '../api/productosHooks';

const DebugCompleto = () => {
    // Usar ambos hooks
    const { 
        data: productosData, 
        loading: productosLoading, 
        error: productosError 
    } = useProductos({ limit: 5 });
    
    const { 
        data: existenciasData, 
        loading: existenciasLoading, 
        error: existenciasError 
    } = useProductosConExistencia({ limit: 5 });

    const productos = productosData?.data || [];
    const productosConExistencia = existenciasData?.data || [];

    console.log('🔍 DEBUG - Estado de useProductos:', { 
        loading: productosLoading, 
        error: productosError, 
        data: productosData,
        productosCount: productos.length
    });

    console.log('🔍 DEBUG - Estado de useProductosConExistencia:', { 
        loading: existenciasLoading, 
        error: existenciasError, 
        data: existenciasData,
        existenciasCount: productosConExistencia.length
    });

    return (
        <div style={{ 
            padding: '20px', 
            background: '#f5f5f5', 
            margin: '20px 0',
            border: '2px solid #dc3545',
            borderRadius: '8px'
        }}>
            <h3 style={{ color: '#dc3545', marginBottom: '15px' }}>🔍 DEBUG COMPLETO - Comparación de Hooks</h3>
            
            {/* Estado de los hooks */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px',
                marginBottom: '20px'
            }}>
                {/* Hook useProductos */}
                <div style={{ 
                    padding: '15px', 
                    background: productosLoading ? '#fff3cd' : '#d1ecf1',
                    border: `2px solid ${productosLoading ? '#ffc107' : '#17a2b8'}`,
                    borderRadius: '8px'
                }}>
                    <h4 style={{ color: productosLoading ? '#856404' : '#0c5460' }}>
                        useProductos() - /todos
                    </h4>
                    <div style={{ fontSize: '14px' }}>
                        <p><strong>Estado:</strong> {productosLoading ? '🔄 Cargando...' : productosError ? '❌ Error' : '✅ Listo'}</p>
                        <p><strong>Productos:</strong> {productos.length}</p>
                        <p><strong>Error:</strong> {productosError || 'Ninguno'}</p>
                        {productosData?.pagination && (
                            <p><strong>Total en BD:</strong> {productosData.pagination.total}</p>
                        )}
                    </div>
                </div>

                {/* Hook useProductosConExistencia */}
                <div style={{ 
                    padding: '15px', 
                    background: existenciasLoading ? '#fff3cd' : existenciasError ? '#f8d7da' : '#d4edda',
                    border: `2px solid ${existenciasLoading ? '#ffc107' : existenciasError ? '#dc3545' : '#28a745'}`,
                    borderRadius: '8px'
                }}>
                    <h4 style={{ color: existenciasLoading ? '#856404' : existenciasError ? '#721c24' : '#155724' }}>
                        useProductosConExistencia() - /existencias
                    </h4>
                    <div style={{ fontSize: '14px' }}>
                        <p><strong>Estado:</strong> {existenciasLoading ? '🔄 Cargando...' : existenciasError ? '❌ Error' : '✅ Listo'}</p>
                        <p><strong>Productos con existencia:</strong> {productosConExistencia.length}</p>
                        <p><strong>Error:</strong> {existenciasError || 'Ninguno'}</p>
                        {existenciasData?.pagination && (
                            <p><strong>Total con existencia:</strong> {existenciasData.pagination.total}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Mostrar datos de useProductos */}
            <div style={{ 
                marginBottom: '20px',
                padding: '15px',
                background: 'white',
                border: '2px solid #17a2b8',
                borderRadius: '8px'
            }}>
                <h4 style={{ color: '#17a2b8' }}>📦 Productos desde /todos (useProductos)</h4>
                {productos.length === 0 ? (
                    <div style={{ 
                        padding: '20px', 
                        textAlign: 'center',
                        color: '#856404',
                        background: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px'
                    }}>
                        {productosLoading ? '🔄 Cargando...' : '⚠️ No hay productos'}
                    </div>
                ) : (
                    <div>
                        <p><strong>Mostrando primeros {Math.min(3, productos.length)} productos:</strong></p>
                        {productos.slice(0, 3).map((producto, index) => (
                            <div key={index} style={{
                                margin: '10px 0',
                                padding: '10px',
                                background: '#f8f9fa',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px'
                            }}>
                                <pre style={{ fontSize: '12px', margin: 0 }}>
                                    {JSON.stringify({
                                        codigo: producto.codigo,
                                        nombre: producto.nombre,
                                        marca: producto.marca,
                                        categoria: producto.categoria,
                                        precio: producto.precio,
                                        imagen: producto.imagen ? '✅' : '❌',
                                        existencia: producto.existencia || 'No tiene'
                                    }, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Mostrar datos de useProductosConExistencia */}
            <div style={{ 
                padding: '15px',
                background: 'white',
                border: '2px solid #28a745',
                borderRadius: '8px'
            }}>
                <h4 style={{ color: '#28a745' }}>📊 Productos desde /existencias (useProductosConExistencia)</h4>
                {productosConExistencia.length === 0 ? (
                    <div style={{ 
                        padding: '20px', 
                        textAlign: 'center',
                        color: '#721c24',
                        background: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px'
                    }}>
                        {existenciasLoading ? '🔄 Cargando...' : '❌ NO HAY PRODUCTOS CON EXISTENCIA'}
                        {existenciasError && (
                            <div style={{ marginTop: '10px', fontSize: '12px' }}>
                                <strong>Error:</strong> {existenciasError}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <p><strong>Mostrando primeros {Math.min(3, productosConExistencia.length)} productos con existencia:</strong></p>
                        {productosConExistencia.slice(0, 3).map((producto, index) => (
                            <div key={index} style={{
                                margin: '10px 0',
                                padding: '10px',
                                background: '#d4edda',
                                border: '1px solid #c3e6cb',
                                borderRadius: '4px'
                            }}>
                                <pre style={{ fontSize: '12px', margin: 0 }}>
                                    {JSON.stringify({
                                        codigo: producto.codigo,
                                        nombre: producto.nombre,
                                        existencia: producto.existencia,
                                        existenciaTotal: producto.existenciaTotal,
                                        almacen: producto.almacen,
                                        precio: producto.precio,
                                        imagen: producto.imagen ? '✅' : '❌'
                                    }, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Información de debugging adicional */}
            <div style={{ 
                marginTop: '20px',
                padding: '15px',
                background: '#e9ecef',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '12px'
            }}>
                <h5>🔧 Información para Debugging:</h5>
                <ul>
                    <li><strong>useProductos:</strong> Llama a endpoint <code>/api/productos/todos</code></li>
                    <li><strong>useProductosConExistencia:</strong> Llama a endpoint <code>/api/productos/existencias</code></li>
                    <li>Revisa la consola del navegador para ver las respuestas completas</li>
                    <li>Verifica que el backend esté cargando correctamente los datos de existencia</li>
                </ul>
            </div>
        </div>
    );
};

export default DebugCompleto;