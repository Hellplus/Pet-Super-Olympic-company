import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { UploadedFile } from './entities/uploaded-file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UploadedFile]),
    MulterModule.register({ storage: undefined }), // use memory storage
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
