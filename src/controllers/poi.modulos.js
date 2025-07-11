const db = require('../db/index');

// Ver todos los módulos
const verModulos = async (req, res) => {
  try {
    console.log('Consultando módulos en la base de datos...');
    const resultado = await db.query(
      `SELECT 
        m.codigo, 
        m.descripcion, 
        m.codigo_proyecto, 
        p.nombre as nombre_proyecto,
        'Activo' as estado -- Agregamos estado por defecto
       FROM tbl_modulo m
       LEFT JOIN tbl_proyectos p ON m.codigo_proyecto = p.codigo
       ORDER BY m.codigo`
    );

    console.log(`Módulos encontrados: ${resultado.rows.length}`);

    if (resultado.rows.length === 0) {
      return res.status(200).json([]); // Devuelve array vacío en lugar de objeto
    }

    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener módulos:', error);
    res.status(500).json({ 
      error: 'Error al obtener los módulos',
      detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Ver un módulo por código
const verModuloId = async (req, res) => {
  try {
    const { codigo } = req.params;
    console.log(`Buscando módulo con código: ${codigo}`);

    const resultado = await db.query(
      `SELECT m.codigo, m.descripcion, m.codigo_proyecto, 
       p.nombre as nombre_proyecto
       FROM tbl_modulo m
       LEFT JOIN tbl_proyectos p ON m.codigo_proyecto = p.codigo
       WHERE m.codigo = $1`,
      [codigo]
    );

    if (resultado.rows.length === 0) {
      console.log('Módulo no encontrado');
      return res.status(404).json({ 
        error: 'Módulo no encontrado',
        codigo_buscado: codigo
      });
    }

    console.log('Módulo encontrado:', resultado.rows[0]);
    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al obtener módulo:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Error al obtener el módulo',
      detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar un módulo
const actualizarModulo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { descripcion, codigo_proyecto } = req.body;
    
    console.log(`Actualizando módulo ${codigo} con:`, req.body);

    // Validación mejorada
    if (!descripcion && !codigo_proyecto) {
      return res.status(400).json({ 
        error: 'Debe proporcionar al menos un campo para actualizar',
        campos_validos: ['descripcion', 'codigo_proyecto']
      });
    }

    // Consulta mejorada para incluir el nombre del proyecto
    const resultado = await db.query(
      `WITH modulo_actualizado AS (
         UPDATE tbl_modulo 
         SET descripcion = COALESCE($1, descripcion),
             codigo_proyecto = COALESCE($2, codigo_proyecto)
         WHERE codigo = $3
         RETURNING *
       )
       SELECT 
         m.*,
         p.nombre as nombre_proyecto
       FROM modulo_actualizado m
       LEFT JOIN tbl_proyectos p ON m.codigo_proyecto = p.codigo`,
      [descripcion, codigo_proyecto, codigo]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Módulo no encontrado',
        codigo_buscado: codigo
      });
    }

    res.status(200).json({
      mensaje: 'Módulo actualizado correctamente',
      modulo: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar módulo:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el módulo',
      detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  verModulos,
  verModuloId,
  actualizarModulo
};