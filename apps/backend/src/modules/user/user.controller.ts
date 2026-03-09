import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto, AssignRolesDto } from './dto/user.dto';
import { RequirePermissions, CurrentUser, DataScope } from '../../common/decorators';

@ApiTags('用户管理')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @RequirePermissions('system:user:create')
  create(@Body() dto: CreateUserDto, @CurrentUser('id') userId: string) {
    return this.userService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: '用户列表' })
  @RequirePermissions('system:user:list')
  @DataScope()
  findAll(@Query() query: QueryUserDto, @Req() req: any) {
    return this.userService.findAll(query, req.dataScope);
  }

  @Get(':id')
  @ApiOperation({ summary: '用户详情' })
  @RequirePermissions('system:user:detail')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  @RequirePermissions('system:user:update')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser('id') userId: string) {
    return this.userService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @RequirePermissions('system:user:delete')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Post(':id/assign-roles')
  @ApiOperation({ summary: '分配角色' })
  @RequirePermissions('system:user:assign-role')
  assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    return this.userService.assignRoles(id, dto.roleIds);
  }

  @Post(':id/disable')
  @ApiOperation({ summary: '封停账号' })
  @RequirePermissions('system:user:disable')
  disable(@Param('id') id: string) {
    return this.userService.disableUser(id);
  }

  @Post(':id/enable')
  @ApiOperation({ summary: '启用账号' })
  @RequirePermissions('system:user:enable')
  enable(@Param('id') id: string) {
    return this.userService.enableUser(id);
  }
}
