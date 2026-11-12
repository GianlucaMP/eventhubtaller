import cors from 'cors'
import express from 'express'
import pool from './db.js'

const app = express()

const origenes = (
  process.env.CORS_ORIGIN ??
  'http://localhost:5173,https://eventhubtaller.vercel.app'
)
  .split(',')
  .map((origen) => origen.trim())
  .filter(Boolean)

app.use(cors({ origin: origenes }))

app.use(express.json())

app.get('/api/eventos', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select id,
             titulo as nombre,
             descripcion,
             "cuposDisponibles" as cupos
      from eventhub.catalogo
      order by id
    `)
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'No se pudieron leer los eventos' })
  }
})

// req es el request, res es la response
app.post('/api/eventos/:id/inscripciones', async (req, res) => {
  const eventoId = Number(req.params.id)
  const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : ''
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''

  if (!Number.isInteger(eventoId) || !nombre || !email) {
    return res.status(400).json({ error: 'Datos inválidos' })
  }

  try {
    const { rows } = await pool.query(
      'select eventhub.inscribir($1, $2, $3) as resultado',
      [eventoId, nombre, email]
    )
    const resultado = rows[0].resultado
    const estados = {
      CONFIRMADA: 201,
      EVENTO_NO_ENCONTRADO: 404,
      INSCRIPCION_DUPLICADA: 409,
      EVENTO_SIN_CUPO: 409,
    }

    res.status(estados[resultado] ?? 500).json({
      resultado,
      id: eventoId,
      nombre,
      email,
    })
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: 'No se pudo registrar la inscripción' })
  }
})

export default app
