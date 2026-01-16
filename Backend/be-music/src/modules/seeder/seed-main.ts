import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeederService);

  try {
    console.log('🚀 Bắt đầu quá trình seeding...');
    await seeder.seed(1000000); // Gọi hàm seed với 1 triệu dòng
    console.log('✅ Seeding hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi seeding:', error);
  } finally {
    await app.close();
  }
}
bootstrap();
