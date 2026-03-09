import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateProtectedCategoryDto {
  @ApiProperty() @IsString() @IsNotEmpty() categoryName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brandName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() protectionScope?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contractNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expireDate?: string;
}

export class CreateSponsorClientDto {
  @ApiProperty() @IsUUID() orgId: string;
  @ApiProperty() @IsString() @IsNotEmpty() companyName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactPerson?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() intendedAmount?: number;
}

export class CreateSponsorContractDto {
  @ApiProperty() @IsUUID() orgId: string;
  @ApiProperty() @IsUUID() clientId: string;
  @ApiProperty() @IsString() sponsorLevel: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty() @IsDateString() endDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rightsDesc?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contractFileUrl?: string;
}

export class QueryContractDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() orgId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() status?: number;
}
