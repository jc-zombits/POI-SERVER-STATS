const db = require('../db/index');

const obtenerActividadesCumplimiento = async (req, res) => {
  const { mes, proyecto } = req.query;
  if (!mes) return res.status(400).json({ error: 'Debe especificar el mes' });

  const values = [parseInt(mes)];
  let whereExtra = '';
  if (proyecto) {
    whereExtra = 'AND p.codigo = $2';
    values.push(proyecto);
  }

  const { rows } = await db.query(`
    SELECT
      p.codigo        AS proyecto_codigo,
      p.nombre        AS proyecto,
      m.codigo        AS modulo,
      m.descripcion   AS descripcion,
      a.nombre        AS actividad,
      a.peso_porcentual AS "pesoPorcentual",
      p.estado        AS estado,
      COALESCE(c.total,0)    AS total,
      COALESCE(c.ejecucion,0) AS ejecucion,
      a.id_actividad
    FROM tbl_actividad a
    JOIN tbl_modulo m ON a.codigo_modulo = m.codigo
    JOIN tbl_proyectos p ON m.codigo_proyecto = p.codigo
    LEFT JOIN tbl_cumplimiento c ON a.id_actividad = c.id_actividad
    WHERE EXTRACT(MONTH FROM p.fecha_inicio) = $1
    ${whereExtra}
    ORDER BY p.nombre, m.codigo, a.nombre
  `, values);
  res.json(rows);
};

module.exports = { obtenerActividadesCumplimiento };
