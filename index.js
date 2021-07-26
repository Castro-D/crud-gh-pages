const express = require('express');
const handlebars = require('express-handlebars');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const methodOverride = require('method-override');
let equipos = require('./data/equipos.json');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const filtroArchivo = (req, file, cb) => {
  const filetypes = /jpeg|jpg|svg/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    cb(null, true);
  }
  cb(null, false);
};

const upload = multer({
  storage,
  filtroArchivo,
});
const app = express();
const PUERTO = 8080;

app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars({
  layoutsDir: `${__dirname}/views/layouts`,
  partialsDir: `${__dirname}/views/partials/`,
}));

// middleware
app.use(express.static(`${__dirname}/uploads`));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
  res.render('main', {
    layout: 'index',
    equipos,
    css: 'tabla-estilos.css',
  });
});

app.get('/equipo/:id/ver', (req, res) => {
  res.render('Equipo', {
    layout: 'index',
    // devuelve objeto del equipo con el id especificado
    equipo: equipos.find((x) => x.id === req.params.id),
    css: 'pagina-ver.css',
  });
});

app.get('/equipo/crear', (req, res) => {
  res.render('nuevo-equipo', {
    layout: 'index',
    css: 'forms.css',
  });
});

app.post('/equipo/crear', upload.single('imagen'), (req, res) => {
  equipos.push({
    id: uuidv4(),
    name: req.body.name,
    area: { name: req.body.country },
    tla: req.body.tla,
    clubColors: req.body.colores,
    crestUrl: `/${req.file.originalname}`,
  });
  fs.writeFileSync('./data/equipos.json', JSON.stringify(equipos));
  res.redirect(303, '/');
});

app.delete('/equipo/:id', (req, res) => {
  equipos = equipos.filter((equipo) => equipo.id !== req.params.id);
  fs.writeFileSync('./data/equipos.json', JSON.stringify(equipos));
  res.json({ redirect: '/' });
});

app.get('/equipo/:id/editar', (req, res) => {
  res.render('editar-equipo', {
    layout: 'index',
    // devuelve objeto del equipo con el id especificado
    equipo: equipos.find((x) => x.id === req.params.id),
    css: 'forms.css',
  });
});

app.put('/equipo/:id/editar', upload.single('imagen'), (req, res) => {
  const equipo = equipos.find((x) => x.id === req.params.id);
  equipo.name = req.body.name;
  equipo.area.name = req.body.country;
  equipo.tla = req.body.tla;
  equipo.clubColors = req.body.colores;
  if (req.file) {
    equipo.crestUrl = `/${req.file.originalname}`;
  }
  const equipoMapeado = equipos.map((obj) => {
    if (equipo.id === obj.id) {
      const resultado = Object.assign(obj, equipo);
      return resultado;
    }
    return obj;
  });
  fs.writeFileSync('./data/equipos.json', JSON.stringify(equipoMapeado), 'utf-8');
  res.redirect(303, '/');
});

app.listen(PUERTO, () => {
  console.log(`Escuchando requests en https://localhost:${PUERTO}`);
});
