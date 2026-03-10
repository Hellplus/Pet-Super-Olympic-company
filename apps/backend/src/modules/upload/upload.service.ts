import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadedFile } from './entities/uploaded-file.entity';
import { UploadFileDto, QueryFileDto } from './dto/upload.dto';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(UploadedFile) private fileRepo: Repository<UploadedFile>,
  ) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /** 上传文件 */
  async uploadFile(
    file: Express.Multer.File,
    dto: UploadFileDto,
    user: any,
  ): Promise<UploadedFile> {
    const ext = path.extname(file.originalname).toLowerCase();
    const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const dir = path.join(this.uploadDir, dateDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const storedName = crypto.randomUUID() + ext;
    const filePath = path.join(dateDir, storedName);
    const fullPath = path.join(dir, storedName);
    fs.writeFileSync(fullPath, file.buffer);

    const md5 = crypto.createHash('md5').update(file.buffer).digest('hex');

    const record = this.fileRepo.create({
      originalName: file.originalname,
      storedName,
      filePath,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileExt: ext,
      md5,
      bizType: dto.bizType,
      bizId: dto.bizId,
      accessLevel: dto.accessLevel || 'private',
      organizationId: user.organizationId,
      createdBy: user.id,
    });
    return this.fileRepo.save(record);
  }

  /** 批量上传 */
  async uploadFiles(
    files: Express.Multer.File[],
    dto: UploadFileDto,
    user: any,
  ): Promise<UploadedFile[]> {
    const results: UploadedFile[] = [];
    for (const file of files) {
      results.push(await this.uploadFile(file, dto, user));
    }
    return results;
  }

  /** 获取文件信息 */
  async getFileInfo(id: string): Promise<UploadedFile> {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('文件不存在');
    return file;
  }

  /** 获取文件流（下载） */
  async getFileStream(id: string, user: any): Promise<{ file: UploadedFile; fullPath: string; watermarkText: string }> {
    const file = await this.getFileInfo(id);
    const fullPath = path.join(this.uploadDir, file.filePath);
    if (!fs.existsSync(fullPath)) throw new NotFoundException('文件不存在于磁盘');

    // 更新下载计数
    await this.fileRepo.increment({ id }, 'downloadCount', 1);

    // 生成水印文本: 姓名+手机尾号+当前时间
    const phoneTail = user.phone ? user.phone.slice(-4) : '****';
    const watermarkText = `${user.realName || user.username} ${phoneTail} ${new Date().toLocaleString('zh-CN')}`;

    return { file, fullPath, watermarkText };
  }

  /** 按业务查询文件 */
  async queryFiles(dto: QueryFileDto): Promise<UploadedFile[]> {
    const qb = this.fileRepo.createQueryBuilder('f').where('f.deleted_at IS NULL');
    if (dto.bizType) qb.andWhere('f.biz_type = :bizType', { bizType: dto.bizType });
    if (dto.bizId) qb.andWhere('f.biz_id = :bizId', { bizId: dto.bizId });
    if (dto.originalName) qb.andWhere('f.original_name ILIKE :name', { name: `%${dto.originalName}%` });
    return qb.orderBy('f.created_at', 'DESC').getMany();
  }

  /** 删除文件（软删除） */
  async deleteFile(id: string): Promise<void> {
    await this.fileRepo.softDelete(id);
  }
}
