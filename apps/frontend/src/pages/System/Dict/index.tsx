import React, { useRef, useState, useEffect } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormDigit } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Card, Row, Col, List, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import * as dictApi from '@/services/dict';

const DictPage: React.FC = () => {
  const [types, setTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [dataList, setDataList] = useState<any[]>([]);
  const [typeModal, setTypeModal] = useState(false);
  const [dataModal, setDataModal] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [editingData, setEditingData] = useState<any>(null);

  const loadTypes = async () => { const res = await dictApi.getDictTypes(); setTypes(res.data || []); };
  const loadData = async (code: string) => { const res = await dictApi.getDictDataByType(code); setDataList(res.data || []); };
  useEffect(() => { loadTypes(); }, []);

  return (
    <PageContainer>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="字典类型" extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingType(null); setTypeModal(true); }}>新增</Button>}>
            <List dataSource={types} renderItem={(item: any) => (
              <List.Item
                style={{ cursor: 'pointer', background: selectedType?.id === item.id ? '#e6f7ff' : 'transparent', padding: '8px 12px' }}
                onClick={() => { setSelectedType(item); loadData(item.code); }}
                actions={[
                  <a key="edit" onClick={(e) => { e.stopPropagation(); setEditingType(item); setTypeModal(true); }}>编辑</a>,
                  <Popconfirm key="del" title="确认删除?" onConfirm={async (e) => { e?.stopPropagation(); await dictApi.deleteDictType(item.id); message.success('已删除'); loadTypes(); }}>
                    <a style={{ color: 'red' }} onClick={(e) => e.stopPropagation()}>删除</a>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta title={item.name} description={item.code} />
              </List.Item>
            )} />
          </Card>
        </Col>
        <Col span={16}>
          <Card title={'字典数据' + (selectedType ? ' - ' + selectedType.name : '')}
            extra={selectedType && <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingData(null); setDataModal(true); }}>新增</Button>}>
            {selectedType ? (
              <List dataSource={dataList} renderItem={(item: any) => (
                <List.Item actions={[
                  <a key="edit" onClick={() => { setEditingData(item); setDataModal(true); }}>编辑</a>,
                  <Popconfirm key="del" title="确认删除?" onConfirm={async () => { await dictApi.deleteDictData(item.id); message.success('已删除'); loadData(selectedType.code); }}>
                    <a style={{ color: 'red' }}>删除</a>
                  </Popconfirm>,
                ]}>
                  <List.Item.Meta title={<><Tag>{item.value}</Tag> {item.label}</>} description={'排序: ' + item.sortOrder} />
                </List.Item>
              )} />
            ) : <p>请先在左侧选择一个字典类型</p>}
          </Card>
        </Col>
      </Row>
      <ModalForm title={editingType ? '编辑字典类型' : '新增字典类型'} open={typeModal} onOpenChange={setTypeModal}
        initialValues={editingType || {}} modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          if (editingType) { await dictApi.updateDictType(editingType.id, values); } else { await dictApi.createDictType(values); }
          message.success('操作成功'); loadTypes(); return true;
        }}>
        <ProFormText name="code" label="类型编码" rules={[{ required: true }]} disabled={!!editingType} />
        <ProFormText name="name" label="类型名称" rules={[{ required: true }]} />
      </ModalForm>
      <ModalForm title={editingData ? '编辑字典数据' : '新增字典数据'} open={dataModal} onOpenChange={setDataModal}
        initialValues={editingData || { dictTypeId: selectedType?.id }} modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          if (editingData) { await dictApi.updateDictData(editingData.id, values); } else { await dictApi.createDictData({ ...values, dictTypeId: selectedType?.id }); }
          message.success('操作成功'); if (selectedType) loadData(selectedType.code); return true;
        }}>
        <ProFormText name="label" label="字典标签" rules={[{ required: true }]} />
        <ProFormText name="value" label="字典值" rules={[{ required: true }]} />
        <ProFormDigit name="sortOrder" label="排序号" min={0} />
      </ModalForm>
    </PageContainer>
  );
};

export default DictPage;
