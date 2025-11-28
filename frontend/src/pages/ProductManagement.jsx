import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanels.css';

const ProductManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('warranties');
  const [showAddWarranty, setShowAddWarranty] = useState(false);
  const [showAddReturn, setShowAddReturn] = useState(false);

  // Estados para el formulario de garantía
  const [warrantyForm, setWarrantyForm] = useState({
    ticket_soporte: '',
    producto: '',
    codigo: '',
    usuario: '',
    email: '',
    total_compra: '',
    fecha_compra: '',
    numero_serie_viejo: '',
    numero_serie_nuevo: '',
    estado: 'activa'
  });

  // Estados para el formulario de devolución
  const [returnForm, setReturnForm] = useState({
    ticket_soporte: '',
    producto: '',
    codigo: '',
    usuario: '',
    email: '',
    fecha_devolucion: '',
    motivo: '',
    estado: 'pendiente',
    total_compra: '',
    numero_serie: '',
    observaciones: ''
  });

  // Datos de ejemplo para garantías
  const [warranties, setWarranties] = useState([
    {
      id: 1,
      producto: 'Laptop Gaming Pro',
      codigo: 'PROD001',
      usuario: 'Juan Pérez',
      email: 'juan@email.com',
      fecha_compra: '2024-01-20',
      fecha_expiracion: '2025-01-20',
      total_compra: 1200,
      numero_serie_viejo: 'SN-001-OLD',
      numero_serie_nuevo: 'SN-001-NEW',
      estado: 'activa',
      ticket_soporte: 'TS-001'
    },
    {
      id: 2,
      producto: 'Smartphone Android',
      codigo: 'PROD002',
      usuario: 'María García',
      email: 'maria@email.com',
      fecha_compra: '2024-01-18',
      fecha_expiracion: '2026-01-18',
      total_compra: 599,
      numero_serie_viejo: 'SN-002-OLD',
      numero_serie_nuevo: 'SN-002-NEW',
      estado: 'activa',
      ticket_soporte: 'TS-002'
    },
    {
      id: 3,
      producto: 'Monitor 4K 27"',
      codigo: 'PROD004',
      usuario: 'Carlos López',
      email: 'carlos@email.com',
      fecha_compra: '2024-01-22',
      fecha_expiracion: '2027-01-22',
      total_compra: 399,
      numero_serie_viejo: 'SN-003-OLD',
      numero_serie_nuevo: 'SN-003-NEW',
      estado: 'expirada',
      ticket_soporte: 'TS-003'
    }
  ]);

  // Datos de ejemplo para devoluciones
  const [returns, setReturns] = useState([
    {
      id: 1,
      producto: 'Auriculares Inalámbricos',
      codigo: 'PROD003',
      usuario: 'Ana Martínez',
      email: 'ana@email.com',
      fecha_devolucion: '2024-01-25',
      motivo: 'Producto defectuoso - No enciende',
      estado: 'pendiente',
      total_compra: 149,
      numero_serie: 'SN-004-001',
      observaciones: 'El producto no enciende al sacarlo de la caja',
      ticket_soporte: 'TS-004'
    },
    {
      id: 2,
      producto: 'Smartphone Android',
      codigo: 'PROD002',
      usuario: 'Roberto Sánchez',
      email: 'roberto@email.com',
      fecha_devolucion: '2024-01-24',
      motivo: 'Cambio de modelo',
      estado: 'aprobada',
      total_compra: 599,
      numero_serie: 'SN-002-001',
      observaciones: 'Cliente prefiere otro modelo',
      ticket_soporte: 'TS-005'
    },
    {
      id: 3,
      producto: 'Laptop Gaming Pro',
      codigo: 'PROD001',
      usuario: 'Laura González',
      email: 'laura@email.com',
      fecha_devolucion: '2024-01-23',
      motivo: 'No cumple expectativas',
      estado: 'rechazada',
      total_compra: 1200,
      numero_serie: 'SN-001-001',
      observaciones: 'El cliente esperaba mejor rendimiento',
      ticket_soporte: 'TS-006'
    }
  ]);

  const handleWarrantyAction = (warrantyId, action) => {
    if (action === 'extender') {
      setWarranties(warranties.map(warranty => 
        warranty.id === warrantyId 
          ? { 
              ...warranty, 
              estado: 'activa',
              fecha_expiracion: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]
            } 
          : warranty
      ));
    } else {
      alert(`${action} garantía ${warrantyId}`);
    }
  };

  const handleReturnAction = (returnId, action) => {
    if (action === 'aprobar') {
      setReturns(returns.map(ret => 
        ret.id === returnId ? { ...ret, estado: 'aprobada' } : ret
      ));
    } else if (action === 'rechazar') {
      setReturns(returns.map(ret => 
        ret.id === returnId ? { ...ret, estado: 'rechazada' } : ret
      ));
    } else {
      alert(`${action} devolución ${returnId}`);
    }
  };

  const handleAddWarranty = () => {
    const newWarranty = {
      id: warranties.length + 1,
      ...warrantyForm,
      total_compra: parseFloat(warrantyForm.total_compra),
      fecha_expiracion: calculateExpirationDate(warrantyForm.fecha_compra, warrantyForm.estado)
    };
    
    setWarranties([...warranties, newWarranty]);
    setShowAddWarranty(false);
    resetWarrantyForm();
  };

  const handleAddReturn = () => {
    const newReturn = {
      id: returns.length + 1,
      ...returnForm,
      total_compra: parseFloat(returnForm.total_compra),
      fecha_devolucion: returnForm.fecha_devolucion || new Date().toISOString().split('T')[0]
    };
    
    setReturns([...returns, newReturn]);
    setShowAddReturn(false);
    resetReturnForm();
  };

  const calculateExpirationDate = (fechaCompra, estado) => {
    const fecha = new Date(fechaCompra);
    if (estado === 'activa') {
      fecha.setFullYear(fecha.getFullYear() + 1); // 1 año de garantía
    } else if (estado === 'expirada') {
      fecha.setFullYear(fecha.getFullYear() - 1); // Ya expirada
    }
    return fecha.toISOString().split('T')[0];
  };

  const resetWarrantyForm = () => {
    setWarrantyForm({
      ticket_soporte: '',
      producto: '',
      codigo: '',
      usuario: '',
      email: '',
      total_compra: '',
      fecha_compra: '',
      numero_serie_viejo: '',
      numero_serie_nuevo: '',
      estado: 'activa'
    });
  };

  const resetReturnForm = () => {
    setReturnForm({
      ticket_soporte: '',
      producto: '',
      codigo: '',
      usuario: '',
      email: '',
      fecha_devolucion: '',
      motivo: '',
      estado: 'pendiente',
      total_compra: '',
      numero_serie: '',
      observaciones: ''
    });
  };

  if (user?.rol !== 'admin') {
    return (
      <div className="admin-panel">
        <div className="no-access">
          <div className="no-access-icon">🔒</div>
          <h3>Acceso Restringido</h3>
          <p>No tienes permisos de administrador para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🛍️ Gestión de Garantías y Devoluciones</h1>
        <p>Administra garantías y devoluciones del sistema</p>
      </div>

      {/* Navegación por pestañas */}
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'warranties' ? 'active' : ''}`}
          onClick={() => setActiveTab('warranties')}
        >
          🛡️ Garantías ({warranties.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'returns' ? 'active' : ''}`}
          onClick={() => setActiveTab('returns')}
        >
          🔄 Devoluciones ({returns.length})
        </button>
      </div>

      {/* Contenido de Garantías */}
      {activeTab === 'warranties' && (
        <div className="tab-content">
          <div className="admin-toolbar">
            <button 
              className="btn-primary"
              onClick={() => setShowAddWarranty(true)}
            >
              + Añadir Garantía
            </button>
          </div>

          {/* Formulario de Garantía */}
          {showAddWarranty && (
            <div className="form-modal">
              <div className="form-content">
                <h3>Agregar Nueva Garantía</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Número de Ticket *</label>
                    <input
                      type="text"
                      value={warrantyForm.ticket_soporte}
                      onChange={(e) => setWarrantyForm({...warrantyForm, ticket_soporte: e.target.value})}
                      placeholder="Ej: TS-001"
                    />
                  </div>
                  <div className="form-group">
                    <label>Producto *</label>
                    <input
                      type="text"
                      value={warrantyForm.producto}
                      onChange={(e) => setWarrantyForm({...warrantyForm, producto: e.target.value})}
                      placeholder="Ej: Laptop Gaming Pro"
                    />
                  </div>
                  <div className="form-group">
                    <label>Código de Producto *</label>
                    <input
                      type="text"
                      value={warrantyForm.codigo}
                      onChange={(e) => setWarrantyForm({...warrantyForm, codigo: e.target.value})}
                      placeholder="Ej: PROD001"
                    />
                  </div>
                  <div className="form-group">
                    <label>Usuario *</label>
                    <input
                      type="text"
                      value={warrantyForm.usuario}
                      onChange={(e) => setWarrantyForm({...warrantyForm, usuario: e.target.value})}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={warrantyForm.email}
                      onChange={(e) => setWarrantyForm({...warrantyForm, email: e.target.value})}
                      placeholder="Ej: juan@email.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Total de Compra ($) *</label>
                    <input
                      type="number"
                      value={warrantyForm.total_compra}
                      onChange={(e) => setWarrantyForm({...warrantyForm, total_compra: e.target.value})}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Compra *</label>
                    <input
                      type="date"
                      value={warrantyForm.fecha_compra}
                      onChange={(e) => setWarrantyForm({...warrantyForm, fecha_compra: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Número de Serie Viejo</label>
                    <input
                      type="text"
                      value={warrantyForm.numero_serie_viejo}
                      onChange={(e) => setWarrantyForm({...warrantyForm, numero_serie_viejo: e.target.value})}
                      placeholder="Ej: SN-001-OLD"
                    />
                  </div>
                  <div className="form-group">
                    <label>Número de Serie Nuevo</label>
                    <input
                      type="text"
                      value={warrantyForm.numero_serie_nuevo}
                      onChange={(e) => setWarrantyForm({...warrantyForm, numero_serie_nuevo: e.target.value})}
                      placeholder="Ej: SN-001-NEW"
                    />
                  </div>
                  <div className="form-group">
                    <label>Estado de Garantía *</label>
                    <select
                      value={warrantyForm.estado}
                      onChange={(e) => setWarrantyForm({...warrantyForm, estado: e.target.value})}
                    >
                      <option value="activa">Activa</option>
                      <option value="expirada">Expirada</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="completada">Completada</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setShowAddWarranty(false);
                      resetWarrantyForm();
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleAddWarranty}
                    disabled={!warrantyForm.ticket_soporte || !warrantyForm.producto || !warrantyForm.codigo || !warrantyForm.usuario || !warrantyForm.email || !warrantyForm.total_compra || !warrantyForm.fecha_compra}
                  >
                    Agregar Garantía
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Producto</th>
                  <th>Usuario</th>
                  <th>Fecha Compra</th>
                  <th>Expiración</th>
                  <th>Total</th>
                  <th>Serie Viejo</th>
                  <th>Serie Nuevo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {warranties.map(warranty => (
                  <tr key={warranty.id}>
                    <td>
                      <code>{warranty.ticket_soporte}</code>
                    </td>
                    <td>
                      <strong>{warranty.producto}</strong>
                      <br />
                      <small>{warranty.codigo}</small>
                    </td>
                    <td>
                      {warranty.usuario}
                      <br />
                      <small>{warranty.email}</small>
                    </td>
                    <td>{new Date(warranty.fecha_compra).toLocaleDateString('es-ES')}</td>
                    <td>
                      {new Date(warranty.fecha_expiracion).toLocaleDateString('es-ES')}
                      {warranty.estado === 'expirada' && (
                        <div className="expired-badge">Expirada</div>
                      )}
                    </td>
                    <td>${warranty.total_compra.toFixed(2)}</td>
                    <td>
                      <code>{warranty.numero_serie_viejo}</code>
                    </td>
                    <td>
                      <code>{warranty.numero_serie_nuevo}</code>
                    </td>
                    <td>
                      <span className={`status-badge ${warranty.estado}`}>
                        {warranty.estado}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-small"
                          onClick={() => handleWarrantyAction(warranty.id, 'ver')}
                        >
                          👁️ Ver
                        </button>
                        <button 
                          className="btn-small btn-warning"
                          onClick={() => handleWarrantyAction(warranty.id, 'extender')}
                          disabled={warranty.estado === 'expirada'}
                        >
                          ⏳ Extender
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contenido de Devoluciones */}
      {activeTab === 'returns' && (
        <div className="tab-content">
          <div className="admin-toolbar">
            <button 
              className="btn-primary"
              onClick={() => setShowAddReturn(true)}
            >
              + Añadir Devolución
            </button>
          </div>

          {/* Formulario de Devolución */}
          {showAddReturn && (
            <div className="form-modal">
              <div className="form-content">
                <h3>Agregar Nueva Devolución</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Número de Ticket *</label>
                    <input
                      type="text"
                      value={returnForm.ticket_soporte}
                      onChange={(e) => setReturnForm({...returnForm, ticket_soporte: e.target.value})}
                      placeholder="Ej: TS-007"
                    />
                  </div>
                  <div className="form-group">
                    <label>Producto *</label>
                    <input
                      type="text"
                      value={returnForm.producto}
                      onChange={(e) => setReturnForm({...returnForm, producto: e.target.value})}
                      placeholder="Ej: Laptop Gaming Pro"
                    />
                  </div>
                  <div className="form-group">
                    <label>Código de Producto *</label>
                    <input
                      type="text"
                      value={returnForm.codigo}
                      onChange={(e) => setReturnForm({...returnForm, codigo: e.target.value})}
                      placeholder="Ej: PROD001"
                    />
                  </div>
                  <div className="form-group">
                    <label>Usuario *</label>
                    <input
                      type="text"
                      value={returnForm.usuario}
                      onChange={(e) => setReturnForm({...returnForm, usuario: e.target.value})}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={returnForm.email}
                      onChange={(e) => setReturnForm({...returnForm, email: e.target.value})}
                      placeholder="Ej: juan@email.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Devolución *</label>
                    <input
                      type="date"
                      value={returnForm.fecha_devolucion}
                      onChange={(e) => setReturnForm({...returnForm, fecha_devolucion: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Total de Compra ($) *</label>
                    <input
                      type="number"
                      value={returnForm.total_compra}
                      onChange={(e) => setReturnForm({...returnForm, total_compra: e.target.value})}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Número de Serie</label>
                    <input
                      type="text"
                      value={returnForm.numero_serie}
                      onChange={(e) => setReturnForm({...returnForm, numero_serie: e.target.value})}
                      placeholder="Ej: SN-001-001"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Motivo de Devolución *</label>
                    <select
                      value={returnForm.motivo}
                      onChange={(e) => setReturnForm({...returnForm, motivo: e.target.value})}
                    >
                      <option value="">Seleccionar motivo</option>
                      <option value="Producto defectuoso">Producto defectuoso</option>
                      <option value="Cambio de modelo">Cambio de modelo</option>
                      <option value="No cumple expectativas">No cumple expectativas</option>
                      <option value="Error en el pedido">Error en el pedido</option>
                      <option value="Arrepentimiento">Arrepentimiento</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Observaciones</label>
                    <textarea
                      value={returnForm.observaciones}
                      onChange={(e) => setReturnForm({...returnForm, observaciones: e.target.value})}
                      placeholder="Observaciones adicionales sobre la devolución..."
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Estado *</label>
                    <select
                      value={returnForm.estado}
                      onChange={(e) => setReturnForm({...returnForm, estado: e.target.value})}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="aprobada">Aprobada</option>
                      <option value="rechazada">Rechazada</option>
                      <option value="completada">Completada</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setShowAddReturn(false);
                      resetReturnForm();
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleAddReturn}
                    disabled={!returnForm.ticket_soporte || !returnForm.producto || !returnForm.codigo || !returnForm.usuario || !returnForm.email || !returnForm.fecha_devolucion || !returnForm.motivo || !returnForm.total_compra}
                  >
                    Agregar Devolución
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Producto</th>
                  <th>Usuario</th>
                  <th>Fecha Devolución</th>
                  <th>Total</th>
                  <th>Número Serie</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {returns.map(returnItem => (
                  <tr key={returnItem.id}>
                    <td>
                      <code>{returnItem.ticket_soporte}</code>
                    </td>
                    <td>
                      <strong>{returnItem.producto}</strong>
                      <br />
                      <small>{returnItem.codigo}</small>
                    </td>
                    <td>
                      {returnItem.usuario}
                      <br />
                      <small>{returnItem.email}</small>
                    </td>
                    <td>{new Date(returnItem.fecha_devolucion).toLocaleDateString('es-ES')}</td>
                    <td>${returnItem.total_compra.toFixed(2)}</td>
                    <td>
                      <code>{returnItem.numero_serie}</code>
                    </td>
                    <td className="motivo-cell">
                      {returnItem.motivo}
                      {returnItem.observaciones && (
                        <div className="observaciones">
                          <small>{returnItem.observaciones}</small>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${returnItem.estado}`}>
                        {returnItem.estado}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {returnItem.estado === 'pendiente' && (
                          <>
                            <button 
                              className="btn-small btn-success"
                              onClick={() => handleReturnAction(returnItem.id, 'aprobar')}
                            >
                              ✓ Aprobar
                            </button>
                            <button 
                              className="btn-small btn-danger"
                              onClick={() => handleReturnAction(returnItem.id, 'rechazar')}
                            >
                              ✗ Rechazar
                            </button>
                          </>
                        )}
                        <button 
                          className="btn-small"
                          onClick={() => handleReturnAction(returnItem.id, 'detalles')}
                        >
                          📋 Detalles
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;