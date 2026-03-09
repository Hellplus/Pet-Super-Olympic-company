import { IsString, IsNotEmpty, IsOptional, IsInt, IsUUID, IsBoolean, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ description: '权限名称' })
  @IsString() @IsNotEmpty() @Length(2, 100)
  name: string;

  @ApiProperty({ description: '权限标识' })
  @IsString() @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '类型：1=目录 2=菜单 3=按钮 4=数据权限' })
  @IsInt()
  type: number;

  @ApiPropertyOptional() @IsOptional() @IsString() path?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() component?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() redirect?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isVisible?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isCache?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUUID() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() apiPath?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() apiMethod?: string;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
