import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiPropertyOptional({ description: '业务类型' })
  @IsOptional() @IsString()
  bizType?: string;

  @ApiPropertyOptional({ description: '业务ID' })
  @IsOptional() @IsUUID()
  bizId?: string;

  @ApiPropertyOptional({ description: '访问级别', enum: ['public', 'private', 'internal'] })
  @IsOptional() @IsString()
  accessLevel?: string;
}

export class QueryFileDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  bizType?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  bizId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  originalName?: string;
}
