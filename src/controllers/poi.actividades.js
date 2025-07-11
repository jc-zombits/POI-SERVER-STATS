// ver todos los pois
const veractividades = async (req, res) => {
  try {
    const resultado = await db.query('SELECT * FROM tbl_actividad ORDER BY id_actividad');

    if (resultado.rows.length === 0) {
      return res.status(200).json({ mensaje: 'La tabla POIs está vacía', datos: [] });
    }

    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener la lista de POIs:', error);
    res.status(500).json({ error: 'Error al obtener la lista de POIs' });
  }
};

// ver POI por id
const verActividad = async (req, res) => {
  try {
    const { codigo } = req.params;

    const resultado = await db.query('SELECT * FROM tbl_actividad WHERE codigo = $1', [codigo]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'POI no encontrado' });
    }

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al obtener el POI:', error);
    res.status(500).json({ error: 'Error al obtener el POI' });
  }
};


// Crear un nuevo POI


// Actualizar un POI existente
const actualizarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo_modulo, presupuesto, peso_porcentual, estado } = req.body;

    const resultado = await db.query(
      `UPDATE tbl_actividad 
       SET nombre = $1, codigo_modulo = $2, presupuesto = $3, peso_porcentual = $4, estado = $5 
       WHERE id_actividad = $6 
       RETURNING *`,
      [nombre, codigo_modulo, presupuesto, peso_porcentual, estado, id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al actualizar actividad:', error.message);
    res.status(500).json({ error: 'Error al actualizar la actividad' });
  }
};

module.exports = {
  veractividades,
  verActividad,
  actualizarActividad
};
