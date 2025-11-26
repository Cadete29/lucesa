import React from 'react';
import { useProductos } from '../../api/productosHooks';

const ImageDebug = () => {
    const { data: productosData } = useProductos();
    const productos = productosData?.data || [];

    console.log('🔍 DEBUG - Estructura completa del primer producto:', productos[0] || {});
    console.log('🔍 DEBUG - Todos los productos:', productos);

    // Función para obtener URL de imagen con proxy
    const getImageUrl = (producto) => {
        if (!producto.imagen) return null;
        
        if (producto.imagen.includes('static.ctonline.mx') && producto.codigo) {
            return `https://testpaginaweb.shop/api/images/code/${producto.codigo}?size=full`;
        }
        
        return producto.imagen;
    };

    return (
        <div style={{ 
            padding: '20px', 
            background: '#f5f5f5', 
            margin: '20px 0',
            border: '2px solid #dc3545',
            borderRadius: '8px'
        }}>
            <h3 style={{ color: '#dc3545', marginBottom: '15px' }}>🔍 DEBUG de Imágenes - Primeros 3 productos</h3>
            <p><strong>Total productos recibidos:</strong> {productos.length}</p>
            <p><strong>Proxy activo:</strong> https://testpaginaweb.shop/api/images/code/</p>
            
            {productos.length === 0 ? (
                <div style={{ 
                    padding: '20px', 
                    background: '#fff', 
                    border: '2px dashed #dc3545',
                    textAlign: 'center',
                    color: '#dc3545'
                }}>
                    ⚠️ NO HAY PRODUCTOS PARA MOSTRAR
                </div>
            ) : (
                productos.slice(0, 3).map((producto, index) => {
                    const imageUrl = getImageUrl(producto);
                    const proxyUrl = producto.codigo ? 
                        `https://testpaginaweb.shop/api/images/code/${producto.codigo}?size=full` : 
                        null;

                    return (
                        <div key={index} style={{
                            margin: '15px 0',
                            padding: '15px',
                            background: 'white',
                            border: '2px solid #007bff',
                            borderRadius: '8px'
                        }}>
                            <h4 style={{ color: '#007bff', marginBottom: '10px' }}>
                                Producto {index + 1}: {producto.nombre}
                            </h4>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 300px' }}>
                                    <strong>Datos del producto:</strong>
                                    <pre style={{ 
                                        fontSize: '12px', 
                                        background: '#f8f9fa', 
                                        padding: '10px',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '4px',
                                        overflow: 'auto',
                                        maxHeight: '200px'
                                    }}>
                                        {JSON.stringify({
                                            idProducto: producto.idProducto,
                                            id: producto.id,
                                            codigo: producto.codigo,
                                            nombre: producto.nombre,
                                            marca: producto.marca,
                                            categoria: producto.categoria,
                                            subcategoria: producto.subcategoria,
                                            imagenOriginal: producto.imagen,
                                            imagenProxy: proxyUrl,
                                            tieneImagen: !!producto.imagen,
                                            tieneCodigo: !!producto.codigo,
                                            precio: producto.precio,
                                            moneda: producto.moneda,
                                            existencia: producto.existencia
                                        }, null, 2)}
                                    </pre>
                                </div>
                                
                                <div style={{ flex: '1 1 300px' }}>
                                    <strong>Imágenes:</strong>
                                    {producto.imagen ? (
                                        <div>
                                            <p><strong>URL Original:</strong> {producto.imagen}</p>
                                            <p><strong>URL Proxy:</strong> {proxyUrl || 'No disponible'}</p>
                                            
                                            {/* Probar imagen con proxy */}
                                            {proxyUrl && (
                                                <div style={{ margin: '10px 0' }}>
                                                    <h5>🔄 Imagen via Proxy:</h5>
                                                    <div style={{ 
                                                        border: '3px solid #28a745', 
                                                        padding: '10px', 
                                                        margin: '10px 0',
                                                        borderRadius: '4px',
                                                        background: '#f8f9fa'
                                                    }}>
                                                        <img 
                                                            src={proxyUrl}
                                                            alt={`Proxy ${producto.nombre}`}
                                                            style={{ 
                                                                maxWidth: '100%', 
                                                                maxHeight: '200px',
                                                                display: 'block',
                                                                margin: '0 auto'
                                                            }}
                                                            onError={(e) => {
                                                                console.log('❌ ERROR cargando imagen via proxy:', proxyUrl);
                                                                e.target.style.border = '3px solid #dc3545';
                                                                e.target.nextSibling.textContent = '❌ ERROR - Proxy no funciona';
                                                                e.target.nextSibling.style.color = '#dc3545';
                                                            }}
                                                            onLoad={(e) => {
                                                                console.log('✅ IMAGEN CARGADA via proxy:', proxyUrl);
                                                                e.target.style.border = '3px solid #28a745';
                                                                e.target.nextSibling.textContent = '✅ IMAGEN CARGADA CORRECTAMENTE via Proxy';
                                                                e.target.nextSibling.style.color = '#28a745';
                                                            }}
                                                        />
                                                        <p style={{ 
                                                            textAlign: 'center', 
                                                            marginTop: '10px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            Probando proxy...
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Probar imagen original */}
                                            <div style={{ margin: '10px 0' }}>
                                                <h5>🔗 Imagen Original:</h5>
                                                <div style={{ 
                                                    border: '3px solid #6c757d', 
                                                    padding: '10px', 
                                                    margin: '10px 0',
                                                    borderRadius: '4px',
                                                    background: '#f8f9fa'
                                                }}>
                                                    <img 
                                                        src={producto.imagen}
                                                        alt={`Original ${producto.nombre}`}
                                                        style={{ 
                                                            maxWidth: '100%', 
                                                            maxHeight: '200px',
                                                            display: 'block',
                                                            margin: '0 auto'
                                                        }}
                                                        onError={(e) => {
                                                            console.log('❌ ERROR cargando imagen original:', producto.imagen);
                                                            e.target.style.border = '3px solid #dc3545';
                                                            e.target.nextSibling.textContent = '❌ ERROR - Imagen original no carga';
                                                            e.target.nextSibling.style.color = '#dc3545';
                                                        }}
                                                        onLoad={(e) => {
                                                            console.log('✅ IMAGEN CARGADA original:', producto.imagen);
                                                            e.target.style.border = '3px solid #28a745';
                                                            e.target.nextSibling.textContent = '✅ IMAGEN ORIGINAL CARGADA';
                                                            e.target.nextSibling.style.color = '#28a745';
                                                        }}
                                                    />
                                                    <p style={{ 
                                                        textAlign: 'center', 
                                                        marginTop: '10px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Probando original...
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ 
                                            color: '#dc3545', 
                                            fontWeight: 'bold',
                                            padding: '20px',
                                            background: '#f8d7da',
                                            border: '1px solid #f5c6cb',
                                            borderRadius: '4px',
                                            textAlign: 'center'
                                        }}>
                                            ❌ NO TIENE IMAGEN ASIGNADA EN LA BASE DE DATOS
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default ImageDebug;