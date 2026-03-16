import React from 'react';
import { Button, Result } from 'antd';
import { history } from '@umijs/max';

const Forbidden: React.FC = () => (
  <Result
    status="403"
    title="403"
    subTitle="抱歉，您没有权限访问此页面"
    extra={
      <Button type="primary" onClick={() => history.push('/dashboard')}>
        返回工作台
      </Button>
    }
  />
);

export default Forbidden;
