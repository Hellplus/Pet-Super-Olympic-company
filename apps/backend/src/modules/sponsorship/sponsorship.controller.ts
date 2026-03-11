import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SponsorshipService } from './sponsorship.service';
import { CreateProtectedCategoryDto, CreateSponsorClientDto, CreateSponsorContractDto, QueryContractDto } from './dto/sponsorship.dto';
import { CurrentUser } from '../../common/decorators';

@ApiTags('招商合规')
@ApiBearerAuth()
@Controller('sponsorship')
export class SponsorshipController {
  constructor(private readonly service: SponsorshipService) {}

  // --- 品类保护 ---
  @Post('protected-categories')
  @ApiOperation({ summary: '新增受保护品类' })
  createCategory(@Body() dto: CreateProtectedCategoryDto) { return this.service.createProtectedCategory(dto); }

  @Get('protected-categories')
  getAllCategories() { return this.service.getAllProtectedCategories(); }

  @Delete('protected-categories/:id')
  removeCategory(@Param('id') id: string) { return this.service.removeProtectedCategory(id); }

  @Get('check-category')
  @ApiOperation({ summary: '品类排他校验' })
  checkCategory(@Query('category') category: string) { return this.service.checkCategoryConflict(category); }

  // --- 客户 ---
  @Post('clients')
  @ApiOperation({ summary: '录入赞助商客户' })
  createClient(@Body() dto: CreateSponsorClientDto) { return this.service.createClient(dto); }

  @Get('clients')
  findAllClients(@Query('orgId') orgId?: string) { return this.service.findAllClients(orgId); }

  @Post('clients/:id/refer-hq')
  @ApiOperation({ summary: '引荐给总部' })
  referToHq(@Param('id') id: string) { return this.service.referToHq(id); }

  // --- 合同 ---
  @Post('contracts')
  @ApiOperation({ summary: '新建赞助合同' })
  createContract(@Body() dto: CreateSponsorContractDto, @CurrentUser('id') userId: string) {
    return this.service.createContract(dto, userId);
  }

  @Get('contracts')
  findAllContracts(@Query() query: QueryContractDto) { return this.service.findAllContracts(query); }

  @Post('contracts/:id/activate')
  @ApiOperation({ summary: '生效合同' })
  activateContract(@Param('id') id: string) { return this.service.activateContract(id); }

  @Post('contracts/:id/decompose')
  @ApiOperation({ summary: '权益一键拆包' })
  decomposeRights(@Param('id') id: string, @Body() body: { tasks: any[] }) {
    return this.service.decomposeRights(id, body.tasks);
  }

  // --- 交付 ---
  @Get('contracts/:contractId/tasks')
  getDeliveryTasks(@Param('contractId') contractId: string) {
    return this.service.getDeliveryTasks(contractId);
  }

  @Post('delivery-tasks/:id/evidence')
  @ApiOperation({ summary: '提交交付证据(带水印照片+GPS元数据)' })
  submitEvidence(@Param('id') id: string, @Body() body: { photos: any[]; completedQty: number }) {
    return this.service.submitEvidence(id, body.photos, body.completedQty);
  }

  @Get('delivery/report/:contractId')
  @ApiOperation({ summary: '生成赞助执行结案报告数据' })
  async generateReport(@Param('contractId') contractId: string) {
    return this.service.generateReportData(contractId);
  }
}
