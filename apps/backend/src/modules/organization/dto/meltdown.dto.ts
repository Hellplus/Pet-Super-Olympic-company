import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeltdownDto {
  @ApiProperty({ description: '分会ID' })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({ description: '熍断原因' })
  @IsOptional() @IsString()
  reason?: string;
}
