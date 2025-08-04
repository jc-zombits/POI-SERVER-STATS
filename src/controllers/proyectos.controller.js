// proyectos.controller.js  (crea este archivo)
const listarProyectos = async (_req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT codigo, nombre FROM tbl_proyectos ORDER BY nombre'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
};

module.exports = {listarProyectos};