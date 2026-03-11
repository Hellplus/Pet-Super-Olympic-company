import { IsUUID, IsNumber, IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EvidencePhotoDto {
  @ApiProperty({ description: '照片文件ID或URL' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: '拍摄时间(ISO)' })
  @IsOptional() @IsString()
  capturedAt?: string;

  @ApiPropertyOptional({ description: '经度' })
  @IsOptional() @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: '纬度' })
  @IsOptional() @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: '赛事名称(水印)' })
  @IsOptional() @IsString()
  eventName?: string;

  @ApiPropertyOptional({ description: '设备信息' })
  @IsOptional() @IsString()
  deviceInfo?: string;
}

export class SubmitEvidenceDto {
  @ApiProperty({ description: '交付任务ID' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: '完成数量' })
  @IsNumber()
  completedQuantity: number;

  @ApiProperty({ description: '证据照片列表', type: [EvidencePhotoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidencePhotoDto)
  photos: EvidencePhotoDto[];
}

export class GenerateReportDto {
  @ApiProperty({ description: '合同ID' })
  @IsUUID()
  contractId: string;
}
