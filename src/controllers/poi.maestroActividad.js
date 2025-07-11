const db = require('../db/index');

const obtenerEstados = async () => {
  const result = await db.query('SELECT codigo, descripcion FROM tbl_estado');
  return result.rows;
};

const crearActividad = async (req, res) => {
  console.log("🔥 Se llamó a crearActividad()");
  try {
    console.log("📥 Se recibió una solicitud POST /api/actividades");
    console.log("🧾 Body recibido:", JSON.stringify(req.body, null, 2));

    // Extracción y validación de campos
    const { nombre, codigo_modulo, presupuesto, peso_porcentual, estado } = req.body;

    // Validaciones obligatorias
    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio y no puede estar vacío' });
    }
    if (!codigo_modulo?.trim()) {
      return res.status(400).json({ error: 'El campo "codigo_modulo" es obligatorio' });
    }
    if (!estado?.trim()) {
      return res.status(400).json({ error: 'El campo "estado" es obligatorio' });
    }

    // Validación de valores numéricos
    const presupuestoVal = presupuesto ? parseFloat(presupuesto) : null;
    const pesoPorcentualVal = peso_porcentual ? parseFloat(peso_porcentual) : null;

    if (presupuesto && isNaN(presupuestoVal)) {
      return res.status(400).json({ error: 'El presupuesto debe ser un número válido' });
    }
    if (peso_porcentual && isNaN(pesoPorcentualVal)) {
      return res.status(400).json({ error: 'El peso porcentual debe ser un número válido' });
    }

    // Verificación de existencia en base de datos
    const moduloExistente = await db.query(
      'SELECT 1 FROM tbl_modulo WHERE codigo = $1', 
      [codigo_modulo.trim()]
    );
    
    if (moduloExistente.rows.length === 0) {
      return res.status(400).json({ 
        error: 'El módulo especificado no existe',
        codigo_modulo: codigo_modulo.trim()
      });
    }

    // Inserción segura con transacción
    const queryText = `
      INSERT INTO tbl_actividad 
      (nombre, codigo_modulo, presupuesto, peso_porcentual, estado) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;

    const queryParams = [
      nombre.trim(),
      codigo_modulo.trim(),
      presupuestoVal,
      pesoPorcentualVal,
      estado.trim().toUpperCase() // Normalización a mayúsculas
    ];

    console.log("⚡ Ejecutando query:", { queryText, queryParams });

    const resultado = await db.query(queryText, queryParams);
    
    console.log("✅ Actividad creada exitosamente:", resultado.rows[0]);
    return res.status(201).json(resultado.rows[0]);
    
  } catch (error) {
    console.error("❌ Error crítico en crearActividad:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });

    // Manejo específico de errores de PostgreSQL
    if (error.code === '23503') { // Violación de FK
      return res.status(400).json({
        error: 'Error de referencia',
        message: 'El módulo o estado especificado no existe',
        detail: error.detail
      });
    }

    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: {
        code: error.code,
        constraint: error.constraint
      }
    });
  }
};

// Obtener estado del proyecto a partir del código del módulo
const obtenerEstadoPorModulo = async (req, res) => {
  const { codigoModulo } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        p.estado
      FROM tbl_modulo m
      INNER JOIN tbl_proyectos p ON m.codigo_proyecto = p.codigo
      WHERE m.codigo = $1
    `, [codigoModulo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No se encontró el módulo o el proyecto asociado" });
    }

    res.json({ estado: result.rows[0].estado });
  } catch (error) {
    console.error("Error al obtener estado del proyecto desde módulo:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = {
  crearActividad,
  obtenerEstadoPorModulo
};