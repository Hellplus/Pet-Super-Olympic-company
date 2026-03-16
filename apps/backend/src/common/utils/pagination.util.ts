import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { PaginationDto } from '../dto/pagination.dto';

export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  dto: PaginationDto,
) {
  const page = dto.current || dto.page;
  const { pageSize, sortBy, sortOrder } = dto;

  if (sortBy) {
    qb.orderBy(`entity.${sortBy}`, sortOrder || 'DESC');
  }

  const total = await qb.getCount();
  const items = await qb
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getMany();

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
