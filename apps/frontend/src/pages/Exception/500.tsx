import React from 'react';
import { Button, Result } from 'antd';
import { history } from '@umijs/max';

const ServerError: React.FC = () => (
  <Result
    status="500"
    title="500"
    subTitle="抱歉，服务器出现了错误"
    extra={
      <Button type="primary" onClick={() => history.push('/dashboard')}>
        返回工作台
      </Button>
    }
  />
);

export default ServerError;
