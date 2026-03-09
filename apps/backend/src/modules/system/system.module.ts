import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DictController } from './dict/dict.controller';
import { DictService } from './dict/dict.service';
import { DictType } from './dict/entities/dict-type.entity';
import { DictData } from './dict/entities/dict-data.entity';
import { SysConfigController } from './config/sys-config.controller';
import { SysConfigService } from './config/sys-config.service';
import { SysConfig } from './config/entities/sys-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DictType, DictData, SysConfig])],
  controllers: [DictController, SysConfigController],
  providers: [DictService, SysConfigService],
  exports: [DictService, SysConfigService],
})
export class SystemModule {}
