import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // USSD providers (e.g. Africa's Talking) POST application/x-www-form-urlencoded bodies.
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  await app.listen(port);
  
  // eslint-disable-next-line no-console
  console.log(`AfriPay backend listening on port ${port}`);
}
bootstrap();