import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateEventDto {
  @ApiProperty() @IsString() @IsNotEmpty() eventName: string;
  @ApiProperty() @IsUUID() orgId: string;
  @ApiProperty() @IsDateString() eventDate: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() eventEndDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() venue?: string;
  @ApiProperty() @IsString() eventType: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() expectedParticipants?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sopTemplateId?: string;
}

export class QueryEventDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() orgId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() status?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() eventName?: string;
}

export class CreateSopTemplateDto {
  @ApiProperty() @IsString() @IsNotEmpty() templateName: string;
  @ApiProperty() @IsString() eventType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() tasks: { taskName: string; daysBeforeEvent: number; defaultRole?: string; description?: string; isRequired?: boolean }[];
}

export class CreateAnnouncementDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty() @IsString() @IsNotEmpty() content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() announcementType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() targetScope?: string;
  @ApiPropertyOptional() @IsOptional() targetOrgIds?: string[];
}
