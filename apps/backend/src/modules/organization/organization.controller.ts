import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { CreateOrgDto, UpdateOrgDto, MoveOrgDto } from './dto/organization.dto';
import { RequirePermissions, CurrentUser } from '../../common/decorators';

@ApiTags('组织架构')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Post()
  @ApiOperation({ summary: '创建组织' })
  @RequirePermissions('system:org:create')
  create(@Body() dto: CreateOrgDto, @CurrentUser('id') userId: string) {
    return this.orgService.create(dto, userId);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取组织树' })
  @RequirePermissions('system:org:list')
  getTree() {
    return this.orgService.getTree();
  }

  @Get(':id')
  @ApiOperation({ summary: '组织详情' })
  @RequirePermissions('system:org:detail')
  findOne(@Param('id') id: string) {
    return this.orgService.findById(id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: '获取子组织' })
  @RequirePermissions('system:org:list')
  getChildren(@Param('id') id: string) {
    return this.orgService.getChildren(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新组织' })
  @RequirePermissions('system:org:update')
  update(@Param('id') id: string, @Body() dto: UpdateOrgDto, @CurrentUser('id') userId: string) {
    return this.orgService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除组织' })
  @RequirePermissions('system:org:delete')
  remove(@Param('id') id: string) {
    return this.orgService.remove(id);
  }

  @Post('move')
  @ApiOperation({ summary: '拖拽划转组织' })
  @RequirePermissions('system:org:move')
  move(@Body() dto: MoveOrgDto, @CurrentUser('id') userId: string) {
    return this.orgService.moveNode(dto, userId);
  }

  @Post(':id/disable')
  @ApiOperation({ summary: '一键熔断（停用分会）' })
  @RequirePermissions('system:org:disable')
  disable(@Param('id') id: string) {
    return this.orgService.disableOrg(id);
  }
}
