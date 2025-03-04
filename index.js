const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const mesasRoute = require('./routes/mesas');
const horariosRoute = require('./routes/horarios');
const reservacionesRoute = require('./routes/reservaciones');
const usuariosRoute = require('./routes/usuarios')
const { router: loginRoute } = require('./routes/login');

app.use(require('./routes/mesas'));

app.use('/api', mesasRoute);
app.use('/api', horariosRoute);
app.use('/api', reservacionesRoute);
app.use('/api', usuariosRoute);
app.use('/api', loginRoute);

const PORT = process.env.PORT;
app.listen(PORT,() => {
  console.log('El servidor escucha en el puerto ' + PORT);
});