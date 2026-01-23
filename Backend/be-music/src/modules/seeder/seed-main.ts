// trantrungnamn/music-manager/Music-Manager-final_23_01_26/Backend/be-music/src/modules/seeder/seed-main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  // Create application context without starting the full web server
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeederService);

  try {
    console.log('Starting the database seeding process...');

    // Defaulting to 1,000,000 records for performance benchmarking
    const targetCount = 1000000;
    await seeder.seed(targetCount);

    console.log('Seeding process completed successfully.');
  } catch (error) {
    console.error('Seeding error occurred:', error);
  } finally {
    // Ensure the application context is closed after seeding
    await app.close();
  }
}

bootstrap();
