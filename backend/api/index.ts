import { NestFactory } from '@nestjs/core';
import type { IncomingMessage, ServerResponse } from 'node:http';
import * as bodyParser from 'body-parser';
import { AppModule } from '../src/app.module';
import { getAllowedOrigins } from '../src/config/cors';

type NodeHandler = (request: IncomingMessage, response: ServerResponse, next?: () => void) => unknown;

let cachedHandler: NodeHandler | undefined;

async function getHandler(): Promise<NodeHandler> {
  if (cachedHandler) return cachedHandler;

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: getAllowedOrigins() });
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  await app.init();

  cachedHandler = app.getHttpAdapter().getInstance() as NodeHandler;
  return cachedHandler;
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const appHandler = await getHandler();
  appHandler(request, response);
}
