import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators';

@ApiTags('BI驾驶舱')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '全局概览统计' })
  async getOverview(@CurrentUser() user: any) {
    return this.dashboardService.getOverview(user);
  }

  @Get('hq-commander')
  @ApiOperation({ summary: '总部总指挥大屏' })
  async getHqCommander() {
    return this.dashboardService.getHqCommanderStats();
  }

  @Get('hq-finance')
  @ApiOperation({ summary: '总部财务总监大屏' })
  async getHqFinance() {
    return this.dashboardService.getHqFinanceStats();
  }

  @Get('branch')
  @ApiOperation({ summary: '地方分会大屏' })
  async getBranch(@CurrentUser('organizationId') orgId: string) {
    return this.dashboardService.getBranchStats(orgId);
  }
}
