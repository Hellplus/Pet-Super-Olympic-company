import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto, AssignPermissionsDto } from './dto/role.dto';
import { RequirePermissions, CurrentUser } from '../../common/decorators';

@ApiTags('角色管理')
@ApiBearerAuth()
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @RequirePermissions('system:role:create')
  create(@Body() dto: CreateRoleDto, @CurrentUser('id') userId: string) {
    return this.roleService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: '角色列表' })
  @RequirePermissions('system:role:list')
  findAll(@Query() query: QueryRoleDto) {
    return this.roleService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '角色详情' })
  @RequirePermissions('system:role:detail')
  findOne(@Param('id') id: string) {
    return this.roleService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色' })
  @RequirePermissions('system:role:update')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @CurrentUser('id') userId: string) {
    return this.roleService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @RequirePermissions('system:role:delete')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: '分配权限' })
  @RequirePermissions('system:role:assign-perm')
  assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.roleService.assignPermissions(id, dto, userId);
  }

  @Get(':id/permission-ids')
  @ApiOperation({ summary: '获取角色权限ID列表' })
  @RequirePermissions('system:role:detail')
  getPermissionIds(@Param('id') id: string) {
    return this.roleService.getRolePermissionIds(id);
  }
}
