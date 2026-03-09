import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DictType } from './entities/dict-type.entity';
import { DictData } from './entities/dict-data.entity';

@Injectable()
export class DictService {
  constructor(
    @InjectRepository(DictType) private readonly dictTypeRepo: Repository<DictType>,
    @InjectRepository(DictData) private readonly dictDataRepo: Repository<DictData>,
  ) {}

  async findAllTypes() { return this.dictTypeRepo.find({ order: { code: 'ASC' } }); }

  async createType(data: Partial<DictType>, userId: string) {
    const existing = await this.dictTypeRepo.findOne({ where: { code: data.code } });
    if (existing) throw new BadRequestException('字典类型编码已存在');
    return this.dictTypeRepo.save(this.dictTypeRepo.create({ ...data, createdBy: userId }));
  }

  async updateType(id: string, data: Partial<DictType>, userId: string) {
    const entity = await this.dictTypeRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('字典类型不存在');
    Object.assign(entity, data, { updatedBy: userId });
    return this.dictTypeRepo.save(entity);
  }

  async removeType(id: string) {
    const entity = await this.dictTypeRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('字典类型不存在');
    return this.dictTypeRepo.softRemove(entity);
  }

  async findDataByTypeCode(typeCode: string) {
    const type = await this.dictTypeRepo.findOne({ where: { code: typeCode } });
    if (!type) throw new NotFoundException('字典类型不存在');
    return this.dictDataRepo.find({ where: { dictTypeId: type.id, status: 1 }, order: { sortOrder: 'ASC' } });
  }

  async createData(data: Partial<DictData>, userId: string) {
    return this.dictDataRepo.save(this.dictDataRepo.create({ ...data, createdBy: userId }));
  }

  async updateData(id: string, data: Partial<DictData>, userId: string) {
    const entity = await this.dictDataRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('字典数据不存在');
    Object.assign(entity, data, { updatedBy: userId });
    return this.dictDataRepo.save(entity);
  }

  async removeData(id: string) {
    const entity = await this.dictDataRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('字典数据不存在');
    return this.dictDataRepo.softRemove(entity);
  }
}
