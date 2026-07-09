import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser'; // 1. Import body-parser

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 2. Configure body-parser to handle URL encoded data
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json()); // Keep this for your regular API endpoints

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  await app.listen(port);
  
  // eslint-disable-next-line no-console
  console.log(`AfriPay backend listening on port ${port}`);
}
bootstrap();