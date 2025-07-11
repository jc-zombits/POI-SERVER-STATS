const db = require('../db/index');

const obtenerActividadesCumplimiento = async (req, res) => {
  console.log("🚀 Intentando obtener actividades de cumplimiento..."); 
  const { mes } = req.query; // Ejemplo: 'Enero', 'Febrero'

  if (!mes) {
    return res.status(400).json({ error: "Debe especificar el mes" });
  }
  console.log("Consulta SQL para mes:", mes);
  try {
    // El 'mes' ahora es un número (ej. 1 para Enero, 7 para Julio)
    console.log("Consulta SQL para número de mes:", mes);

    const resultado = await db.query(`
      SELECT
        m.codigo AS modulo,
        m.descripcion AS descripcion,
        a.nombre AS actividad,
        a.peso_porcentual AS "pesoPorcentual",
        p.estado AS estado,
        COALESCE(c.total, 0) AS total,
        COALESCE(c.ejecucion, 0) AS ejecucion,
        a.id_actividad
      FROM tbl_actividad a
      INNER JOIN tbl_modulo m ON a.codigo_modulo = m.codigo
      INNER JOIN tbl_proyectos p ON m.codigo_proyecto = p.codigo
      LEFT JOIN tbl_cumplimiento c ON a.id_actividad = c.id_actividad
      WHERE EXTRACT(MONTH FROM p.fecha_inicio) = $1
    `, [parseInt(mes)]); // <-- CAMBIO CLAVE: Usa EXTRACT(MONTH FROM ...) y convierte a entero

    console.log(`Datos obtenidos para el mes número ${mes}: ${resultado.rows.length} filas.`);
    res.json(resultado.rows);
  } catch (error) {
    console.error("❌ Error DETALLADO al consultar cumplimiento en BACKEND:", error);
    res.status(500).json({ error: "Error del servidor al consultar cumplimiento" });
  }
};

module.exports = { obtenerActividadesCumplimiento };
