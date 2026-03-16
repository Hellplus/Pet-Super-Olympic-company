import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';

@ApiTags('数据导入导出')
@ApiBearerAuth()
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // ========== 导出接口 ==========

  @Get('experts')
  @ApiOperation({ summary: '导出专家数据' })
  async exportExperts(@Res() res: Response, @Query() query: any) {
    return this.exportService.exportExperts(res, query);
  }

  @Get('certificates')
  @ApiOperation({ summary: '导出证书数据' })
  async exportCertificates(@Res() res: Response, @Query() query: any) {
    return this.exportService.exportCertificates(res, query);
  }

  @Get('revenues')
  @ApiOperation({ summary: '导出收款记录' })
  async exportRevenues(@Res() res: Response, @Query() query: any) {
    return this.exportService.exportRevenues(res, query);
  }

  @Get('expenses')
  @ApiOperation({ summary: '导出报销记录' })
  async exportExpenses(@Res() res: Response, @Query() query: any) {
    return this.exportService.exportExpenses(res, query);
  }

  @Get('contracts')
  @ApiOperation({ summary: '导出赞助合同' })
  async exportContracts(@Res() res: Response, @Query() query: any) {
    return this.exportService.exportContracts(res, query);
  }

  @Get('clients')
  @ApiOperation({ summary: '导出客户数据' })
  async exportClients(@Res() res: Response, @Query() query: any) {
    return this.exportService.exportClients(res, query);
  }

  @Get('events')
  @ApiOperation({ summary: '导出赛事数据' })
  async exportEvents(@Res() res: Response, @Query() query: any) {
    return this.exportService.exportEvents(res, query);
  }

  @Get('budgets')
  @ApiOperation({ summary: '导出预算数据' })
  async exportBudgets(@Res() res: Response, @Query() query: any) {
    return this.exportService.exportBudgets(res, query);
  }

  @Get('settlements')
  @ApiOperation({ summary: '导出清算账单' })
  async exportSettlements(@Res() res: Response, @Query() query: any) {
    return this.exportService.exportSettlements(res, query);
  }

  // ========== 导入模板下载 ==========

  @Get('template/experts')
  @ApiOperation({ summary: '下载专家导入模板' })
  async templateExperts(@Res() res: Response) {
    return this.exportService.templateExperts(res);
  }

  @Get('template/certificates')
  @ApiOperation({ summary: '下载证书导入模板' })
  async templateCertificates(@Res() res: Response) {
    return this.exportService.templateCertificates(res);
  }

  @Get('template/revenues')
  @ApiOperation({ summary: '下载收款导入模板' })
  async templateRevenues(@Res() res: Response) {
    return this.exportService.templateRevenues(res);
  }

  // ========== 导入接口 ==========

  @Post('import/experts')
  @ApiOperation({ summary: '导入专家数据' })
  @UseInterceptors(FileInterceptor('file'))
  async importExperts(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请上传文件');
    return this.exportService.importExperts(file.buffer);
  }

  @Post('import/certificates')
  @ApiOperation({ summary: '导入证书数据' })
  @UseInterceptors(FileInterceptor('file'))
  async importCertificates(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请上传文件');
    return this.exportService.importCertificates(file.buffer);
  }

  @Post('import/revenues')
  @ApiOperation({ summary: '导入收款记录' })
  @UseInterceptors(FileInterceptor('file'))
  async importRevenues(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请上传文件');
    return this.exportService.importRevenues(file.buffer);
  }
}
