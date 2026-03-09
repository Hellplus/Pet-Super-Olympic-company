import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DictService } from './dict.service';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';

@ApiTags('数据字典')
@ApiBearerAuth()
@Controller('dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Get('types') @ApiOperation({ summary: '字典类型列表' }) @RequirePermissions('system:dict:list')
  findAllTypes() { return this.dictService.findAllTypes(); }

  @Post('types') @ApiOperation({ summary: '创建字典类型' }) @RequirePermissions('system:dict:create')
  createType(@Body() data: any, @CurrentUser('id') userId: string) { return this.dictService.createType(data, userId); }

  @Put('types/:id') @ApiOperation({ summary: '更新字典类型' }) @RequirePermissions('system:dict:update')
  updateType(@Param('id') id: string, @Body() data: any, @CurrentUser('id') userId: string) { return this.dictService.updateType(id, data, userId); }

  @Delete('types/:id') @ApiOperation({ summary: '删除字典类型' }) @RequirePermissions('system:dict:delete')
  removeType(@Param('id') id: string) { return this.dictService.removeType(id); }

  @Get('data/:typeCode') @ApiOperation({ summary: '按类型编码获取字典数据' })
  findDataByType(@Param('typeCode') typeCode: string) { return this.dictService.findDataByTypeCode(typeCode); }

  @Post('data') @ApiOperation({ summary: '创建字典数据' }) @RequirePermissions('system:dict:create')
  createData(@Body() data: any, @CurrentUser('id') userId: string) { return this.dictService.createData(data, userId); }

  @Put('data/:id') @ApiOperation({ summary: '更新字典数据' }) @RequirePermissions('system:dict:update')
  updateData(@Param('id') id: string, @Body() data: any, @CurrentUser('id') userId: string) { return this.dictService.updateData(id, data, userId); }

  @Delete('data/:id') @ApiOperation({ summary: '删除字典数据' }) @RequirePermissions('system:dict:delete')
  removeData(@Param('id') id: string) { return this.dictService.removeData(id); }
}
