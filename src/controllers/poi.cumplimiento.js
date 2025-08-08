const db = require('../db/index');

const obtenerActividadesCumplimiento = async (req, res) => {
  const { proyecto } = req.query;
  
  if (!proyecto) {
    return res.status(400).json({ error: 'Debe especificar el código del proyecto' });
  }

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  try {
    // Obtener todos los proyectos con sus fechas para determinar qué meses tienen actividad
    const proyectosQuery = await db.query(`
      SELECT codigo, fecha_inicio, fecha_fin 
      FROM tbl_proyectos 
      WHERE codigo = $1
    `, [proyecto]);

    if (proyectosQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Determinar qué meses tienen proyectos activos
    const mesesConProyectos = new Set();
    
    for (const proj of proyectosQuery.rows) {
      if (proj.fecha_inicio) {
        const fechaInicio = new Date(proj.fecha_inicio);
        const fechaFin = proj.fecha_fin ? new Date(proj.fecha_fin) : new Date(proj.fecha_inicio);
        
        // Agregar el mes de inicio
        const mesInicio = fechaInicio.getMonth() + 1;
        mesesConProyectos.add(mesInicio);
        
        // Si hay fecha de fin y es diferente al mes de inicio, agregar también ese mes
        const mesFin = fechaFin.getMonth() + 1;
        if (mesFin !== mesInicio) {
          mesesConProyectos.add(mesFin);
        }
      }
    }

    // Convertir a array ordenado
    const mesesActivos = Array.from(mesesConProyectos).sort((a, b) => a - b);
    
    if (mesesActivos.length === 0) {
      return res.json([]);
    }

    // Obtener todas las actividades del proyecto desde tbl_cumplimiento
    const { rows } = await db.query(`
      SELECT 
        id,
        proyecto,
        modulo,
        descripcion,
        actividad,
        peso_porcentual AS "pesoPorcentual",
        estado,
        total,
        ejecucion,
        cumplimiento
      FROM tbl_cumplimiento 
      WHERE proyecto = $1
      ORDER BY modulo, actividad
    `, [proyecto]);

    // Si no hay datos en tbl_cumplimiento, crear filas basadas en tbl_actividad
    if (rows.length === 0) {
      const actividadesQuery = await db.query(`
        SELECT
          p.codigo        AS proyecto,
          m.codigo        AS modulo,
          m.descripcion   AS descripcion,
          a.nombre        AS actividad,
          a.peso_porcentual AS "pesoPorcentual",
          'Pendiente'     AS estado
        FROM tbl_actividad a
        JOIN tbl_modulo m ON a.codigo_modulo = m.codigo
        JOIN tbl_proyectos p ON m.codigo_proyecto = p.codigo
        WHERE p.codigo = $1
        ORDER BY m.codigo, a.nombre
      `, [proyecto]);

      const resultado = [];
      for (const actividad of actividadesQuery.rows) {
        for (const numeroMes of mesesActivos) {
          const nombreMes = meses[numeroMes - 1];
          resultado.push({
            ...actividad,
            mes: nombreMes,
            numero_mes: numeroMes,
            total: 0,
            ejecucion: 0,
            cumplimiento: 0,
            key: `${actividad.modulo}_${actividad.actividad}_${numeroMes}`
          });
        }
      }
      return res.json(resultado);
    }

    // Si hay datos, crear una fila por cada mes activo para cada actividad única
    const actividadesUnicas = [...new Set(rows.map(r => `${r.modulo}_${r.actividad}`))];
    const resultado = [];

    for (const actividadKey of actividadesUnicas) {
      const [modulo, actividad] = actividadKey.split('_');
      const actividadData = rows.find(r => r.modulo === modulo && r.actividad === actividad);
      
      for (const numeroMes of mesesActivos) {
        const nombreMes = meses[numeroMes - 1];
        
        // Buscar si existe data específica para este mes
        const dataEspecifica = rows.find(r => 
          r.modulo === modulo && 
          r.actividad === actividad && 
          r.mes === nombreMes
        );

        resultado.push({
          proyecto: actividadData.proyecto,
          modulo: actividadData.modulo,
          descripcion: actividadData.descripcion,
          actividad: actividadData.actividad,
          pesoPorcentual: actividadData.pesoPorcentual || 0,
          estado: actividadData.estado || 'Pendiente',
          mes: nombreMes,
          numero_mes: numeroMes,
          total: dataEspecifica ? dataEspecifica.total || 0 : 0,
          ejecucion: dataEspecifica ? dataEspecifica.ejecucion || 0 : 0,
          cumplimiento: dataEspecifica ? dataEspecifica.cumplimiento || 0 : 0,
          key: `${modulo}_${actividad}_${numeroMes}`
        });
      }
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener actividades de cumplimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const actualizarActividadesCumplimiento = async (req, res) => {
  const { proyecto, actividades } = req.body;
  
  if (!proyecto || !actividades || !Array.isArray(actividades)) {
    return res.status(400).json({ error: 'Datos inválidos. Se requiere proyecto y actividades.' });
  }

  try {
    // Iniciar transacción
    await db.query('BEGIN');

    for (const actividad of actividades) {
      const {
        modulo,
        actividad: nombreActividad,
        pesoPorcentual,
        estado,
        total,
        ejecucion,
        cumplimiento,
        mes,
        descripcion
      } = actividad;

      // Convertir valores a los tipos correctos
      const pesoPorcentualNum = parseFloat(pesoPorcentual) || 0;
      const totalInt = parseInt(total) || 0;
      const ejecucionInt = parseInt(ejecucion) || 0;
      // El cumplimiento debe ser numérico (porcentaje de ejecución)
      const cumplimientoNum = parseFloat(ejecucion) || 0;

      console.log('Procesando actividad:', {
         proyecto,
         modulo,
         nombreActividad,
         pesoPorcentualNum,
         estado,
         totalInt,
         ejecucionInt,
         cumplimientoNum,
         mes
       });

      // Verificar si ya existe un registro para esta combinación
      const existeQuery = await db.query(`
        SELECT id FROM tbl_cumplimiento 
        WHERE proyecto = $1 AND modulo = $2 AND actividad = $3 AND mes = $4
      `, [proyecto, modulo, nombreActividad, mes]);

      if (existeQuery.rows.length > 0) {
        // Actualizar registro existente
        await db.query(`
          UPDATE tbl_cumplimiento 
          SET peso_porcentual = $1, estado = $2, total = $3, ejecucion = $4, cumplimiento = $5
          WHERE proyecto = $6 AND modulo = $7 AND actividad = $8 AND mes = $9
        `, [pesoPorcentualNum, estado, totalInt, ejecucionInt, cumplimientoNum, proyecto, modulo, nombreActividad, mes]);
        
        console.log('Registro actualizado para:', { proyecto, modulo, nombreActividad, mes });
      } else {
        // Insertar nuevo registro
        await db.query(`
          INSERT INTO tbl_cumplimiento 
          (proyecto, modulo, descripcion, actividad, peso_porcentual, estado, total, ejecucion, cumplimiento, mes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          proyecto, 
          modulo, 
          descripcion || '', 
          nombreActividad, 
          pesoPorcentualNum, 
          estado, 
          totalInt, 
          ejecucionInt, 
          cumplimientoNum, 
          mes
        ]);
        
        console.log('Nuevo registro insertado para:', { proyecto, modulo, nombreActividad, mes });
      }
    }

    // Confirmar transacción
    await db.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Datos de cumplimiento actualizados correctamente',
      registrosActualizados: actividades.length
    });

  } catch (error) {
    // Revertir transacción en caso de error
    await db.query('ROLLBACK');
    console.error('Error al actualizar cumplimiento:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error interno del servidor al actualizar los datos',
      details: error.message 
    });
  }
};

module.exports = { obtenerActividadesCumplimiento, actualizarActividadesCumplimiento };
