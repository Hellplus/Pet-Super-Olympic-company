import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BranchHrService } from './branch-hr.service';
import { CreateBranchApplicationDto, ApproveBranchDto, QueryBranchApplicationDto } from './dto/branch-application.dto';
import { CreateExpertDto, UpdateExpertDto, QueryExpertDto } from './dto/expert.dto';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('分支机构与人事')
@ApiBearerAuth()
@Controller('branch-hr')
export class BranchHrController {
  constructor(private readonly service: BranchHrService) {}

  // --- 入驻申请 ---
  @Public()
  @Post('applications')
  @ApiOperation({ summary: '提交入驻申请(外部H5)' })
  createApplication(@Body() dto: CreateBranchApplicationDto) {
    return this.service.createApplication(dto);
  }

  @Get('applications')
  @ApiOperation({ summary: '查询入驻申请列表' })
  findAllApplications(@Query() query: QueryBranchApplicationDto) {
    return this.service.findAllApplications(query);
  }

  @Get('applications/:id')
  findApplicationById(@Param('id') id: string) {
    return this.service.findApplicationById(id);
  }

  @Post('applications/:id/approve')
  @ApiOperation({ summary: '审批入驻申请' })
  approveApplication(
    @Param('id') id: string,
    @Body() dto: ApproveBranchDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('realName') userName: string,
  ) {
    return this.service.approveApplication(id, dto, userId, userName);
  }

  @Get('applications/:id/records')
  @ApiOperation({ summary: '查看审批记录' })
  getApprovalRecords(@Param('id') id: string) {
    return this.service.getApprovalRecords('BRANCH_APP', id);
  }

  // --- 专家库 ---
  @Post('experts')
  @ApiOperation({ summary: '新增专家' })
  createExpert(@Body() dto: CreateExpertDto) {
    return this.service.createExpert(dto);
  }

  @Get('experts')
  @ApiOperation({ summary: '专家列表' })
  findAllExperts(@Query() query: QueryExpertDto) {
    return this.service.findAllExperts(query);
  }

  @Get('experts/:id')
  findExpertById(@Param('id') id: string) {
    return this.service.findExpertById(id);
  }

  @Put('experts/:id')
  updateExpert(@Param('id') id: string, @Body() dto: UpdateExpertDto) {
    return this.service.updateExpert(id, dto);
  }

  @Delete('experts/:id')
  removeExpert(@Param('id') id: string) {
    return this.service.removeExpert(id);
  }

  // --- 证书 ---
  @Post('experts/:expertId/certificates')
  addCertificate(@Param('expertId') expertId: string, @Body() data: any) {
    return this.service.addCertificate(expertId, data);
  }

  @Get('experts/:expertId/certificates')
  getExpertCertificates(@Param('expertId') expertId: string) {
    return this.service.getExpertCertificates(expertId);
  }

  // --- 调派 ---
  @Get('experts/:expertId/assignments')
  getExpertAssignments(@Param('expertId') expertId: string) {
    return this.service.getExpertAssignments(expertId);
  }

  @Post('expert-assignments')
  createAssignment(@Body() data: any) {
    return this.service.createAssignment(data);
  }

  @Post('expert-assignments/:id/rate')
  rateAssignment(@Param('id') id: string, @Body() body: { rating: number; reviewComment: string }) {
    return this.service.rateAssignment(id, body.rating, body.reviewComment);
  }

  // --- 全量证书管理 ---
  @Post('certificates')
  @ApiOperation({ summary: '新增通用证书(支持专家/裁判/赛组委/地方等)' })
  createCertificate(@Body() data: any) {
    return this.service.createCertificate(data);
  }

  @Get('certificates')
  @ApiOperation({ summary: '全量证书列表(支持搜索、按状态/类型筛选)' })
  findAllCertificates(
    @Query('expertId') expertId?: string,
    @Query('certType') certType?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAllCertificates({
      expertId, certType, keyword, status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Put('certificates/:id')
  @ApiOperation({ summary: '更新证书' })
  updateCertificate(@Param('id') id: string, @Body() data: any) {
    return this.service.updateCertificate(id, data);
  }

  @Delete('certificates/:id')
  @ApiOperation({ summary: '删除证书' })
  removeCertificate(@Param('id') id: string) {
    return this.service.removeCertificate(id);
  }

  // --- 证书到期预警 ---
  @Get('cert-expiry-warnings')
  @ApiOperation({ summary: '专家证书到期预警(默认30天内)' })
  getCertExpiryWarnings(@Query('daysAhead') daysAhead?: string) {
    return this.service.getCertExpiryWarnings(daysAhead ? Number(daysAhead) : 30);
  }

  // --- 跨区调派搜索 ---
  @Get('experts/dispatch-search')
  @ApiOperation({ summary: '跨区调派专家搜索(全国范围)' })
  searchForDispatch(
    @Query('expertType') expertType?: string,
    @Query('starLevel') starLevel?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.service.searchExpertsForDispatch({
      expertType, starLevel: starLevel ? Number(starLevel) : undefined, keyword,
    });
  }
}
