import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { PaginationDto } from '../dto/pagination.dto';

export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  dto: PaginationDto,
) {
  const { page, pageSize, sortBy, sortOrder } = dto;

  if (sortBy) {
    qb.orderBy(`entity.${sortBy}`, sortOrder || 'DESC');
  }

  const [items, total] = await qb
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getManyAndCount();

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
