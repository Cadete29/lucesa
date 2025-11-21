/**
 * Controladores para los endpoints de usuarios
 * Maneja las operaciones CRUD de usuarios
 */
const userController = {
  // Obtener todos los usuarios
  getUsers: (req, res) => {
    const usuarios = [
      { id: 1, nombre: 'Ana', edad: 25 },
      { id: 2, nombre: 'Luis', edad: 30 },
      { id: 3, nombre: 'Maria', edad: 28 }
    ];
    res.json(usuarios);
  },

  // Crear nuevo usuario
  createUser: (req, res) => {
    const { nombre, edad } = req.body;
    
    const nuevoUsuario = {
      id: Date.now(),
      nombre,
      edad
    };

    res.status(201).json({
      message: 'Usuario creado',
      usuario: nuevoUsuario
    });
  },

  // Health check del servidor
  getHealth: (req, res) => {
    res.json({
      message: '¡Servidor funcionando correctamente!',
      timestamp: new Date().toISOString(),
      endpoints: [
        '/api/usuarios',
        '/api/ctonline/promociones',
        '/api/ctonline/existencias',
        '/api/ctonline/almacenes',
        '/api/ctonline/producto/:codigo/:almacen',
        '/api/ctonline/promocion/:codigo',
        '/api/ctonline/status'
      ]
    });
  }
};

module.exports = userController;