import { Injectable } from '@nestjs/common';
import { SponsorshipService } from './sponsorship.service';

@Injectable()
export class ReportService {
  constructor(private readonly sponsorshipService: SponsorshipService) {}

  /**
   * 生成赞助执行结案报告HTML (可用于PDF转换)
   * PRD: "赛后一键汇总带水印图文及合同执行数据,自动排版生成精美PDF"
   */
  async generateReportHtml(contractId: string): Promise<string> {
    const data = await this.sponsorshipService.generateReportData(contractId);

    const taskRows = data.tasks.map((t, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${t.taskName}</td>
        <td>${t.taskType}</td>
        <td>${t.quantity}</td>
        <td>${t.completedQuantity}</td>
        <td>${t.status === 2 ? '✅ 已完成' : t.status === 1 ? '⏳ 进行中' : '⏸ 待执行'}</td>
        <td>${t.evidenceCount} 张</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>赞助执行结案报告 - ${data.contract.contractNo}</title>
  <style>
    body { font-family: 'Microsoft YaHei', sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #1890ff; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #1890ff; font-size: 24px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; }
    .info-item { padding: 8px; background: #f5f5f5; border-radius: 4px; }
    .info-item label { font-weight: bold; color: #666; }
    .summary { display: flex; gap: 20px; margin-bottom: 30px; }
    .summary-card { flex: 1; text-align: center; padding: 20px; background: #e6f7ff; border-radius: 8px; }
    .summary-card .number { font-size: 32px; font-weight: bold; color: #1890ff; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
    th { background: #1890ff; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 60px; color: rgba(0,0,0,0.03); pointer-events: none; white-space: nowrap; }
  </style>
</head>
<body>
  <div class="watermark">IPOC 内部文件</div>
  <div class="header">
    <h1>🏆 赞助执行结案报告</h1>
    <p>国际宠物奥林匹克超级赛组委会</p>
  </div>

  <h2>📋 合同基本信息</h2>
  <div class="info-grid">
    <div class="info-item"><label>合同编号：</label>${data.contract.contractNo}</div>
    <div class="info-item"><label>赞助商：</label>${data.contract.clientName}</div>
    <div class="info-item"><label>承办分会：</label>${data.contract.orgName}</div>
    <div class="info-item"><label>合同金额：</label>¥${Number(data.contract.amount).toLocaleString()}</div>
    <div class="info-item"><label>有效期：</label>${data.contract.startDate} ~ ${data.contract.endDate}</div>
    <div class="info-item"><label>报告日期：</label>${new Date().toISOString().slice(0, 10)}</div>
  </div>

  <h2>📊 执行概览</h2>
  <div class="summary">
    <div class="summary-card"><div class="number">${data.summary.totalTasks}</div><div>总任务数</div></div>
    <div class="summary-card"><div class="number">${data.summary.completedTasks}</div><div>已完成</div></div>
    <div class="summary-card"><div class="number">${data.summary.completionRate}%</div><div>完成率</div></div>
    <div class="summary-card"><div class="number">${data.summary.totalPhotos}</div><div>证据照片</div></div>
  </div>

  <h2>📝 权益交付明细</h2>
  <table>
    <thead><tr><th>#</th><th>权益名称</th><th>类型</th><th>约定数量</th><th>完成数量</th><th>状态</th><th>证据</th></tr></thead>
    <tbody>${taskRows || '<tr><td colspan="7">暂无任务</td></tr>'}</tbody>
  </table>

  <div class="footer">
    <p>本报告由 IPOC 管控系统自动生成 | 生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    <p>国际宠物奥林匹克超级赛组委会 © ${new Date().getFullYear()}</p>
  </div>
</body>
</html>`;
  }
}
