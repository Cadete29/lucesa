//? Backend//routes//mainRoutes.js

const express = require('express');
const router = express.Router();

//! importar las subrutas
//!Se hace para que en el archivo del servidor no se sature
// const userRoutesG = require('./userRoutesG');
const authRoutesG = require('./authRoutesG');


//TODO Se le tiene que agregar un prefijo
// router.use('/user',userRoutesG);
router.use('/auth',authRoutesG);




module.exports=router;