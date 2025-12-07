import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProductManagement.css';


const ProductManagement = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('warranties');
  const [showAddWarranty, setShowAddWarranty] = useState(false);
  const [showAddReturn, setShowAddReturn] = useState(false);
  const [warrantySearchTerm, setWarrantySearchTerm] = useState('');
  const [returnSearchTerm, setReturnSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  
  // Estados para búsqueda de órdenes en garantías
  const [warrantyOrderSearchTerm, setWarrantyOrderSearchTerm] = useState('');
  const [filteredWarrantyOrders, setFilteredWarrantyOrders] = useState([]);
  const [selectedWarrantyOrder, setSelectedWarrantyOrder] = useState(null);
  const [showWarrantyOrderSearch, setShowWarrantyOrderSearch] = useState(false);
  
  // Estados para búsqueda de órdenes en devoluciones
  const [returnOrderSearchTerm, setReturnOrderSearchTerm] = useState('');
  const [filteredReturnOrders, setFilteredReturnOrders] = useState([]);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [showReturnOrderSearch, setShowReturnOrderSearch] = useState(false);

  // Nuevos estados para el modal de detalles
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [detailModalType, setDetailModalType] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://testpaginaweb.shop/api'
    : 'http://localhost:4004/api';

  // Estados para el formulario de garantía
  const [warrantyForm, setWarrantyForm] = useState({
    order_number: '',
    product_code: '',
    product_name: '',
    customer_name: '',
    customer_email: '',
    purchase_date: '',
    purchase_amount: '',
    warranty_application_date: '',
    old_serial_number: '',
    new_serial_number: '',
    status: 'activa',
    ticket_number: ''
  });

  // Estados para el formulario de devolución
  const [returnForm, setReturnForm] = useState({
    order_number: '',
    product_code: '',
    product_name: '',
    customer_name: '',
    customer_email: '',
    purchase_amount: '',
    fecha_devolucion: '',
    motivo: '',
    estado: 'pendiente',
    numero_serie: '',
    observaciones: '',
    ticket_soporte: ''
  });

  // Estados para garantías
  const [warranties, setWarranties] = useState([]);
  const [warrantiesLoading, setWarrantiesLoading] = useState(true);

  // Estados para devoluciones
  const [returns, setReturns] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(true);

  // Cargar órdenes y garantías al montar el componente
  useEffect(() => {
    if (user?.rol === 'admin') {
      loadOrders();
      loadWarranties();
      loadReturns();
    }
  }, [user, token]);

  // Filtrar órdenes para garantías
  useEffect(() => {
    if (warrantyOrderSearchTerm) {
      const filtered = orders.filter(order => 
        order.order_number?.toLowerCase().includes(warrantyOrderSearchTerm.toLowerCase()) ||
        (order.shipping_address?.nombre || order.customer_name || order.user_nombre)?.toLowerCase().includes(warrantyOrderSearchTerm.toLowerCase()) ||
        (order.shipping_address?.email || order.customer_email || order.user_email)?.toLowerCase().includes(warrantyOrderSearchTerm.toLowerCase())
      );
      setFilteredWarrantyOrders(filtered);
    } else {
      setFilteredWarrantyOrders([]);
    }
  }, [warrantyOrderSearchTerm, orders]);

  // Filtrar órdenes para devoluciones
  useEffect(() => {
    if (returnOrderSearchTerm) {
      const filtered = orders.filter(order => 
        order.order_number?.toLowerCase().includes(returnOrderSearchTerm.toLowerCase()) ||
        (order.shipping_address?.nombre || order.customer_name || order.user_nombre)?.toLowerCase().includes(returnOrderSearchTerm.toLowerCase()) ||
        (order.shipping_address?.email || order.customer_email || order.user_email)?.toLowerCase().includes(returnOrderSearchTerm.toLowerCase())
      );
      setFilteredReturnOrders(filtered);
    } else {
      setFilteredReturnOrders([]);
    }
  }, [returnOrderSearchTerm, orders]);

  // Cargar todas las órdenes para el selector
  const loadOrders = async () => {
    try {
      console.log('🔍 Cargando órdenes para ProductManagement...');
      const response = await fetch(`${API_BASE_URL}/orders/admin/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📊 Órdenes cargadas:', data.orders?.length || 0);
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setOrders(getSampleOrders());
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      setOrders(getSampleOrders());
    }
  };

  // Cargar garantías desde la base de datos
  const loadWarranties = async () => {
    try {
      setWarrantiesLoading(true);
      console.log('🛡️ Cargando garantías...');
      
      try {
        const response = await fetch(`${API_BASE_URL}/warranties`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setWarranties(data.warranties || []);
            console.log('✅ Garantías cargadas desde API:', data.warranties?.length || 0);
            return;
          }
        }
      } catch (apiError) {
        console.warn('API de garantías no disponible:', apiError.message);
      }
      
      const savedWarranties = localStorage.getItem('lucesa_warranties');
      if (savedWarranties) {
        setWarranties(JSON.parse(savedWarranties));
        console.log('📦 Garantías cargadas desde localStorage');
      } else {
        setWarranties(getSampleWarranties());
        console.log('📋 Usando datos de muestra para garantías');
      }
    } catch (error) {
      console.error('Error cargando garantías:', error);
      setWarranties(getSampleWarranties());
    } finally {
      setWarrantiesLoading(false);
    }
  };

  // Cargar devoluciones desde la base de datos - CORREGIDO
  const loadReturns = async () => {
    try {
      setReturnsLoading(true);
      console.log('🔄 Cargando devoluciones desde backend...');
      
      try {
        const response = await fetch(`${API_BASE_URL}/returns`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Respuesta del backend:', data);
          
          if (data.success) {
            // Convertir campos del backend al formato del frontend
            const formattedReturns = data.returns.map(item => ({
              id: item.id,
              order_id: item.order_id,
              order_number: item.order_number,
              product_code: item.product_code,
              product_name: item.product_name,
              customer_name: item.customer_name,
              customer_email: item.customer_email,
              purchase_amount: item.purchase_amount,
              fecha_devolucion: item.return_date, // Convertir return_date → fecha_devolucion
              motivo: item.return_reason, // Convertir return_reason → motivo
              estado: item.status, // Convertir status → estado
              numero_serie: item.serial_number, // Convertir serial_number → numero_serie
              observaciones: item.observations,
              ticket_soporte: item.ticket_number, // Convertir ticket_number → ticket_soporte
              created_at: item.created_at,
              updated_at: item.updated_at
            }));
            
            setReturns(formattedReturns);
            console.log('✅ Devoluciones cargadas desde API y convertidas:', formattedReturns.length);
            return;
          }
        }
      } catch (apiError) {
        console.warn('API de devoluciones no disponible:', apiError.message);
      }
      
      // Fallback: cargar desde localStorage o datos de muestra
      const savedReturns = localStorage.getItem('lucesa_returns');
      if (savedReturns) {
        setReturns(JSON.parse(savedReturns));
        console.log('📦 Devoluciones cargadas desde localStorage');
      } else {
        setReturns(getSampleReturns());
        console.log('📋 Usando datos de muestra para devoluciones');
      }
    } catch (error) {
      console.error('Error cargando devoluciones:', error);
      setReturns(getSampleReturns());
    } finally {
      setReturnsLoading(false);
    }
  };

  // Guardar garantías en localStorage
  const saveWarrantiesToStorage = (warrantiesData) => {
    localStorage.setItem('lucesa_warranties', JSON.stringify(warrantiesData));
  };

  // Guardar devoluciones en localStorage
  const saveReturnsToStorage = (returnsData) => {
    localStorage.setItem('lucesa_returns', JSON.stringify(returnsData));
  };

  // Generar número de ticket único para garantías
  const generateWarrantyTicketNumber = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `TS-${timestamp}-${random}`;
  };

  // Generar número de ticket único para devoluciones
  const generateReturnTicketNumber = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `DEV-${timestamp}-${random}`;
  };

  // Datos de ejemplo para órdenes
  const getSampleOrders = () => {
    return [
      {
        id: 1,
        order_number: 'LUCESA-001',
        customer_name: 'Juan Pérez',
        customer_email: 'juan@email.com',
        total_amount: 1200.00,
        created_at: '2024-01-20T10:00:00Z',
        shipping_address: {
          nombre: 'Juan Pérez',
          email: 'juan@email.com',
          telefono: '555-123-4567'
        },
        items: [
          {
            product_code: 'PROD001',
            product_name: 'Laptop Gaming Pro',
            product_brand: 'GamingBrand',
            unit_price: 1200,
            quantity: 1
          }
        ]
      },
      {
        id: 2,
        order_number: 'LUCESA-002',
        customer_name: 'María García',
        customer_email: 'maria@email.com',
        total_amount: 599.00,
        created_at: '2024-01-18T14:30:00Z',
        shipping_address: {
          nombre: 'María García',
          email: 'maria@email.com',
          telefono: '555-987-6543'
        },
        items: [
          {
            product_code: 'PROD002',
            product_name: 'Smartphone Android',
            product_brand: 'TechCorp',
            unit_price: 599,
            quantity: 1
          }
        ]
      }
    ];
  };

  // Datos de ejemplo para garantías
  const getSampleWarranties = () => {
    return [
      {
        id: 1,
        order_id: 1,
        order_number: 'LUCESA-001',
        product_code: 'PROD001',
        product_name: 'Laptop Gaming Pro',
        customer_name: 'Juan Pérez',
        customer_email: 'juan@email.com',
        purchase_date: '2024-01-20',
        purchase_amount: 1200.00,
        warranty_application_date: '2024-03-15',
        old_serial_number: 'SN-001-OLD',
        new_serial_number: 'SN-001-NEW',
        status: 'activa',
        ticket_number: 'TS-1738361600000-ABCDE',
        created_at: '2024-03-15T10:00:00Z',
        updated_at: '2024-03-15T10:00:00Z'
      },
      {
        id: 2,
        order_id: 2,
        order_number: 'LUCESA-002',
        product_code: 'PROD002',
        product_name: 'Smartphone Android',
        customer_name: 'María García',
        customer_email: 'maria@email.com',
        purchase_date: '2024-01-18',
        purchase_amount: 599.00,
        warranty_application_date: '2024-03-10',
        old_serial_number: 'SN-002-OLD',
        new_serial_number: 'SN-002-NEW',
        status: 'aplicada',
        ticket_number: 'TS-1738275200000-FGHIJ',
        created_at: '2024-03-10T14:30:00Z',
        updated_at: '2024-03-10T14:30:00Z'
      }
    ];
  };

  // Datos de ejemplo para devoluciones
  const getSampleReturns = () => {
    return [
      {
        id: 1,
        order_id: 1,
        order_number: 'LUCESA-001',
        product_code: 'PROD001',
        product_name: 'Laptop Gaming Pro',
        customer_name: 'Juan Pérez',
        customer_email: 'juan@email.com',
        purchase_amount: 1200.00,
        fecha_devolucion: '2024-03-20',
        motivo: 'Pantalla defectuosa',
        estado: 'pendiente',
        numero_serie: 'SN-001-001',
        observaciones: 'La pantalla presenta líneas verticales',
        ticket_soporte: 'DEV-1738448000000-KLMNO',
        created_at: '2024-03-20T09:00:00Z',
        updated_at: '2024-03-20T09:00:00Z'
      },
      {
        id: 2,
        order_id: 2,
        order_number: 'LUCESA-002',
        product_code: 'PROD002',
        product_name: 'Smartphone Android',
        customer_name: 'María García',
        customer_email: 'maria@email.com',
        purchase_amount: 599.00,
        fecha_devolucion: '2024-03-18',
        motivo: 'Cambio de modelo',
        estado: 'aprobada',
        numero_serie: 'SN-002-001',
        observaciones: 'Cliente prefiere modelo más reciente',
        ticket_soporte: 'DEV-1738275200000-PQRST',
        created_at: '2024-03-18T14:20:00Z',
        updated_at: '2024-03-18T14:20:00Z'
      }
    ];
  };

  // Manejar selección de orden para garantías
  const handleWarrantyOrderSelect = (order) => {
    setSelectedWarrantyOrder(order);
    const firstItem = order.items?.[0];
    if (firstItem) {
      setWarrantyForm({
        order_number: order.order_number,
        product_code: firstItem.product_code,
        product_name: firstItem.product_name,
        customer_name: order.customer_name || order.shipping_address?.nombre || order.user_nombre,
        customer_email: order.customer_email || order.shipping_address?.email || order.user_email,
        purchase_date: order.created_at ? order.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        purchase_amount: order.total_amount,
        warranty_application_date: new Date().toISOString().split('T')[0],
        old_serial_number: '',
        new_serial_number: '',
        status: 'activa',
        ticket_number: generateWarrantyTicketNumber()
      });
    }
    setShowWarrantyOrderSearch(false);
    setWarrantyOrderSearchTerm('');
  };

  // Manejar selección de orden para devoluciones
  const handleReturnOrderSelect = (order) => {
    setSelectedReturnOrder(order);
    const firstItem = order.items?.[0];
    if (firstItem) {
      setReturnForm({
        order_number: order.order_number,
        product_code: firstItem.product_code,
        product_name: firstItem.product_name,
        customer_name: order.customer_name || order.shipping_address?.nombre || order.user_nombre,
        customer_email: order.customer_email || order.shipping_address?.email || order.user_email,
        purchase_amount: order.total_amount,
        fecha_devolucion: new Date().toISOString().split('T')[0],
        motivo: '',
        estado: 'pendiente',
        numero_serie: '',
        observaciones: '',
        ticket_soporte: generateReturnTicketNumber()
      });
    }
    setShowReturnOrderSearch(false);
    setReturnOrderSearchTerm('');
  };

  // Agregar nueva garantía
  const handleAddWarranty = async () => {
    try {
      setLoading(true);
      
      const newWarranty = {
        id: warranties.length ? Math.max(...warranties.map(w => w.id)) + 1 : 1,
        order_id: selectedWarrantyOrder?.id,
        order_number: warrantyForm.order_number,
        product_code: warrantyForm.product_code,
        product_name: warrantyForm.product_name,
        customer_name: warrantyForm.customer_name,
        customer_email: warrantyForm.customer_email,
        purchase_date: warrantyForm.purchase_date,
        purchase_amount: parseFloat(warrantyForm.purchase_amount),
        warranty_application_date: warrantyForm.warranty_application_date,
        old_serial_number: warrantyForm.old_serial_number,
        new_serial_number: warrantyForm.new_serial_number,
        status: warrantyForm.status,
        ticket_number: warrantyForm.ticket_number,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📋 Nueva garantía:', newWarranty);
      
      // Guardar en API si está disponible
      try {
        const response = await fetch(`${API_BASE_URL}/warranties`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newWarranty)
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            newWarranty.id = data.warranty?.id || newWarranty.id;
            console.log('✅ Garantía guardada en API:', data.warranty);
          }
        }
      } catch (apiError) {
        console.warn('API de garantías no disponible, guardando localmente:', apiError.message);
      }
      
      const updatedWarranties = [...warranties, newWarranty];
      setWarranties(updatedWarranties);
      saveWarrantiesToStorage(updatedWarranties);
      
      setShowAddWarranty(false);
      resetWarrantyForm();
      setSelectedWarrantyOrder(null);
      
      alert(`✅ Garantía agregada exitosamente\nTicket: ${newWarranty.ticket_number}`);
      
    } catch (error) {
      console.error('Error agregando garantía:', error);
      alert('❌ Error al agregar garantía');
    } finally {
      setLoading(false);
    }
  };

  // Agregar nueva devolución - CORREGIDO PARA ENVIAR DATOS CORRECTOS AL BACKEND
  const handleAddReturn = async () => {
    try {
      setLoading(true);
      
      // Mapear campos del frontend a los que espera el backend
      const returnDataForBackend = {
        order_number: returnForm.order_number,
        product_code: returnForm.product_code,
        product_name: returnForm.product_name,
        customer_name: returnForm.customer_name,
        customer_email: returnForm.customer_email,
        purchase_amount: parseFloat(returnForm.purchase_amount),
        return_date: returnForm.fecha_devolucion, // Cambiado: fecha_devolucion → return_date
        serial_number: returnForm.numero_serie, // Cambiado: numero_serie → serial_number
        return_reason: returnForm.motivo, // Cambiado: motivo → return_reason
        observations: returnForm.observaciones,
        status: returnForm.estado, // Cambiado: estado → status
        ticket_number: returnForm.ticket_soporte // Cambiado: ticket_soporte → ticket_number
      };
      
      console.log('📋 Datos a enviar al backend:', returnDataForBackend);
      
      // Guardar en API
      const response = await fetch(`${API_BASE_URL}/returns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(returnDataForBackend)
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Respuesta del backend:', data);
      
      if (data.success) {
        // Actualizar estado local con la respuesta del backend
        const newReturn = {
          id: data.return?.id || (returns.length ? Math.max(...returns.map(r => r.id)) + 1 : 1),
          order_id: selectedReturnOrder?.id,
          order_number: data.return?.order_number || returnDataForBackend.order_number,
          product_code: data.return?.product_code || returnDataForBackend.product_code,
          product_name: data.return?.product_name || returnDataForBackend.product_name,
          customer_name: data.return?.customer_name || returnDataForBackend.customer_name,
          customer_email: data.return?.customer_email || returnDataForBackend.customer_email,
          purchase_amount: data.return?.purchase_amount || returnDataForBackend.purchase_amount,
          fecha_devolucion: data.return?.return_date || returnDataForBackend.return_date,
          motivo: data.return?.return_reason || returnDataForBackend.return_reason,
          estado: data.return?.status || returnDataForBackend.status,
          numero_serie: data.return?.serial_number || returnDataForBackend.serial_number,
          observaciones: data.return?.observations || returnDataForBackend.observations,
          ticket_soporte: data.return?.ticket_number || returnDataForBackend.ticket_number,
          created_at: data.return?.created_at || new Date().toISOString(),
          updated_at: data.return?.updated_at || new Date().toISOString()
        };
        
        const updatedReturns = [...returns, newReturn];
        setReturns(updatedReturns);
        saveReturnsToStorage(updatedReturns);
        
        setShowAddReturn(false);
        resetReturnForm();
        setSelectedReturnOrder(null);
        
        alert(`✅ Devolución agregada exitosamente\nTicket: ${newReturn.ticket_soporte}`);
      } else {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }
      
    } catch (error) {
      console.error('❌ Error agregando devolución:', error);
      alert(`❌ Error al agregar devolución: ${error.message}`);
      
      // Fallback: guardar localmente si el backend falla
      try {
        const newReturn = {
          id: returns.length ? Math.max(...returns.map(r => r.id)) + 1 : 1,
          order_id: selectedReturnOrder?.id,
          order_number: returnForm.order_number,
          product_code: returnForm.product_code,
          product_name: returnForm.product_name,
          customer_name: returnForm.customer_name,
          customer_email: returnForm.customer_email,
          purchase_amount: parseFloat(returnForm.purchase_amount),
          fecha_devolucion: returnForm.fecha_devolucion,
          motivo: returnForm.motivo,
          estado: returnForm.estado,
          numero_serie: returnForm.numero_serie,
          observaciones: returnForm.observaciones,
          ticket_soporte: returnForm.ticket_soporte,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const updatedReturns = [...returns, newReturn];
        setReturns(updatedReturns);
        saveReturnsToStorage(updatedReturns);
        
        console.log('📦 Devolución guardada localmente como fallback');
        alert('⚠️ El backend no está disponible. La devolución se guardó localmente.');
        
      } catch (localError) {
        console.error('Error en fallback local:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado de garantía
  const handleWarrantyStatusUpdate = async (warrantyId, newStatus) => {
    try {
      const updatedWarranties = warranties.map(warranty =>
        warranty.id === warrantyId ? { 
          ...warranty, 
          status: newStatus,
          updated_at: new Date().toISOString()
        } : warranty
      );
      
      setWarranties(updatedWarranties);
      saveWarrantiesToStorage(updatedWarranties);
      
      if (newStatus === 'aplicada') {
        const warranty = warranties.find(w => w.id === warrantyId);
        if (warranty?.order_id) {
          await updateOrderStatus(warranty.order_id, 'processing');
        }
      }
      
      alert(`✅ Estado de garantía actualizado a: ${getWarrantyStatusLabel(newStatus)}`);
      
    } catch (error) {
      console.error('Error actualizando estado de garantía:', error);
      alert('❌ Error al actualizar estado');
    }
  };

  // Actualizar estado de devolución - CORREGIDO PARA ENVIAR DATOS CORRECTOS
  const handleReturnStatusUpdate = async (returnId, newStatus) => {
    try {
      // Enviar actualización al backend
      try {
        const response = await fetch(`${API_BASE_URL}/returns/${returnId}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus }) // Enviar 'status' en lugar de 'estado'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log('✅ Estado actualizado en backend:', data.return);
          }
        }
      } catch (apiError) {
        console.warn('Error actualizando en backend, continuando localmente:', apiError.message);
      }

      // Actualizar localmente
      const updatedReturns = returns.map(ret =>
        ret.id === returnId ? { 
          ...ret, 
          estado: newStatus, // Mantener 'estado' en frontend
          updated_at: new Date().toISOString()
        } : ret
      );
      
      setReturns(updatedReturns);
      saveReturnsToStorage(updatedReturns);
      
      alert(`✅ Estado de devolución actualizado a: ${getReturnStatusLabel(newStatus)}`);
      
    } catch (error) {
      console.error('Error actualizando estado de devolución:', error);
      alert('❌ Error al actualizar estado');
    }
  };

  // Actualizar estado de orden
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log(`🔄 Actualizando estado de orden ${orderId} a ${newStatus}`);
      
      const response = await fetch(`${API_BASE_URL}/orders/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Orden ${orderId} actualizada a ${newStatus}`);
        loadOrders();
      } else {
        console.warn(`⚠️ No se pudo actualizar orden: ${data.message}`);
      }
    } catch (error) {
      console.error('Error actualizando estado de orden:', error);
    }
  };

  // Manejar acciones de garantía
  const handleWarrantyAction = (warrantyId, action) => {
    if (action === 'extender') {
      const updatedWarranties = warranties.map(warranty => 
        warranty.id === warrantyId 
          ? { 
              ...warranty, 
              status: 'activa',
              warranty_application_date: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            } 
          : warranty
      );
      setWarranties(updatedWarranties);
      saveWarrantiesToStorage(updatedWarranties);
      alert(`✅ Garantía ${warrantyId} extendida`);
    } else {
      alert(`${action} garantía ${warrantyId}`);
    }
  };

  // Manejar acciones de devolución
  const handleReturnAction = (returnId, action) => {
    if (action === 'aprobar') {
      handleReturnStatusUpdate(returnId, 'aprobada');
    } else if (action === 'rechazar') {
      handleReturnStatusUpdate(returnId, 'rechazada');
    } else if (action === 'completar') {
      handleReturnStatusUpdate(returnId, 'completada');
    } else {
      alert(`${action} devolución ${returnId}`);
    }
  };

  // Manejar mostrar detalles
  const handleShowDetails = (item, type) => {
    setSelectedDetailItem(item);
    setDetailModalType(type);
    setEditForm({...item});
    setIsEditing(false);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedDetailItem(null);
    setDetailModalType('');
    setIsEditing(false);
    setEditForm({});
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Guardar edición - CORREGIDO PARA ENVIAR DATOS CORRECTOS
  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      
      if (detailModalType === 'warranty') {
        const updatedWarranties = warranties.map(warranty =>
          warranty.id === selectedDetailItem.id ? { 
            ...editForm, 
            updated_at: new Date().toISOString(),
            purchase_amount: parseFloat(editForm.purchase_amount) || 0
          } : warranty
        );
        setWarranties(updatedWarranties);
        saveWarrantiesToStorage(updatedWarranties);
      } else if (detailModalType === 'return') {
        // Para devoluciones, enviar datos al backend
        const returnUpdateData = {
          status: editForm.estado, // Enviar 'status' en lugar de 'estado'
          return_reason: editForm.motivo, // Enviar 'return_reason' en lugar de 'motivo'
          serial_number: editForm.numero_serie, // Enviar 'serial_number' en lugar de 'numero_serie'
          return_date: editForm.fecha_devolucion, // Enviar 'return_date' en lugar de 'fecha_devolucion'
          observations: editForm.observaciones,
          ticket_number: editForm.ticket_soporte // Enviar 'ticket_number' en lugar de 'ticket_soporte'
        };
        
        try {
          const response = await fetch(`${API_BASE_URL}/returns/${selectedDetailItem.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(returnUpdateData)
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Devolución actualizada en backend:', data.return);
          }
        } catch (apiError) {
          console.warn('Error actualizando en backend:', apiError.message);
        }
        
        // Actualizar localmente
        const updatedReturns = returns.map(ret =>
          ret.id === selectedDetailItem.id ? { 
            ...editForm, 
            updated_at: new Date().toISOString(),
            purchase_amount: parseFloat(editForm.purchase_amount) || 0
          } : ret
        );
        setReturns(updatedReturns);
        saveReturnsToStorage(updatedReturns);
      }
      
      setIsEditing(false);
      setSelectedDetailItem(editForm);
      alert('✅ Cambios guardados exitosamente');
      
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('❌ Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar garantías por búsqueda
  const filteredWarranties = warranties.filter(warranty => 
    warranty.ticket_number?.toLowerCase().includes(warrantySearchTerm.toLowerCase()) ||
    warranty.order_number?.toLowerCase().includes(warrantySearchTerm.toLowerCase()) ||
    warranty.product_name?.toLowerCase().includes(warrantySearchTerm.toLowerCase()) ||
    warranty.customer_name?.toLowerCase().includes(warrantySearchTerm.toLowerCase()) ||
    warranty.customer_email?.toLowerCase().includes(warrantySearchTerm.toLowerCase()) ||
    warranty.old_serial_number?.toLowerCase().includes(warrantySearchTerm.toLowerCase()) ||
    warranty.new_serial_number?.toLowerCase().includes(warrantySearchTerm.toLowerCase())
  );

  // Filtrar devoluciones por búsqueda
  const filteredReturns = returns.filter(returnItem => 
    returnItem.ticket_soporte?.toLowerCase().includes(returnSearchTerm.toLowerCase()) ||
    returnItem.order_number?.toLowerCase().includes(returnSearchTerm.toLowerCase()) ||
    returnItem.product_name?.toLowerCase().includes(returnSearchTerm.toLowerCase()) ||
    returnItem.customer_name?.toLowerCase().includes(returnSearchTerm.toLowerCase()) ||
    returnItem.customer_email?.toLowerCase().includes(returnSearchTerm.toLowerCase()) ||
    returnItem.numero_serie?.toLowerCase().includes(returnSearchTerm.toLowerCase()) ||
    returnItem.motivo?.toLowerCase().includes(returnSearchTerm.toLowerCase())
  );

  const resetWarrantyForm = () => {
    setWarrantyForm({
      order_number: '',
      product_code: '',
      product_name: '',
      customer_name: '',
      customer_email: '',
      purchase_date: '',
      purchase_amount: '',
      warranty_application_date: '',
      old_serial_number: '',
      new_serial_number: '',
      status: 'activa',
      ticket_number: generateWarrantyTicketNumber()
    });
    setSelectedWarrantyOrder(null);
    setWarrantyOrderSearchTerm('');
    setShowWarrantyOrderSearch(false);
  };

  const resetReturnForm = () => {
    setReturnForm({
      order_number: '',
      product_code: '',
      product_name: '',
      customer_name: '',
      customer_email: '',
      purchase_amount: '',
      fecha_devolucion: '',
      motivo: '',
      estado: 'pendiente',
      numero_serie: '',
      observaciones: '',
      ticket_soporte: generateReturnTicketNumber()
    });
    setSelectedReturnOrder(null);
    setReturnOrderSearchTerm('');
    setShowReturnOrderSearch(false);
  };

  const getWarrantyStatusLabel = (status) => {
    const statusMap = {
      'activa': 'Activa',
      'aplicada': 'Aplicada',
      'expirada': 'Expirada'
    };
    return statusMap[status] || status;
  };

  const getWarrantyStatusColor = (status) => {
    const colorMap = {
      'activa': '#4caf50',
      'aplicada': '#2196f3',
      'expirada': '#f44336'
    };
    return colorMap[status] || '#666';
  };

  const getReturnStatusLabel = (status) => {
    const statusMap = {
      'pendiente': 'Pendiente',
      'aprobada': 'Aprobada',
      'rechazada': 'Rechazada',
      'completada': 'Completada'
    };
    return statusMap[status] || status;
  };

  const getReturnStatusColor = (status) => {
    const colorMap = {
      'pendiente': '#ff9800',
      'aprobada': '#4caf50',
      'rechazada': '#f44336',
      'completada': '#2196f3'
    };
    return colorMap[status] || '#666';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Componente del Modal de Detalles
  const DetailModal = () => {
    if (!showDetailModal || !selectedDetailItem) return null;

    const isWarranty = detailModalType === 'warranty';
    const item = selectedDetailItem;

    return (
      <div className="modal-overlay active" onClick={handleCloseModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              {isWarranty ? '🛡️ Detalles de Garantía' : '🔄 Detalles de Devolución'}
            </h2>
            <button className="modal-close" onClick={handleCloseModal}>×</button>
          </div>

          <div className="modal-body">
            {!isEditing ? (
              <div className="detail-view">
                <div className="detail-section">
                  <h3>Información General</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Ticket:</strong>
                      <code className="ticket-code">
                        {isWarranty ? item.ticket_number : item.ticket_soporte}
                      </code>
                    </div>
                    <div className="detail-item">
                      <strong>Orden:</strong>
                      <span className="lucesa-order-number">{item.order_number}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Producto:</strong>
                      <span>{item.product_name}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Código:</strong>
                      <code>{item.product_code}</code>
                    </div>
                    <div className="detail-item">
                      <strong>Cliente:</strong>
                      <span>{item.customer_name}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Email:</strong>
                      <span>{item.customer_email}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Monto:</strong>
                      <span>{formatCurrency(item.purchase_amount)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>{isWarranty ? 'Información de Garantía' : 'Información de Devolución'}</h3>
                  <div className="detail-grid">
                    {isWarranty ? (
                      <>
                        <div className="detail-item">
                          <strong>Fecha Compra:</strong>
                          <span>{formatDate(item.purchase_date)}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Fecha Aplicación:</strong>
                          <span>{formatDate(item.warranty_application_date)}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Serie Anterior:</strong>
                          <code>{item.old_serial_number || 'N/A'}</code>
                        </div>
                        <div className="detail-item">
                          <strong>Serie Nuevo:</strong>
                          <code>{item.new_serial_number || 'N/A'}</code>
                        </div>
                        <div className="detail-item">
                          <strong>Estado:</strong>
                          <span 
                            className={`status-badge ${item.status}`}
                            style={{ borderColor: getWarrantyStatusColor(item.status) }}
                          >
                            {getWarrantyStatusLabel(item.status)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="detail-item">
                          <strong>Fecha Devolución:</strong>
                          <span>{formatDate(item.fecha_devolucion)}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Número Serie:</strong>
                          <code>{item.numero_serie}</code>
                        </div>
                        <div className="detail-item">
                          <strong>Motivo:</strong>
                          <span>{item.motivo}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Estado:</strong>
                          <span 
                            className={`status-badge ${item.estado}`}
                            style={{ borderColor: getReturnStatusColor(item.estado) }}
                          >
                            {getReturnStatusLabel(item.estado)}
                          </span>
                        </div>
                        {item.observaciones && (
                          <div className="detail-item full-width">
                            <strong>Observaciones:</strong>
                            <p>{item.observaciones}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Fecha de Creación:</strong>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    {item.updated_at && item.updated_at !== item.created_at && (
                      <div className="detail-item">
                        <strong>Última Actualización:</strong>
                        <span>{formatDate(item.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="edit-view">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Ticket *</label>
                    <input
                      type="text"
                      value={isWarranty ? editForm.ticket_number : editForm.ticket_soporte}
                      onChange={(e) => handleEditChange(
                        isWarranty ? 'ticket_number' : 'ticket_soporte', 
                        e.target.value
                      )}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Estado *</label>
                    <select
                      value={isWarranty ? editForm.status : editForm.estado}
                      onChange={(e) => handleEditChange(
                        isWarranty ? 'status' : 'estado',
                        e.target.value
                      )}
                    >
                      {isWarranty ? (
                        <>
                          <option value="activa">Activa</option>
                          <option value="aplicada">Aplicada</option>
                          <option value="expirada">Expirada</option>
                        </>
                      ) : (
                        <>
                          <option value="pendiente">Pendiente</option>
                          <option value="aprobada">Aprobada</option>
                          <option value="rechazada">Rechazada</option>
                          <option value="completada">Completada</option>
                        </>
                      )}
                    </select>
                  </div>

                  {isWarranty ? (
                    <>
                      <div className="form-group">
                        <label>Fecha Aplicación *</label>
                        <input
                          type="date"
                          value={editForm.warranty_application_date}
                          onChange={(e) => handleEditChange('warranty_application_date', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Serie Anterior</label>
                        <input
                          type="text"
                          value={editForm.old_serial_number}
                          onChange={(e) => handleEditChange('old_serial_number', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Serie Nuevo</label>
                        <input
                          type="text"
                          value={editForm.new_serial_number}
                          onChange={(e) => handleEditChange('new_serial_number', e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Fecha Devolución *</label>
                        <input
                          type="date"
                          value={editForm.fecha_devolucion}
                          onChange={(e) => handleEditChange('fecha_devolucion', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Número Serie *</label>
                        <input
                          type="text"
                          value={editForm.numero_serie}
                          onChange={(e) => handleEditChange('numero_serie', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Motivo *</label>
                        <select
                          value={editForm.motivo}
                          onChange={(e) => handleEditChange('motivo', e.target.value)}
                          required
                        >
                          <option value="">Seleccionar motivo</option>
                          <option value="Producto defectuoso">Producto defectuoso</option>
                          <option value="Cambio de modelo">Cambio de modelo</option>
                          <option value="No cumple expectativas">No cumple expectativas</option>
                          <option value="Error en el pedido">Error en el pedido</option>
                          <option value="Arrepentimiento">Arrepentimiento</option>
                          <option value="Daño durante envío">Daño durante envío</option>
                          <option value="Falta de piezas">Falta de piezas</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div className="form-group full-width">
                        <label>Observaciones</label>
                        <textarea
                          value={editForm.observaciones}
                          onChange={(e) => handleEditChange('observaciones', e.target.value)}
                          rows="3"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            {!isEditing ? (
              <>
                <button className="btn-secondary" onClick={handleCloseModal}>
                  Cerrar
                </button>
                <button className="btn-primary" onClick={handleEditToggle}>
                  ✏️ Editar
                </button>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={handleEditToggle}>
                  Cancelar
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleSaveEdit}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : '💾 Guardar Cambios'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (user?.rol !== 'admin') {
    return (
      <div className="admin-panel-container">
        <div className="no-access">
          <div className="no-access-icon">🔒</div>
          <h3>Acceso Restringido</h3>
          <p>No tienes permisos de administrador para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h1>🛍️ Gestión de Garantías y Devoluciones</h1>
        <p>Administra garantías y devoluciones del sistema</p>
      </div>

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

      {activeTab === 'warranties' && (
        <div className="tab-content">
          <div className="admin-toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar garantías por ticket, orden, producto, cliente o número de serie..."
                value={warrantySearchTerm}
                onChange={(e) => setWarrantySearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <button 
              className="btn-primary"
              onClick={() => setShowAddWarranty(true)}
            >
              + Añadir Garantía
            </button>
          </div>

          {showAddWarranty && (
            <div className="form-modal">
              <div className="form-content">
                <h3>Agregar Nueva Garantía</h3>
                
                <div className="form-group">
                  <label>Buscar Orden *</label>
                  <div className="order-search-container">
                    <input
                      type="text"
                      placeholder="Buscar por número de orden, cliente o email..."
                      value={warrantyOrderSearchTerm}
                      onChange={(e) => {
                        setWarrantyOrderSearchTerm(e.target.value);
                        setShowWarrantyOrderSearch(true);
                      }}
                      onFocus={() => setShowWarrantyOrderSearch(true)}
                      className="search-input"
                    />
                    <span className="search-icon">🔍</span>
                    
                    {showWarrantyOrderSearch && warrantyOrderSearchTerm && (
                      <div className="order-search-results">
                        {filteredWarrantyOrders.length > 0 ? (
                          filteredWarrantyOrders.map(order => (
                            <div 
                              key={order.id} 
                              className="order-search-result"
                              onClick={() => handleWarrantyOrderSelect(order)}
                            >
                              <div className="order-info">
                                <strong>{order.order_number}</strong>
                                <span>{order.customer_name || order.shipping_address?.nombre || order.user_nombre}</span>
                                <span>{order.customer_email || order.shipping_address?.email || order.user_email}</span>
                              </div>
                              <div className="order-details">
                                <span>{formatCurrency(order.total_amount)}</span>
                                <span>{formatDate(order.created_at)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-results">
                            No se encontraron órdenes
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {selectedWarrantyOrder && (
                  <div className="selected-order-info">
                    <h4>Información de la Orden Seleccionada</h4>
                    <div className="order-details-grid">
                      <div className="detail-item">
                        <strong>Orden:</strong> {selectedWarrantyOrder.order_number}
                      </div>
                      <div className="detail-item">
                        <strong>Cliente:</strong> {selectedWarrantyOrder.customer_name || selectedWarrantyOrder.shipping_address?.nombre || selectedWarrantyOrder.user_nombre}
                      </div>
                      <div className="detail-item">
                        <strong>Email:</strong> {selectedWarrantyOrder.customer_email || selectedWarrantyOrder.shipping_address?.email || selectedWarrantyOrder.user_email}
                      </div>
                      <div className="detail-item">
                        <strong>Producto:</strong> {selectedWarrantyOrder.items?.[0]?.product_name}
                      </div>
                      <div className="detail-item">
                        <strong>Código:</strong> {selectedWarrantyOrder.items?.[0]?.product_code}
                      </div>
                      <div className="detail-item">
                        <strong>Total:</strong> {formatCurrency(selectedWarrantyOrder.total_amount)}
                      </div>
                      <div className="detail-item">
                        <strong>Fecha Compra:</strong> {formatDate(selectedWarrantyOrder.created_at)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label>Número de Ticket *</label>
                    <input
                      type="text"
                      value={warrantyForm.ticket_number}
                      onChange={(e) => setWarrantyForm({...warrantyForm, ticket_number: e.target.value})}
                      placeholder="Ej: TS-1738361600000-ABCDE"
                      required
                      readOnly
                      className="ticket-display"
                    />
                    <small className="ticket-note">Ticket generado automáticamente</small>
                  </div>

                  <div className="form-group">
                    <label>Fecha de Aplicación de Garantía *</label>
                    <input
                      type="date"
                      value={warrantyForm.warranty_application_date}
                      onChange={(e) => setWarrantyForm({...warrantyForm, warranty_application_date: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Número de Serie Anterior</label>
                    <input
                      type="text"
                      value={warrantyForm.old_serial_number}
                      onChange={(e) => setWarrantyForm({...warrantyForm, old_serial_number: e.target.value})}
                      placeholder="Ej: SN-001-OLD"
                    />
                  </div>

                  <div className="form-group">
                    <label>Número de Serie Nuevo</label>
                    <input
                      type="text"
                      value={warrantyForm.new_serial_number}
                      onChange={(e) => setWarrantyForm({...warrantyForm, new_serial_number: e.target.value})}
                      placeholder="Ej: SN-001-NEW"
                    />
                  </div>

                  <div className="form-group">
                    <label>Estado de Garantía *</label>
                    <select
                      value={warrantyForm.status}
                      onChange={(e) => setWarrantyForm({...warrantyForm, status: e.target.value})}
                    >
                      <option value="activa">Activa</option>
                      <option value="aplicada">Aplicada</option>
                      <option value="expirada">Expirada</option>
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
                    disabled={loading || !warrantyForm.ticket_number || !selectedWarrantyOrder || !warrantyForm.warranty_application_date}
                  >
                    {loading ? 'Guardando...' : 'Agregar Garantía'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {warrantiesLoading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              Cargando garantías...
            </div>
          ) : (
            <div className="admin-table-container">
              <div className="results-info">
                Mostrando {filteredWarranties.length} de {warranties.length} garantías
                {warrantySearchTerm && <span> para "{warrantySearchTerm}"</span>}
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Orden</th>
                    <th>Producto</th>
                    <th>Cliente</th>
                    <th>Fecha Compra</th>
                    <th>Fecha Aplicación</th>
                    <th>Monto</th>
                    <th>Serie Anterior</th>
                    <th>Serie Nuevo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWarranties.map(warranty => (
                    <tr key={warranty.id}>
                      <td>
                        <code className="ticket-cell">{warranty.ticket_number || 'N/A'}</code>
                      </td>
                      <td>
                        <strong className="lucesa-order-number">{warranty.order_number}</strong>
                      </td>
                      <td>
                        <strong>{warranty.product_name}</strong>
                        <br />
                        <small>{warranty.product_code}</small>
                      </td>
                      <td>
                        {warranty.customer_name}
                        <br />
                        <small>{warranty.customer_email}</small>
                      </td>
                      <td>{formatDate(warranty.purchase_date)}</td>
                      <td>{formatDate(warranty.warranty_application_date)}</td>
                      <td>{formatCurrency(warranty.purchase_amount)}</td>
                      <td>
                        <code>{warranty.old_serial_number || 'N/A'}</code>
                      </td>
                      <td>
                        <code>{warranty.new_serial_number || 'N/A'}</code>
                      </td>
                      <td>
                        <span 
                          className={`status-badge ${warranty.status}`}
                          style={{ borderColor: getWarrantyStatusColor(warranty.status) }}
                        >
                          {getWarrantyStatusLabel(warranty.status)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-small btn-info"
                            onClick={() => handleShowDetails(warranty, 'warranty')}
                          >
                            📋 Detalles
                          </button>
                          <select
                            value={warranty.status}
                            onChange={(e) => handleWarrantyStatusUpdate(warranty.id, e.target.value)}
                            className="status-select"
                          >
                            <option value="activa">Activa</option>
                            <option value="aplicada">Aplicada</option>
                            <option value="expirada">Expirada</option>
                          </select>
                          {/* <button 
                            className="btn-small btn-warning"
                            onClick={() => handleWarrantyAction(warranty.id, 'extender')}
                            disabled={warranty.status === 'expirada'}
                          >
                            ⏳ Extender
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredWarranties.length === 0 && (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>No se encontraron garantías</h3>
                  <p>{warranties.length === 0 ? 'Aún no hay garantías registradas.' : 'Intenta con otros términos de búsqueda.'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'returns' && (
        <div className="tab-content">
          <div className="admin-toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar devoluciones por ticket, orden, producto, cliente o número de serie..."
                value={returnSearchTerm}
                onChange={(e) => setReturnSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <button 
              className="btn-primary"
              onClick={() => setShowAddReturn(true)}
            >
              + Añadir Devolución
            </button>
          </div>

          {showAddReturn && (
            <div className="form-modal">
              <div className="form-content">
                <h3>Agregar Nueva Devolución</h3>
                
                <div className="form-group">
                  <label>Buscar Orden *</label>
                  <div className="order-search-container">
                    <input
                      type="text"
                      placeholder="Buscar por número de orden, cliente o email..."
                      value={returnOrderSearchTerm}
                      onChange={(e) => {
                        setReturnOrderSearchTerm(e.target.value);
                        setShowReturnOrderSearch(true);
                      }}
                      onFocus={() => setShowReturnOrderSearch(true)}
                      className="search-input"
                    />
                    <span className="search-icon">🔍</span>
                    
                    {showReturnOrderSearch && returnOrderSearchTerm && (
                      <div className="order-search-results">
                        {filteredReturnOrders.length > 0 ? (
                          filteredReturnOrders.map(order => (
                            <div 
                              key={order.id} 
                              className="order-search-result"
                              onClick={() => handleReturnOrderSelect(order)}
                            >
                              <div className="order-info">
                                <strong>{order.order_number}</strong>
                                <span>{order.customer_name || order.shipping_address?.nombre || order.user_nombre}</span>
                                <span>{order.customer_email || order.shipping_address?.email || order.user_email}</span>
                              </div>
                              <div className="order-details">
                                <span>{formatCurrency(order.total_amount)}</span>
                                <span>{formatDate(order.created_at)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-results">
                            No se encontraron órdenes
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {selectedReturnOrder && (
                  <div className="selected-order-info">
                    <h4>Información de la Orden Seleccionada</h4>
                    <div className="order-details-grid">
                      <div className="detail-item">
                        <strong>Orden:</strong> {selectedReturnOrder.order_number}
                      </div>
                      <div className="detail-item">
                        <strong>Cliente:</strong> {selectedReturnOrder.customer_name || selectedReturnOrder.shipping_address?.nombre || selectedReturnOrder.user_nombre}
                      </div>
                      <div className="detail-item">
                        <strong>Email:</strong> {selectedReturnOrder.customer_email || selectedReturnOrder.shipping_address?.email || selectedReturnOrder.user_email}
                      </div>
                      <div className="detail-item">
                        <strong>Producto:</strong> {selectedReturnOrder.items?.[0]?.product_name}
                      </div>
                      <div className="detail-item">
                        <strong>Código:</strong> {selectedReturnOrder.items?.[0]?.product_code}
                      </div>
                      <div className="detail-item">
                        <strong>Total:</strong> {formatCurrency(selectedReturnOrder.total_amount)}
                      </div>
                      <div className="detail-item">
                        <strong>Fecha Compra:</strong> {formatDate(selectedReturnOrder.created_at)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label>Número de Ticket *</label>
                    <input
                      type="text"
                      value={returnForm.ticket_soporte}
                      onChange={(e) => setReturnForm({...returnForm, ticket_soporte: e.target.value})}
                      placeholder="Ej: DEV-1738448000000-KLMNO"
                      required
                      readOnly
                      className="ticket-display"
                    />
                    <small className="ticket-note">Ticket generado automáticamente</small>
                  </div>

                  <div className="form-group">
                    <label>Número de Serie *</label>
                    <input
                      type="text"
                      value={returnForm.numero_serie}
                      onChange={(e) => setReturnForm({...returnForm, numero_serie: e.target.value})}
                      placeholder="Ej: SN-001-001"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha de Devolución *</label>
                    <input
                      type="date"
                      value={returnForm.fecha_devolucion}
                      onChange={(e) => setReturnForm({...returnForm, fecha_devolucion: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Motivo de Devolución *</label>
                    <select
                      value={returnForm.motivo}
                      onChange={(e) => setReturnForm({...returnForm, motivo: e.target.value})}
                      required
                    >
                      <option value="">Seleccionar motivo</option>
                      <option value="Producto defectuoso">Producto defectuoso</option>
                      <option value="Cambio de modelo">Cambio de modelo</option>
                      <option value="No cumple expectativas">No cumple expectativas</option>
                      <option value="Error en el pedido">Error en el pedido</option>
                      <option value="Arrepentimiento">Arrepentimiento</option>
                      <option value="Daño durante envío">Daño durante envío</option>
                      <option value="Falta de piezas">Falta de piezas</option>
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
                    disabled={loading || !returnForm.ticket_soporte || !selectedReturnOrder || !returnForm.numero_serie || !returnForm.fecha_devolucion || !returnForm.motivo}
                  >
                    {loading ? 'Guardando...' : 'Agregar Devolución'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {returnsLoading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              Cargando devoluciones...
            </div>
          ) : (
            <div className="admin-table-container">
              <div className="results-info">
                Mostrando {filteredReturns.length} de {returns.length} devoluciones
                {returnSearchTerm && <span> para "{returnSearchTerm}"</span>}
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Orden</th>
                    <th>Producto</th>
                    <th>Cliente</th>
                    <th>Fecha Devolución</th>
                    <th>Total</th>
                    <th>Número Serie</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map(returnItem => (
                    <tr key={returnItem.id}>
                      <td>
                        <code className="ticket-cell">{returnItem.ticket_soporte || 'N/A'}</code>
                      </td>
                      <td>
                        <strong className="lucesa-order-number">{returnItem.order_number}</strong>
                      </td>
                      <td>
                        <strong>{returnItem.product_name}</strong>
                        <br />
                        <small>{returnItem.product_code}</small>
                      </td>
                      <td>
                        {returnItem.customer_name}
                        <br />
                        <small>{returnItem.customer_email}</small>
                      </td>
                      <td>{formatDate(returnItem.fecha_devolucion)}</td>
                      <td>{formatCurrency(returnItem.purchase_amount)}</td>
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
                        <span 
                          className={`status-badge ${returnItem.estado}`}
                          style={{ borderColor: getReturnStatusColor(returnItem.estado) }}
                        >
                          {getReturnStatusLabel(returnItem.estado)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-small btn-info"
                            onClick={() => handleShowDetails(returnItem, 'return')}
                          >
                            📋 Detalles
                          </button>
                          <select
                            value={returnItem.estado}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              if (newStatus === 'aprobada') {
                                handleReturnAction(returnItem.id, 'aprobar');
                              } else if (newStatus === 'rechazada') {
                                handleReturnAction(returnItem.id, 'rechazar');
                              } else if (newStatus === 'completada') {
                                handleReturnAction(returnItem.id, 'completar');
                              } else {
                                handleReturnAction(returnItem.id, newStatus);
                              }
                            }}
                            className="status-select"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="aprobada">Aprobada</option>
                            <option value="rechazada">Rechazada</option>
                            <option value="completada">Completada</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredReturns.length === 0 && (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>No se encontraron devoluciones</h3>
                  <p>{returns.length === 0 ? 'Aún no hay devoluciones registradas.' : 'Intenta con otros términos de búsqueda.'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <DetailModal />
    </div>
  );
};

export default ProductManagement;