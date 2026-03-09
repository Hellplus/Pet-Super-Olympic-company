import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateBranchApplicationDto {
  @ApiProperty() @IsString() @IsNotEmpty() applicantName: string;
  @ApiProperty() @IsString() @IsNotEmpty() applicantPhone: string;
  @ApiPropertyOptional() @IsOptional() @IsString() applicantEmail?: string;
  @ApiProperty() @IsString() @IsNotEmpty() branchName: string;
  @ApiProperty() @IsString() @IsNotEmpty() province: string;
  @ApiProperty() @IsString() @IsNotEmpty() city: string;
  @ApiPropertyOptional() @IsOptional() @IsString() district?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() detailAddress?: string;
  @ApiPropertyOptional() @IsOptional() qualificationFiles?: any;
  @ApiPropertyOptional() @IsOptional() @IsString() businessPlan?: string;
}

export class ApproveBranchDto {
  @ApiProperty() @IsNumber() result: number; // 1=pass, 2=reject
  @ApiPropertyOptional() @IsOptional() @IsString() opinion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rejectReason?: string;
}

export class QueryBranchApplicationDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() branchName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() status?: number;
}
