const db = require('../db/index');
const { obtenerModulos } = require('./poi.maestroActividad');

// Crear un nuevo proyecto
const crearProyecto = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, fecha_inicio, fecha_fin, estado, responsable } = req.body;

    // Validación básica
    if (!codigo || !nombre || !fecha_inicio || !fecha_fin || !estado || !responsable) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const resultado = await db.query(
      'INSERT INTO tbl_proyectos (codigo, nombre, descripcion, fecha_inicio, fecha_fin, estado, responsable) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [codigo, nombre, descripcion, fecha_inicio, fecha_fin, estado, responsable]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    
    // Manejo específico de error de duplicado
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El código de proyecto ya existe' });
    }
    
    res.status(500).json({ error: 'Error al crear el proyecto' });
  }
};

// Obtener estados
const obtenerEstados = async (req, res) => {
  try {
    const resultado = await db.query('SELECT codigo, descripcion FROM tbl_estado ORDER BY descripcion');
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron estados' });
    }

    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener estados:', error);
    res.status(500).json({ error: 'Error al obtener los estados' });
  }
};

module.exports = {
  crearProyecto,
  obtenerEstados
};