import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const _port = process.env.PORT || 7777;
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
  });
  app.setGlobalPrefix('api');
  app.use(bodyParser.json()); // Add this line
  app.use(bodyParser.urlencoded({ extended: true }));
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(_port);
  console.log(`backend run on port:${_port}`);
}
bootstrap();
