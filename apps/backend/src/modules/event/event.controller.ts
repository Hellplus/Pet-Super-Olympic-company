import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto, QueryEventDto, CreateSopTemplateDto, CreateAnnouncementDto } from './dto/event.dto';
import { CurrentUser } from '../../common/decorators';

@ApiTags('赛事管理')
@ApiBearerAuth()
@Controller('events')
export class EventController {
  constructor(private readonly service: EventService) {}

  @Post()
  @ApiOperation({ summary: '创建赛事' })
  create(@Body() dto: CreateEventDto, @CurrentUser('id') userId: string) {
    return this.service.createEvent(dto, userId);
  }

  @Get()
  findAll(@Query() query: QueryEventDto) { return this.service.findAllEvents(query); }

  @Get(':id')
  findById(@Param('id') id: string) { return this.service.findEventById(id); }

  @Post(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: number }) {
    return this.service.updateEventStatus(id, body.status);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: '获取赛事SOP进度(红绿灯)' })
  getProgress(@Param('id') id: string) { return this.service.getEventProgress(id); }

  // --- SOP模板 ---
  @Post('sop-templates')
  @ApiOperation({ summary: '创建SOP模板' })
  createTemplate(@Body() dto: CreateSopTemplateDto) { return this.service.createSopTemplate(dto); }

  @Get('sop-templates')
  findAllTemplates() { return this.service.findAllSopTemplates(); }

  @Get('sop-templates/:id')
  findTemplateById(@Param('id') id: string) { return this.service.findSopTemplateById(id); }

  // --- 任务 ---
  @Post('tasks/:taskId/status')
  updateTaskStatus(@Param('taskId') taskId: string, @Body() body: { status: number; feedback?: string }) {
    return this.service.updateTaskStatus(taskId, body.status, body.feedback);
  }

  // --- 公告 ---
  @Post('announcements')
  @ApiOperation({ summary: '创建公告' })
  createAnnouncement(@Body() dto: CreateAnnouncementDto, @CurrentUser('id') userId: string, @CurrentUser('realName') userName: string) {
    return this.service.createAnnouncement(dto, userId, userName);
  }

  @Get('announcements')
  findAllAnnouncements() { return this.service.findAllAnnouncements(); }

  @Post('announcements/:id/publish')
  @ApiOperation({ summary: '发布公告' })
  publishAnnouncement(@Param('id') id: string) { return this.service.publishAnnouncement(id); }

  @Post('announcements/:id/read')
  @ApiOperation({ summary: '标记已读' })
  markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('realName') userName: string) {
    return this.service.markAsRead(id, userId, userName);
  }

  @Get('announcements/:id/read-status')
  getReadStatus(@Param('id') id: string) { return this.service.getReadStatus(id); }

  // --- 数字资产 ---
  @Post('digital-assets')
  @ApiOperation({ summary: '上传IP数字资产' })
  uploadAsset(@Body() data: any) { return this.service.uploadAsset(data); }

  @Get('digital-assets')
  findAllAssets() { return this.service.findAllAssets(); }

  @Post('announcements/:id/mark-read')
  @ApiOperation({ summary: '标记公告已读(增强)' })
  async markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.markAnnouncementRead(id, user.id);
  }

  @Get('announcements/:id/read-stats')
  @ApiOperation({ summary: '获取公告已读/未读统计' })
  async getReadStats(@Param('id') id: string) {
    return this.service.getAnnouncementReadStats(id);
  }

  @Post('announcements/:id/remind')
  @ApiOperation({ summary: '一键催读未读人员' })
  async remind(@Param('id') id: string) {
    return this.service.remindUnread(id);
  }

  // --- 未读公告(登录弹窗) ---
  @Get('my-unread-announcements')
  @ApiOperation({ summary: '获取我的未读公告(登录弹窗用)' })
  async getMyUnread(@CurrentUser('id') userId: string) {
    return this.service.getMyUnreadAnnouncements(userId);
  }

  // --- SOP进度矩阵 ---
  @Get('sop-progress-matrix')
  @ApiOperation({ summary: '全国赛事SOP红黄绿灯进度矩阵' })
  async getSopMatrix() {
    return this.service.getSopProgressMatrix();
  }
}
