import {
  Controller, Post, Get, Delete, Param, Query, Body,
  UseInterceptors, UploadedFile as NestUploadedFile, UploadedFiles,
  Res, StreamableFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { UploadFileDto, QueryFileDto } from './dto/upload.dto';
import { CurrentUser } from '../../common/decorators';
import * as fs from 'fs';

@ApiTags('文件上传')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiOperation({ summary: '上传单个文件' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async upload(
    @NestUploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: any,
  ) {
    return this.uploadService.uploadFile(file, dto, user);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量上传文件' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 50 * 1024 * 1024 } }))
  async uploadBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadFileDto,
    @CurrentUser() user: any,
  ) {
    return this.uploadService.uploadFiles(files, dto, user);
  }

  @Get(':id/info')
  @ApiOperation({ summary: '获取文件信息' })
  async getInfo(@Param('id') id: string) {
    return this.uploadService.getFileInfo(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: '下载文件（带水印元数据）' })
  async download(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const { file, fullPath, watermarkText } = await this.uploadService.getFileStream(id, user);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
    res.setHeader('X-Watermark-Text', encodeURIComponent(watermarkText));
    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  }

  @Get()
  @ApiOperation({ summary: '查询文件列表' })
  async query(@Query() dto: QueryFileDto) {
    return this.uploadService.queryFiles(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文件' })
  async delete(@Param('id') id: string) {
    await this.uploadService.deleteFile(id);
    return { success: true };
  }
}
