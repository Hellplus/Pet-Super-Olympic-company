import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SysConfigService } from './sys-config.service';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';

@ApiTags('系统配置')
@ApiBearerAuth()
@Controller('sys-config')
export class SysConfigController {
  constructor(private readonly sysConfigService: SysConfigService) {}

  @Get()
  @ApiOperation({ summary: '配置列表' })
  @RequirePermissions('system:config:list')
  findAll() {
    return this.sysConfigService.findAll();
  }

  @Get('by-key/:key')
  @ApiOperation({ summary: '按键名获取配置' })
  findByKey(@Param('key') key: string) {
    return this.sysConfigService.findByKey(key);
  }

  @Post()
  @ApiOperation({ summary: '新增/更新配置' })
  @RequirePermissions('system:config:update')
  upsert(@Body() data: any, @CurrentUser('id') userId: string) {
    return this.sysConfigService.upsert(data.configKey, data.configValue, data.configName, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除配置' })
  @RequirePermissions('system:config:delete')
  remove(@Param('id') id: string) {
    return this.sysConfigService.remove(id);
  }
}
