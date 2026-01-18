import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// Swagger Library
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS
  app.enableCors({
    // Cho phép từ frontend localhost:3000
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Music Manager API')
    .setDescription('Tài liệu API cho dự án Music Manager (NextJS + NestJS)')
    .setVersion('1.0')
    .addTag('Tracks', 'Các API liên quan đến bài hát') // Nhóm API
    .addTag('Stats', 'Thống kê hệ thống')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Đường dẫn truy cập: http://localhost:4000/api
  SwaggerModule.setup('api', app, document);

  await app.listen(4000);
  console.log('\n[BACKEND]: Server đang chạy tại http://localhost:4000');
  console.log('[DOCS]: Swagger UI tại http://localhost:4000/api');
}
bootstrap();
