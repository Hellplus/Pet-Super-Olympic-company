import React, { useState } from 'react';
import { Form, Input, Button, Upload, Card, Result, Typography, Space, message, Steps } from 'antd';
import { UploadOutlined, BankOutlined, UserOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';

const { Title, Paragraph } = Typography;

const BranchApplyPage: React.FC = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await request('/api/v1/public/branch-apply', { method: 'POST', data: values });
      setResult(res?.data || res);
      message.success('申请已提交！');
    } catch (e: any) {
      message.error(e?.message || '提交失败');
    }
    setSubmitting(false);
  };

  if (result) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 16px' }}>
        <Result
          status="success"
          title="入驻申请已提交！"
          subTitle={`申请编号: ${result.id || '-'}，请等待总部审核。`}
          extra={[
            <Button key="new" onClick={() => { setResult(null); form.resetFields(); }}>再次申请</Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>🏆 国际宠物奥林匹克超级赛</Title>
          <Title level={4} style={{ color: '#1890ff' }}>地方分会入驻申请</Title>
          <Paragraph type="secondary">请填写以下信息，总部将在3个工作日内完成审核。</Paragraph>
        </div>

        <Steps current={0} size="small" style={{ marginBottom: 24 }} items={[
          { title: '填写申请' }, { title: '初审' }, { title: '复审' }, { title: '终审通过' },
        ]} />

        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="branchName" label="分会名称" rules={[{ required: true, message: '请输入分会名称' }]}>
            <Input prefix={<BankOutlined />} placeholder="如：北京分会" />
          </Form.Item>
          <Form.Item name="city" label="所在城市" rules={[{ required: true, message: '请输入城市' }]}>
            <Input prefix={<EnvironmentOutlined />} placeholder="如：北京市" />
          </Form.Item>
          <Form.Item name="applicantName" label="负责人姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input prefix={<UserOutlined />} placeholder="筹备组负责人全名" />
          </Form.Item>
          <Form.Item name="applicantPhone" label="联系电话" rules={[{ required: true, message: '请输入电话' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="手机号码" />
          </Form.Item>
          <Form.Item name="applicantEmail" label="电子邮箱">
            <Input placeholder="选填" />
          </Form.Item>
          <Form.Item name="qualificationDesc" label="资质说明" rules={[{ required: true, message: '请描述资质' }]}>
            <Input.TextArea rows={4} placeholder="请简要说明团队资质、办赛经验、当地资源等" />
          </Form.Item>
          <Form.Item name="qualificationFileUrl" label="资质文件URL">
            <Input placeholder="如有资质文件请上传后填入URL" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block size="large">
              提交入驻申请
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <div style={{ textAlign: 'center', marginTop: 16, color: '#999', fontSize: 12 }}>
        国际宠物奥林匹克超级赛组委会 © {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default BranchApplyPage;
