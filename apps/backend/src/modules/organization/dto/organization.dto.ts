import { IsString, IsNotEmpty, IsOptional, IsInt, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateOrgDto {
  @ApiProperty({ description: '组织名称' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({ description: '组织编码' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  code: string;

  @ApiProperty({ description: '组织类型' })
  @IsInt()
  orgType: number;

  @ApiPropertyOptional({ description: '父组织ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: '排序号' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '详细地址' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '负责人' })
  @IsOptional()
  @IsString()
  leader?: string;

  @ApiPropertyOptional({ description: '行政区划代码' })
  @IsOptional()
  @IsString()
  areaCode?: string;
}

export class UpdateOrgDto extends PartialType(CreateOrgDto) {}

export class MoveOrgDto {
  @ApiProperty({ description: '目标节点ID' })
  @IsUUID()
  nodeId: string;

  @ApiProperty({ description: '新父节点ID' })
  @IsUUID()
  newParentId: string;
}
