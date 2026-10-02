import app from './app.js';
import { env } from './config/env.config.js';
import { connectDatabase } from './config/database.config.js';

const startServer = async () => {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`Servidor escuchando en http://localhost:${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});
