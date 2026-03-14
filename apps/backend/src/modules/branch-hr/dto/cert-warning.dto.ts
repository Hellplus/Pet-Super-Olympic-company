import { IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CertWarningQueryDto {
  @ApiPropertyOptional({ description: '预警天数(默认30天)' })
  @IsOptional()
  @IsNumber()
  daysAhead?: number;
}
