// src/routes/poi.routes.js
const express = require('express');
const router = express.Router();

const {
  crearProyecto,
  obtenerEstados
} = require('../controllers/poi.maestroProyectos');
const {
  verProyectos,
  verProyectoId,
  actualizarProyecto,
  eliminarProyecto
} = require('../controllers/poi.proyectos');

const { verModulos, verModuloId, actualizarModulo, eliminarModulo } = require('../controllers/poi.modulos');
const { crearModulo } = require('../controllers/poi.maestroModulo');
const { crearActividad, obtenerEstadoPorModulo, getEstadosDisponibles } = require('../controllers/poi.maestroActividad');

const { obtenerActividadesCumplimiento } = require('../controllers/poi.cumplimiento');

const { listarProyectos } = require('../controllers/proyectos.controller');

// Proyectos
// Rutas para creación y estados
router.post('/maestro-proyectos', crearProyecto);
router.get('/maestro-estados', obtenerEstados);
router.get('/proyectos', verProyectos);
router.get('/proyecto/:codigo', verProyectoId);
router.put('/proyecto/:codigo', actualizarProyecto);
router.delete('/proyecto/:codigo', eliminarProyecto);

// Módulos
router.post('/maestro-modulos', crearModulo);
router.get('/modulos', verModulos)
router.get('/modulo/:codigo', verModuloId);
router.put('/modulo/:codigo', actualizarModulo);

// Actividades
router.post('/actividades', crearActividad);
router.get("/actividades/estado-por-modulo/:codigoModulo", obtenerEstadoPorModulo);

// Cumplimiento
router.get('/actividades/cumplimiento', obtenerActividadesCumplimiento);
router.get('/proyectos', listarProyectos);


module.exports = router;
