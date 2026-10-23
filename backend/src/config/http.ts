import type { INestApplication } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { getAllowedOrigins } from './cors';

export function configureHttp(app: INestApplication): void {
  app.enableCors({ origin: getAllowedOrigins() });
  app.use(bodyParser.urlencoded({ extended: false, limit: '32kb', parameterLimit: 20 }));
  app.use(bodyParser.json({ limit: '32kb' }));
}
