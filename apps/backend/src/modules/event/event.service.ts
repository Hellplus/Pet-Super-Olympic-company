import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { SopTemplate } from './entities/sop-template.entity';
import { SopTemplateTask } from './entities/sop-template-task.entity';
import { EventTask } from './entities/event-task.entity';
import { Announcement } from './entities/announcement.entity';
import { User } from '../user/entities/user.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';
import { DigitalAsset } from './entities/digital-asset.entity';
import { CreateEventDto, QueryEventDto, CreateSopTemplateDto, CreateAnnouncementDto } from './dto/event.dto';
import { paginate } from '../../common/utils/pagination.util';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(SopTemplate) private readonly sopRepo: Repository<SopTemplate>,
    @InjectRepository(SopTemplateTask) private readonly sopTaskRepo: Repository<SopTemplateTask>,
    @InjectRepository(EventTask) private readonly eventTaskRepo: Repository<EventTask>,
    @InjectRepository(Announcement) private readonly annRepo: Repository<Announcement>,
    @InjectRepository(AnnouncementRead) private readonly readRepo: Repository<AnnouncementRead>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(DigitalAsset) private readonly assetRepo: Repository<DigitalAsset>,
  ) {}

  // ====== 赛事 CRUD ======
  async createEvent(dto: CreateEventDto, userId: string) {
    const code = 'EVT' + Date.now().toString(36).toUpperCase();
    const event = await this.eventRepo.save(this.eventRepo.create({ ...dto, eventCode: code, createdBy: userId }));
    // 如果指定了SOP模板,自动派发任务
    if (dto.sopTemplateId) {
      await this.dispatchSopTasks(event.id, dto.sopTemplateId, new Date(dto.eventDate));
    }
    return event;
  }

  async findAllEvents(query: QueryEventDto) {
    const qb = this.eventRepo.createQueryBuilder('entity').leftJoinAndSelect('entity.organization', 'org');
    if (query.orgId) qb.andWhere('entity.org_id = :o', { o: query.orgId });
    if (query.status !== undefined) qb.andWhere('entity.status = :s', { s: query.status });
    if (query.eventName) qb.andWhere('entity.event_name LIKE :n', { n: `%${query.eventName}%` });
    qb.orderBy('entity.event_date', 'DESC');
    return paginate(qb, query);
  }

  async findEventById(id: string) {
    const event = await this.eventRepo.findOne({ where: { id }, relations: ['organization'] });
    if (!event) throw new NotFoundException('赛事不存在');
    const tasks = await this.eventTaskRepo.find({ where: { eventId: id }, order: { sortOrder: 'ASC' } });
    return { ...event, tasks };
  }

  async updateEventStatus(id: string, status: number) {
    await this.eventRepo.update(id, { status });
  }

  // ====== SOP 模板 ======
  async createSopTemplate(dto: CreateSopTemplateDto) {
    const template = await this.sopRepo.save(this.sopRepo.create({
      templateName: dto.templateName, eventType: dto.eventType, description: dto.description,
    }));
    if (dto.tasks?.length) {
      const tasks = dto.tasks.map((t, i) => this.sopTaskRepo.create({
        templateId: template.id, taskName: t.taskName, daysBeforeEvent: t.daysBeforeEvent,
        defaultRole: t.defaultRole, description: t.description, isRequired: t.isRequired ?? true, sortOrder: i,
      }));
      await this.sopTaskRepo.save(tasks);
    }
    return template;
  }

  async findAllSopTemplates() {
    return this.sopRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findSopTemplateById(id: string) {
    const t = await this.sopRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('模板不存在');
    const tasks = await this.sopTaskRepo.find({ where: { templateId: id }, order: { sortOrder: 'ASC' } });
    return { ...t, tasks };
  }

  async updateSopTemplate(id: string, data: { name?: string; description?: string }) {
    const t = await this.sopRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('模板不存在');
    if (data.name) t.templateName = data.name;
    if (data.description !== undefined) t.description = data.description;
    return this.sopRepo.save(t);
  }

  async deleteSopTemplate(id: string) {
    const t = await this.sopRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('模板不存在');
    // 检查是否有赛事引用了此模板
    const eventCount = await this.eventRepo.count({ where: { sopTemplateId: id } as any });
    if (eventCount > 0) {
      throw new BadRequestException(`该模板已被 ${eventCount} 场赛事引用，无法删除`);
    }
    // 先删任务，再删模板
    await this.sopTaskRepo.delete({ templateId: id });
    await this.sopRepo.remove(t);
    return { success: true };
  }

  async addTemplateTask(templateId: string, data: { taskName: string; daysBeforeEvent: number; assigneeRole?: string; description?: string; sortOrder?: number }) {
    const t = await this.sopRepo.findOne({ where: { id: templateId } });
    if (!t) throw new NotFoundException('模板不存在');
    const maxOrder = await this.sopTaskRepo.createQueryBuilder('t')
      .where('t.template_id = :tid', { tid: templateId })
      .select('MAX(t.sort_order)', 'maxSort')
      .getRawOne();
    const task = this.sopTaskRepo.create({
      templateId,
      taskName: data.taskName,
      daysBeforeEvent: data.daysBeforeEvent,
      defaultRole: data.assigneeRole || null,
      description: data.description || null,
      sortOrder: data.sortOrder ?? ((maxOrder?.maxSort || 0) + 1),
      isRequired: true,
    } as any);
    return this.sopTaskRepo.save(task);
  }

  async updateTemplateTask(templateId: string, taskId: string, data: any) {
    const task = await this.sopTaskRepo.findOne({ where: { id: taskId, templateId } });
    if (!task) throw new NotFoundException('任务不存在');
    if (data.taskName) task.taskName = data.taskName;
    if (data.daysBeforeEvent !== undefined) task.daysBeforeEvent = data.daysBeforeEvent;
    if (data.assigneeRole !== undefined) task.defaultRole = data.assigneeRole;
    if (data.description !== undefined) task.description = data.description;
    if (data.sortOrder !== undefined) task.sortOrder = data.sortOrder;
    return this.sopTaskRepo.save(task);
  }

  async deleteTemplateTask(templateId: string, taskId: string) {
    const task = await this.sopTaskRepo.findOne({ where: { id: taskId, templateId } });
    if (!task) throw new NotFoundException('任务不存在');
    await this.sopTaskRepo.remove(task);
    return { success: true };
  }

  async reorderTemplateTasks(templateId: string, taskIds: string[]) {
    for (let i = 0; i < taskIds.length; i++) {
      await this.sopTaskRepo.update({ id: taskIds[i], templateId }, { sortOrder: i + 1 });
    }
    return { success: true };
  }

  /** 根据SOP模板+开赛日期自动派发任务 */
  private async dispatchSopTasks(eventId: string, templateId: string, eventDate: Date) {
    const templateTasks = await this.sopTaskRepo.find({ where: { templateId }, order: { sortOrder: 'ASC' } });
    const eventTasks = templateTasks.map((tt, i) => {
      const deadline = new Date(eventDate);
      deadline.setDate(deadline.getDate() - tt.daysBeforeEvent);
      return this.eventTaskRepo.create({
        eventId, taskName: tt.taskName, deadline, sortOrder: i,
      });
    });
    await this.eventTaskRepo.save(eventTasks);
  }

  // ====== 赛事任务 ======
  async updateTaskStatus(taskId: string, status: number, feedback?: string) {
    const update: any = { status };
    if (status === 2) update.completedAt = new Date();
    if (feedback) update.feedback = feedback;
    await this.eventTaskRepo.update(taskId, update);
  }

  async getEventProgress(eventId: string) {
    const tasks = await this.eventTaskRepo.find({ where: { eventId } });
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 2).length;
    const overdue = tasks.filter(t => t.status !== 2 && t.status !== 9 && new Date(t.deadline) < new Date()).length;
    return { total, completed, overdue, progress: total > 0 ? Math.round(completed / total * 100) : 0 };
  }

  // ====== 公告 ======
  async createAnnouncement(dto: CreateAnnouncementDto, userId: string, userName: string) {
    return this.annRepo.save(this.annRepo.create({
      ...dto, publisherId: userId, publisherName: userName,
    }));
  }

  async publishAnnouncement(id: string) {
    await this.annRepo.update(id, { status: 1, publishedAt: new Date() });
  }

  async findAllAnnouncements() {
    return this.annRepo.find({ order: { publishedAt: 'DESC' } });
  }

  async markAsRead(announcementId: string, userId: string, userName: string) {
    const existing = await this.readRepo.findOne({ where: { announcementId, userId } });
    if (!existing) {
      await this.readRepo.save(this.readRepo.create({ announcementId, userId, userName, readAt: new Date() }));
      await this.annRepo.createQueryBuilder().update(Announcement)
        .set({ readCount: () => 'read_count + 1' })
        .where('id = :id', { id: announcementId }).execute();
    }
  }

  async getReadStatus(announcementId: string) {
    return this.readRepo.find({ where: { announcementId }, order: { readAt: 'ASC' } });
  }

  // ====== 数字资产 ======
  async uploadAsset(data: Partial<DigitalAsset>) {
    // 旧版作废
    if (data.assetName) {
      await this.assetRepo.update({ assetName: data.assetName, isLatest: true }, { isLatest: false, status: 0 });
    }
    return this.assetRepo.save(this.assetRepo.create({ ...data, isLatest: true, status: 1 }));
  }

  async findAllAssets() {
    return this.assetRepo.find({ where: { isLatest: true, status: 1 }, order: { createdAt: 'DESC' } });
  }

  /** 标记公告已读 */
  async markAnnouncementRead(announcementId: string, userId: string) {
    const existing = await this.readRepo.findOne({
      where: { announcementId, userId },
    });
    if (existing) return existing;
    return this.readRepo.save(this.readRepo.create({ announcementId, userId }));
  }

  /** 获取已读/未读统计 */
  async getAnnouncementReadStats(announcementId: string) {
    const readUsers = await this.readRepo.find({ where: { announcementId } });
    const readUserIds = readUsers.map(r => r.userId);
    const allUsers = await this.userRepo.find({
      where: { status: 1 },
      select: ['id', 'username', 'realName', 'organizationId'],
    });
    const readList = allUsers.filter(u => readUserIds.includes(u.id));
    const unreadList = allUsers.filter(u => !readUserIds.includes(u.id));
    return {
      totalUsers: allUsers.length,
      readCount: readList.length,
      unreadCount: unreadList.length,
      readList,
      unreadList,
    };
  }

  /** 催读未读人员（记录催读事件，实际推送由前端/消息服务处理） */
  async remindUnread(announcementId: string) {
    const stats = await this.getAnnouncementReadStats(announcementId);
    return {
      success: true,
      remindedCount: stats.unreadCount,
      remindedUsers: stats.unreadList.map(u => ({
        id: u.id,
        name: u.realName,
        username: u.username,
      })),
      message: `已向 ${stats.unreadCount} 名未读人员发送催读通知`,
    };
  }

  /** PRD: "全员App端强弹窗提醒" - 获取当前用户的未读公告(用于登录后弹窗) */
  async getMyUnreadAnnouncements(userId: string) {
    const published = await this.annRepo.find({
      where: { status: 1 },
      order: { publishedAt: 'DESC' },
    });
    const readRecords = await this.readRepo.find({ where: { userId } });
    const readIds = new Set(readRecords.map(r => r.announcementId));
    const unread = published.filter(a => !readIds.has(a.id));
    return {
      unreadCount: unread.length,
      announcements: unread.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        announcementType: a.announcementType,
        publishedAt: a.publishedAt,
        publisherName: a.publisherName,
      })),
    };
  }

  /** 获取全国赛事SOP进度总览(红黄绿灯矩阵) */
  async getSopProgressMatrix() {
    const events = await this.eventRepo.find({
      where: { status: 0 }, // 筹备中的赛事
      relations: ['organization'],
      order: { eventDate: 'ASC' },
    });
    const matrix = [];
    for (const evt of events) {
      const progress = await this.getEventProgress(evt.id);
      let light: 'green' | 'yellow' | 'red' = 'green';
      if (progress.overdue > 0) light = 'red';
      else if (progress.progress < 50) light = 'yellow';
      matrix.push({
        eventId: evt.id,
        eventName: evt.eventName,
        eventDate: evt.eventDate,
        orgName: evt.organization?.name,
        ...progress,
        light,
      });
    }
    return matrix;
  }
}
