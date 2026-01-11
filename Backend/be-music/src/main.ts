import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS để Next.js gọi được API
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(4000);
  console.log('\n🚀 [BACKEND]: Server đang chạy tại http://localhost:4000');
}
bootstrap();
