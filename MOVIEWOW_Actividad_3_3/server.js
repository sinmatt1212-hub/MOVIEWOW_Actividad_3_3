const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '50kb' }));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false } });

function validar(body) {
  const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : '';
  const genero = typeof body.genero === 'string' ? body.genero.trim() : '';
  const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
  const anio = Number(body.anio);
  if (!titulo || titulo.length > 150 || !genero || genero.length > 100 || descripcion.length > 2000 || !Number.isInteger(anio) || anio < 1888 || anio > 2200) return null;
  return [titulo, anio, genero, descripcion];
}
function idValido(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: 'ID inválido' }); return null; }
  return id;
}
const errorApi = (res, err) => { console.error(err); res.status(500).json({ error: 'Error al consultar la base de datos' }); };
app.get('/api/peliculas', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM peliculas ORDER BY id')).rows); } catch (e) { errorApi(res, e); }
});
app.get('/api/peliculas/:id', async (req, res) => {
  const id = idValido(req, res); if (id === null) return;
  try { const r = await pool.query('SELECT * FROM peliculas WHERE id=$1', [id]); if (!r.rowCount) return res.status(404).json({ error: 'No encontrada' }); res.json(r.rows[0]); } catch (e) { errorApi(res, e); }
});
app.post('/api/peliculas', async (req, res) => {
  const datos = validar(req.body); if (!datos) return res.status(400).json({ error: 'Datos inválidos' });
  try { const r = await pool.query('INSERT INTO peliculas(titulo,anio,genero,descripcion) VALUES($1,$2,$3,$4) RETURNING *', datos); res.status(201).json(r.rows[0]); } catch (e) { errorApi(res, e); }
});
app.put('/api/peliculas/:id', async (req, res) => {
  const id = idValido(req, res); if (id === null) return;
  const datos = validar(req.body); if (!datos) return res.status(400).json({ error: 'Datos inválidos' });
  try { const r = await pool.query('UPDATE peliculas SET titulo=$1,anio=$2,genero=$3,descripcion=$4 WHERE id=$5 RETURNING *', [...datos,id]); if (!r.rowCount) return res.status(404).json({ error: 'No encontrada' }); res.json(r.rows[0]); } catch (e) { errorApi(res, e); }
});
app.delete('/api/peliculas/:id', async (req, res) => {
  const id = idValido(req, res); if (id === null) return;
  try { const r = await pool.query('DELETE FROM peliculas WHERE id=$1 RETURNING id', [id]); if (!r.rowCount) return res.status(404).json({ error: 'No encontrada' }); res.json({ eliminado: true }); } catch (e) { errorApi(res, e); }
});
const dist = path.join(__dirname, 'dist/catalogo-frontend/browser');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/.*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}
async function iniciar() {
  if (!process.env.DATABASE_URL) throw new Error('Falta configurar DATABASE_URL en Render.');
  await pool.query("CREATE TABLE IF NOT EXISTS peliculas (id SERIAL PRIMARY KEY, titulo VARCHAR(150) NOT NULL, anio INTEGER NOT NULL, genero VARCHAR(100) NOT NULL, descripcion TEXT NOT NULL DEFAULT '')");
  await pool.query('CREATE TABLE IF NOT EXISTS configuracion (clave VARCHAR(60) PRIMARY KEY)');
  const inicializado = await pool.query("SELECT clave FROM configuracion WHERE clave='peliculas_iniciales'");
  if (inicializado.rowCount === 0) {
    const ejemplos = [
      ['Titanic',1997,'Romance / Drama','Una historia de amor a bordo del Titanic.'],
      ['Coco',2017,'Animación / Familiar','Miguel descubre la Tierra de los Muertos y la importancia de la familia.'],
      ['Avatar',2009,'Ciencia ficción / Aventura','Una aventura en el planeta Pandora.']
    ];
    const conteo = await pool.query('SELECT COUNT(*)::integer AS total FROM peliculas');
    if (conteo.rows[0].total === 0) {
      for (const p of ejemplos) await pool.query('INSERT INTO peliculas(titulo,anio,genero,descripcion) VALUES($1,$2,$3,$4)', p);
    }
    await pool.query("INSERT INTO configuracion(clave) VALUES('peliculas_iniciales') ON CONFLICT DO NOTHING");
  }
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => console.log('MOVIEWOW listo en puerto ' + port));
}
iniciar().catch(err => { console.error('No se pudo iniciar MOVIEWOW:', err.message); process.exit(1); });
