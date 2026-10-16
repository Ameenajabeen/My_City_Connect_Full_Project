import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for local web dashboard and mobile development.
  const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',').map((v) => v.trim()).filter(Boolean);
  app.enableCors({
    origin: configuredOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Serve local evidence files when STORAGE_DRIVER=local.

  // Global Interceptors & Filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('My City Connect / FixMyCity Civic API')
    .setDescription(
      'Unified modular backend serving Citizen Flutter Mobile App, Worker Mobile App, and Officer Web Dashboard. Features YOLOv8 vision verification, GPS proximity duplicate detection, and real-time tracking.'
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication', 'Citizen & Worker registration and JWT token management')
    .addTag('Users & Citizen Profile', 'Citizen profile, language, and notification preferences')
    .addTag('Complaints', 'Citizen grievance lifecycle, GPS coordinates, and timeline history')
    .addTag('Uploads & Evidence Storage', 'Multipart photographic evidence storage')
    .addTag('AI Image Verification & Duplicate Detection', 'Computer vision defect detection & spatial matching')
    .addTag('Real-time Tracking', 'WebSocket & telemetry for field worker coordination')
    .addTag('Notifications', 'Push notification alerts via Firebase Cloud Messaging')
    .addTag('Citizen Feedback', 'Post-resolution ratings and citizen satisfaction metrics')
    .addTag('Workers', 'Municipal field technicians and workforce availability')
    .addTag('Assignments', 'Officer task dispatch and worker assignment workflows')
    .addTag('Departments', 'Civic departments and automated category allocation')
    .addTag('Red Zones & Spatial Hotspots', 'Geographical defect clustering')
    .addTag('Civic Chatbot Assistant', 'Multilingual chatbot guidance in English, Tamil, and Hindi')
    .addTag('System Health', 'Service readiness and dependency probes')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`My City Connect Unified Backend is running on port ${port}`);
  logger.log(`Swagger OpenAPI documentation available at http://localhost:${port}/docs`);
}

bootstrap();
