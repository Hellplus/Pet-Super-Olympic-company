import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UnreadAnnouncementQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}
