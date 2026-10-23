import { NestFactory } from '@nestjs/core';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from '../src/app.module';
import { configureHttp } from '../src/config/http';

type NodeHandler = (request: IncomingMessage, response: ServerResponse, next?: () => void) => unknown;

let cachedHandler: NodeHandler | undefined;

async function getHandler(): Promise<NodeHandler> {
  if (cachedHandler) return cachedHandler;

  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureHttp(app);
  await app.init();

  cachedHandler = app.getHttpAdapter().getInstance() as NodeHandler;
  return cachedHandler;
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const appHandler = await getHandler();
  appHandler(request, response);
}
