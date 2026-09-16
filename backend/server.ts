import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { AppModule } from './src/app.module';
import { getAllowedOrigins } from './src/config/cors';

/**
 * Vercel Node server entry point. The normal Nest entry point remains
 * src/main.ts for local development and traditional Node deployments.
 */
async function start() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: getAllowedOrigins() });
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(Number.isInteger(port) && port > 0 ? port : 3000);
}

void start();
