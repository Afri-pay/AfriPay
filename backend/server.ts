import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { configureHttp } from './src/config/http';

/**
 * Vercel Node server entry point. The normal Nest entry point remains
 * src/main.ts for local development and traditional Node deployments.
 */
async function start() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureHttp(app);

  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(Number.isInteger(port) && port > 0 ? port : 3000);
}

void start();
