import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { RequirePermissions } from '../../common/decorators';

@ApiTags('审计日志')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: '审计日志列表' })
  @RequirePermissions('system:audit:list')
  findAll(@Query() query: QueryAuditLogDto) {
    return this.auditLogService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '审计日志详情' })
  @RequirePermissions('system:audit:detail')
  findOne(@Param('id') id: string) {
    return this.auditLogService.findById(id);
  }
}
