import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  transform?: (value: any, row: any) => any;
}

@Injectable()
export class ExcelService {
  /**
   * 导出数据到Excel并直接写入Response流
   */
  async exportToResponse(
    res: Response,
    data: any[],
    columns: ExcelColumn[],
    sheetName = '数据',
    fileName = 'export',
  ) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IPOC管控系统';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetName);

    // 设置列
    sheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 18,
    }));

    // 表头样式
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1890FF' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // 填充数据
    for (const item of data) {
      const rowData: Record<string, any> = {};
      for (const col of columns) {
        const val = item[col.key];
        rowData[col.key] = col.transform ? col.transform(val, item) : val;
      }
      sheet.addRow(rowData);
    }

    // 数据行样式
    for (let i = 2; i <= data.length + 1; i++) {
      const row = sheet.getRow(i);
      row.alignment = { vertical: 'middle' };
      if (i % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' },
        };
      }
    }

    // 写入响应
    const encodedName = encodeURIComponent(`${fileName}.xlsx`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedName}`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * 从上传的Buffer解析Excel
   */
  async parseExcel(
    buffer: Buffer,
    columns: ExcelColumn[],
  ): Promise<Record<string, any>[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const sheet = workbook.worksheets[0];
    if (!sheet) return [];

    // 读取表头映射
    const headerRow = sheet.getRow(1);
    const headerMap = new Map<number, string>();
    headerRow.eachCell((cell, colNumber) => {
      const headerText = String(cell.value || '').trim();
      const col = columns.find((c) => c.header === headerText);
      if (col) headerMap.set(colNumber, col.key);
    });

    const results: Record<string, any>[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头
      const item: Record<string, any> = {};
      let hasValue = false;
      row.eachCell((cell, colNumber) => {
        const key = headerMap.get(colNumber);
        if (key) {
          let val = cell.value;
          if (val && typeof val === 'object' && 'result' in val) val = (val as any).result;
          if (val && typeof val === 'object' && 'text' in val) val = (val as any).text;
          item[key] = val;
          if (val !== null && val !== undefined && val !== '') hasValue = true;
        }
      });
      if (hasValue) results.push(item);
    });

    return results;
  }

  /**
   * 生成导入模板
   */
  async generateTemplate(
    res: Response,
    columns: ExcelColumn[],
    sheetName = '导入模板',
    fileName = 'import_template',
  ) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 18,
    }));

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD591' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    const encodedName = encodeURIComponent(`${fileName}.xlsx`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedName}`,
    );
    await workbook.xlsx.write(res);
    res.end();
  }
}
