import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysConfig } from './entities/sys-config.entity';

@Injectable()
export class SysConfigService {
  constructor(@InjectRepository(SysConfig) private readonly configRepo: Repository<SysConfig>) {}

  async findAll() { return this.configRepo.find({ order: { configKey: 'ASC' } }); }

  async findByKey(key: string) {
    const config = await this.configRepo.findOne({ where: { configKey: key } });
    if (!config) throw new NotFoundException('配置不存在');
    return config;
  }

  async upsert(configKey: string, configValue: string, configName: string, userId: string) {
    let config = await this.configRepo.findOne({ where: { configKey } });
    if (config) {
      if (config.isSystem) throw new BadRequestException('系统内置配置不可修改');
      config.configValue = configValue;
      config.updatedBy = userId;
      return this.configRepo.save(config);
    }
    config = this.configRepo.create({ configKey, configValue, configName, createdBy: userId });
    return this.configRepo.save(config);
  }

  async remove(id: string) {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('配置不存在');
    if (config.isSystem) throw new BadRequestException('系统内置配置不可删除');
    return this.configRepo.softRemove(config);
  }
}
