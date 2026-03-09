import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';
import { RequirePermissions, CurrentUser } from '../../common/decorators';

@ApiTags('权限管理')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permService: PermissionService) {}

  @Post()
  @ApiOperation({ summary: '创建权限' })
  @RequirePermissions('system:perm:create')
  create(@Body() dto: CreatePermissionDto, @CurrentUser('id') userId: string) {
    return this.permService.create(dto, userId);
  }

  @Get('tree')
  @ApiOperation({ summary: '权限树' })
  @RequirePermissions('system:perm:list')
  getTree() {
    return this.permService.getTree();
  }

  @Get()
  @ApiOperation({ summary: '权限列表（平铺）' })
  @RequirePermissions('system:perm:list')
  findAll() {
    return this.permService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '权限详情' })
  @RequirePermissions('system:perm:detail')
  findOne(@Param('id') id: string) {
    return this.permService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新权限' })
  @RequirePermissions('system:perm:update')
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto, @CurrentUser('id') userId: string) {
    return this.permService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除权限' })
  @RequirePermissions('system:perm:delete')
  remove(@Param('id') id: string) {
    return this.permService.remove(id);
  }
}
