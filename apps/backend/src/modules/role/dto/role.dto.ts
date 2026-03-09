import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateRoleDto {
  @ApiProperty({ description: '角色编码' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  code: string;

  @ApiProperty({ description: '角色名称' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiPropertyOptional({ description: '数据范围' })
  @IsOptional()
  @IsInt()
  dataScope?: number;

  @ApiPropertyOptional({ description: '排序号' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class AssignPermissionsDto {
  @ApiProperty({ description: '权限ID列表' })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

export class QueryRoleDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  status?: number;
}
