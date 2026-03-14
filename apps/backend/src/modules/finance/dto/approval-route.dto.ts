import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApprovalConfigDto {
  @ApiProperty({ description: '业务类型: EXPENSE/BUDGET/CONTRACT' })
  @IsString()
  bizType: string;

  @ApiProperty({ description: '最低金额(>=)' })
  @IsNumber()
  minAmount: number;

  @ApiPropertyOptional({ description: '最高金额(<), 不填表示无上限' })
  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @ApiProperty({ description: '审批层级: LOCAL=地方终审, HQ=总部加签' })
  @IsString()
  approvalLevel: string;

  @ApiPropertyOptional({ description: '审批角色ID' })
  @IsOptional()
  @IsUUID()
  approverRoleId?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;
}
