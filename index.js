const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const swaggerJSDoc = require("swagger-jsdoc"); // Mantén esta importación
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de reservas de restaurante",
      version: "1.0.0",
      description: "Documentación de mi API con Swagger",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js'],
};

// Generar la especificación de Swagger
const swaggerDocs = swaggerJSDoc(swaggerOptions);

// Configurar Swagger en Express
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const loginRoutes = require('./routes/login');

const mesasRoute = require('./routes/mesas');
const horariosRoute = require('./routes/horarios');
const reservacionesRoute = require('./routes/reservaciones');
const usuariosRoute = require('./routes/usuarios')
const empleadosRoute = require('./routes/empleados')
//const { router: loginRoute } = require('./routes/login');

app.use(require('./routes/mesas'));

app.use('/api', mesasRoute);
app.use('/api', horariosRoute);
app.use('/api', reservacionesRoute);
app.use('/api', usuariosRoute);
app.use('/api', empleadosRoute);
//app.use('/api', loginRoute);
app.use('/', loginRoutes.router);
const PORT = process.env.PORT;
app.listen(PORT,() => {
  console.log('El servidor escucha en el puerto ' + PORT);
  console.log(`Documentación en http://localhost:${PORT}/api-docs`);
});