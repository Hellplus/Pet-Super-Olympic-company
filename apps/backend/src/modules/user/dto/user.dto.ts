import { IsString, IsNotEmpty, IsOptional, IsInt, IsUUID, IsArray, Length, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateUserDto {
  @ApiProperty({ description: '登录账号' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  username: string;

  @ApiPropertyOptional({ description: '密码（默认123456）' })
  @IsOptional()
  @IsString()
  @Length(6, 50)
  password?: string;

  @ApiProperty({ description: '真实姓名' })
  @IsString()
  @IsNotEmpty()
  realName: string;

  @ApiPropertyOptional({ description: '工号' })
  @IsOptional()
  @IsString()
  employeeNo?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '性别' })
  @IsOptional()
  @IsInt()
  gender?: number;

  @ApiPropertyOptional({ description: '职位' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({ description: '所属组织ID' })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional({ description: '角色ID列表' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class QueryUserDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  realName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  status?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

export class AssignRolesDto {
  @ApiProperty({ description: '角色ID列表' })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];
}
