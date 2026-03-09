import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateRevenueDto, QueryRevenueDto, CreateEventBudgetDto, CreateExpenseDto, QueryExpenseDto, ConfirmPaymentDto } from './dto/finance.dto';
import { CurrentUser } from '../../common/decorators';

@ApiTags('财务内控')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  // --- 收款 ---
  @Post('revenues')
  @ApiOperation({ summary: '录入收款登记单' })
  createRevenue(@Body() dto: CreateRevenueDto, @CurrentUser('id') userId: string) {
    return this.service.createRevenue(dto, userId);
  }

  @Get('revenues')
  findAllRevenues(@Query() query: QueryRevenueDto) { return this.service.findAllRevenues(query); }

  // --- 清算 ---
  @Post('settlements/generate')
  @ApiOperation({ summary: '生成清算账单' })
  generateBill(@Body() body: { orgId: string; period: string }) {
    return this.service.generateSettlementBill(body.orgId, body.period);
  }

  @Get('settlements')
  findAllBills(@Query('orgId') orgId?: string) { return this.service.findAllBills(orgId); }

  // --- 预算包 ---
  @Post('budgets')
  @ApiOperation({ summary: '提报赛事预算包' })
  createBudget(@Body() dto: CreateEventBudgetDto, @CurrentUser('id') userId: string) {
    return this.service.createBudget(dto, userId);
  }

  @Get('budgets')
  findAllBudgets(@Query('orgId') orgId?: string) { return this.service.findAllBudgets(orgId); }

  @Get('budgets/:id')
  findBudgetById(@Param('id') id: string) { return this.service.findBudgetById(id); }

  @Post('budgets/:id/approve')
  @ApiOperation({ summary: '审批预算包' })
  approveBudget(@Param('id') id: string, @Body() body: { approve: boolean }) {
    return this.service.approveBudget(id, body.approve);
  }

  // --- 报销 ---
  @Post('expenses')
  @ApiOperation({ summary: '提交报销/付款单' })
  createExpense(@Body() dto: CreateExpenseDto, @CurrentUser('id') userId: string, @CurrentUser('realName') userName: string) {
    return this.service.createExpense(dto, userId, userName);
  }

  @Get('expenses')
  findAllExpenses(@Query() query: QueryExpenseDto) { return this.service.findAllExpenses(query); }

  @Post('expenses/:id/approve')
  @ApiOperation({ summary: '审批报销单' })
  approveExpense(@Param('id') id: string, @Body() body: { approve: boolean }) {
    return this.service.approveExpense(id, body.approve);
  }

  @Post('expenses/:id/confirm-payment')
  @ApiOperation({ summary: '出纳确认付款(必须上传回单)' })
  confirmPayment(@Param('id') id: string, @Body() dto: ConfirmPaymentDto) {
    return this.service.confirmPayment(id, dto);
  }

  // --- 审批配置 ---
  @Get('approval-configs')
  getApprovalConfigs() { return this.service.getApprovalConfigs(); }

  @Post('approval-configs')
  upsertApprovalConfig(@Body() data: any) { return this.service.upsertApprovalConfig(data); }
}
