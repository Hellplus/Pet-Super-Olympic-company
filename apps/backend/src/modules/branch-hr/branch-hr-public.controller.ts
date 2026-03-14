import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BranchHrService } from './branch-hr.service';
import { CreateBranchApplicationDto } from './dto/branch-application.dto';

/**
 * 外部H5入驻申请接口 - 无需JWT鉴权
 * 路由前缀: /api/v1/public/branch-apply
 */
@ApiTags('外部入驻申请(H5)')
@Controller('public/branch-apply')
export class BranchHrPublicController {
  constructor(private readonly service: BranchHrService) {}

  @Post()
  @ApiOperation({ summary: 'H5提交分会入驻申请(无需登录)' })
  submitApplication(@Body() dto: CreateBranchApplicationDto) {
    return this.service.createApplication(dto);
  }

  @Get(':id/status')
  @ApiOperation({ summary: '查询申请状态(无需登录)' })
  getStatus(@Param('id') id: string) {
    return this.service.findApplicationById(id);
  }
}
