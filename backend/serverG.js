//* Archivo para levantar el servidor
const express = require('express'); //? framework del servidor 
const dotenv = require('dotenv');   //*variables de entorno (.env)
const cors = require('cors');      //! para permitir peticiones desde el frontend
const path = require('path');      //* para manejor de rutas de archivos
const db = require('./config/db')  //* importa y ejecuta la prueba de conexion


dotenv.config(); //* Para cargar la configuracion del (.env)
const app = express(); //* Crear la aplicacion de express
//! ESTOS MIDDLEWARES DEBEN ESTAR AL INICIO
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
//! Rutas principales 
const mainRoutesG = require('./routes/mainRoutesG');


app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    })
);

//! Usar las rutas
app.use('/api', mainRoutesG);

// Ruta de prueba 
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API funcionando correctamente ',
    });
})

const PORT = process.env.PORT || 3000;//* para definir el puerto

app.listen(PORT,()=>{
    console.log(`Servidor ejecutandose en http://localhost:${PORT}`);
});