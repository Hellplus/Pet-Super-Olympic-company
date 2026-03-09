import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateRevenueDto {
  @ApiProperty() @IsUUID() orgId: string;
  @ApiProperty() @IsString() @IsNotEmpty() payerName: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty() @IsDateString() revenueDate: string;
  @ApiProperty() @IsString() revenueType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() voucherUrl?: string;
}

export class QueryRevenueDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() orgId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() revenueType?: string;
  @ApiPropertyOptional() @IsOptional() startDate?: string;
  @ApiPropertyOptional() @IsOptional() endDate?: string;
}

export class CreateEventBudgetDto {
  @ApiProperty() @IsUUID() orgId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() eventId?: string;
  @ApiProperty() @IsString() eventName: string;
  @ApiProperty() @IsNumber() totalBudget: number;
  @ApiProperty() items: { subjectName: string; budgetAmount: number }[];
}

export class CreateExpenseDto {
  @ApiProperty() @IsUUID() orgId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() budgetId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() budgetSubject?: string;
  @ApiProperty() @IsString() expenseType: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() attachments?: any;
}

export class QueryExpenseDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() orgId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() status?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() expenseType?: string;
}

export class ConfirmPaymentDto {
  @ApiProperty() @IsString() @IsNotEmpty() paymentVoucherUrl: string;
}
