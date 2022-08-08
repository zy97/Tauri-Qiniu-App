import { useEffect, useState } from 'react'
import logo from './logo.svg'
import init, { greet } from '@mywasm/foo'
import { Button, Table } from 'antd';
import { invoke } from '@tauri-apps/api';
function App() {
  useEffect(() => { 
    //初始化，加载 wasm 文件
    init();
  }, []);
  const dataSource = [
    {
      key: '1',
      name: '胡彦斌',
      age: 32,
      address: '西湖区湖底公园1号',
    },
    {
      key: '2',
      name: '胡彦祖',
      age: 42,
      address: '西湖区湖底公园1号',
    },
  ];

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: '住址',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'key',
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: 'hash',
      dataIndex: 'hash',
      key: 'hash',
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: '类型',
      dataIndex: 'mimeType',
      key: 'mimeType',
    },
  ];
  const onClick = async () => {
    try {
      console.log('click');
      //调用 greet 方法，必须保证 init 方法执行完成之后，才可以调用，否则会报错
      greet();
      let res = await invoke("test");
      console.log('success', res);
    }
    catch (e) {
      console.log('error');
    }

  }
  return (
    <div className='mx-auto h-screen'>
      <Button onClick={onClick}>test</Button>
      <Table dataSource={dataSource} columns={columns} />;
    </div>
  )
}

export default App
