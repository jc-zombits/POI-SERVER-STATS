// Quita la línea que importa routes, no es necesaria aquí
const db = require('../db/index');



// Crear un nuevo POI
// Crear un nuevo módulo
const crearModulo = async (req, res) => {
  try {
    const { codigo, descripcion, codigo_proyecto } = req.body;

    const resultado = await db.query(
      `INSERT INTO tbl_modulo 
      (codigo, descripcion, codigo_proyecto) 
      VALUES ($1, $2, $3) RETURNING *`,
      [codigo, descripcion, codigo_proyecto]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al crear módulo:', error);
    res.status(500).json({ error: 'Error al crear el módulo' });
  }
};

module.exports = {
   crearModulo,
};