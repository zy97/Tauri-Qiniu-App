import { useEffect, useState } from 'react'
import logo from './logo.svg'
import init, { greet } from '@mywasm/foo'
import { Button, Card, List, message, Table } from 'antd';
import { invoke } from '@tauri-apps/api';
import VirtualList from 'rc-virtual-list';
interface File {
  hash: string;
  key: string;
  mime_type: string;
  size: number;
}
const fakeDataUrl =
  'https://randomuser.me/api/?results=20&inc=name,gender,email,nat,picture&noinfo';
const ContainerHeight = 600;
function App() {
  useEffect(() => {
    //初始化，加载 wasm 文件
    init();
    //调用 greet 方法，必须保证 init 方法执行完成之后，才可以调用，否则会报错
    // greet();
    invoke<any>("test").then((res) => {
      setData(res);

    });
  }, []);
  const [data, setData] = useState<File[]>([]);
  const onScroll = (e: React.UIEvent<HTMLElement, UIEvent>) => {
    if (e.currentTarget.scrollHeight - e.currentTarget.scrollTop === ContainerHeight) {
      appendData();
    }
  };
  const appendData = () => {
    invoke<any>("test").then((res) => {
      setData(res);
      setData(data.concat(res));
      message.success(`${res.length} more items loaded!`);
    });

  };
  return (
    <div className='mx-auto h-screen'>
      {/* <List
        dataSource={data}
        renderItem={item => (
          <List.Item>
            <Card hoverable className='mx-1.5'
              style={{ width: 30 }} cover={<img src='../src/assets/excel.svg'></img>}>
              <div title={item.key} className='overflow-hidden overflow-ellipsis whitespace-nowrap'>{item.key}</div>
              <div >{item.size}</div>
            </Card>
          </List.Item>
        )}
      /> */}
      <List>
        <VirtualList
          data={data}
          height={ContainerHeight}
          itemHeight={47}
          itemKey="key"
          onScroll={onScroll}
        >
          {(item: File) => (
            <List.Item key={item.key}>
              <List.Item.Meta
                avatar={<img src='../src/assets/excel.svg' className='h-8'></img>}
                title={<a href="https://ant.design">{item.key}</a>}
                description={item.mime_type}
              />
              <div>Content</div>
            </List.Item>
          )}
        </VirtualList>
      </List>
    </div >
  )
}

export default App
