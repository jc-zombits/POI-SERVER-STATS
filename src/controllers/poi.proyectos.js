const db = require('../db/index');

// Obtener todos los proyectos
const verProyectos = async (req, res) => {
  try {
    console.log('Obteniendo lista de proyectos...');
    const resultado = await db.query('SELECT * FROM tbl_proyectos ORDER BY codigo');
    
    console.log('Proyectos encontrados:', resultado.rowCount);
    res.status(200).json(resultado.rows);
    
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ 
      error: 'Error al obtener los proyectos',
      detalles: error.message 
    });
  }
};

// Obtener proyecto por código
const verProyectoId = async (req, res) => {
  try {
    const { codigo } = req.params;

    const resultado = await db.query(
      'SELECT * FROM tbl_proyectos WHERE codigo = $1', 
      [codigo]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({ 
      error: 'Error al obtener el proyecto',
      detalles: error.message 
    });
  }
};

// Actualizar proyecto
const actualizarProyecto = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado, responsable } = req.body;

    // Validación adicional de parámetros
    if (!codigo || !nombre || !fecha_inicio || !fecha_fin || !estado || !responsable) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Consulta SQL con parámetros nombrados para mayor claridad
    const query = {
      text: `UPDATE tbl_proyectos 
             SET nombre = $1, 
                 descripcion = $2, 
                 fecha_inicio = $3, 
                 fecha_fin = $4, 
                 estado = $5, 
                 responsable = $6 
             WHERE codigo = $7 
             RETURNING *`,
      values: [nombre, descripcion, fecha_inicio, fecha_fin, estado, responsable, codigo]
    };

    const resultado = await db.query(query);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ 
        error: 'Proyecto no encontrado',
        detalles: `No existe un proyecto con código ${codigo}`
      });
    }

    res.status(200).json({
      mensaje: 'Proyecto actualizado correctamente',
      proyecto: resultado.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    
    // Mensaje de error más detallado
    let errorMessage = 'Error al actualizar el proyecto';
    if (error.code === '42703') { // Código de error para columna no existente
      errorMessage = 'Error en la estructura de la base de datos: columna no encontrada';
    }

    res.status(500).json({ 
      error: errorMessage,
      detalles: error.message,
      codigo_error: error.code // Incluye el código de error PostgreSQL
    });
  }
};

// Eliminar proyecto
const eliminarProyecto = async (req, res) => {
  console.log('═════════ PETICIÓN DELETE RECIBIDA ═════════');
  console.log('Endpoint:', req.originalUrl);
  console.log('Params:', req.params);
  console.log('Headers:', req.headers);
  console.log('Hora:', new Date().toISOString());
  console.log('────────────────────────────────────────────');

  try {
    const { codigo } = req.params;
    console.log('Intentando eliminar proyecto:', codigo);

    const query = {
      text: 'DELETE FROM tbl_proyectos WHERE codigo = $1 RETURNING *',
      values: [codigo]
    };

    const result = await db.query(query);
    
    if (result.rowCount === 0) {
      console.log('Proyecto no encontrado');
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    console.log('Eliminación exitosa:', result.rows[0]);
    return res.status(200).json({
      success: true,
      mensaje: `Proyecto "${result.rows[0].nombre}" eliminado correctamente`,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error en eliminación:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.code === '23503') {
      return res.status(409).json({
        error: 'No se puede eliminar',
        detalles: 'Existen registros relacionados con este proyecto'
      });
    }

    return res.status(500).json({
      error: 'Error interno del servidor',
      detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  verProyectos,
  verProyectoId,
  actualizarProyecto,
  eliminarProyecto
};