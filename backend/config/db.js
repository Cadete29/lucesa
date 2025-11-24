// Para la configuracion de la base de datos 21/08/2025
require('dotenv').config();

//* Importar el pool pg que es para las conexiones a la base de datos 

const{ Pool } = require('pg');

//*Crear las conexiones de pg desde el archivo .env

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port : process.env.DB_PORT,
});

//* Probar la conexion inicial a la base de datos
pool.connect()
    .then(()=>{
        console.log('Conexion exitosa a Postgrest, excelente');
    })
    .catch ((err)=>{
        console.log('Error al conectar a PostgresSQL ',err);
    })

//* Exportar el pool para usarlo en otras partes del proyecto

module.exports = pool;
