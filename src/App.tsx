import { useEffect, useState } from 'react'
import logo from './logo.svg'
import { Button, Card, List, message, Table } from 'antd';
import { invoke } from '@tauri-apps/api';
import VirtualList from 'rc-virtual-list';
import styles from "./App.module.less";
interface File {
  hash: string;
  key: string;
  mime_type: string;
  size: number;
  marker: string;
}
const fakeDataUrl =
  'https://randomuser.me/api/?results=20&inc=name,gender,email,nat,picture&noinfo';
const ContainerHeight = 600;
function App() {

  useEffect(() => {


    invoke<any>("test").then((res) => {
      console.log(res);

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
    let marker = data[data.length - 1].marker;
    invoke<any>("test", { marker }).then((res) => {
      setData(res);
      setData(data.concat(res));
      console.log(res);
      message.success(`${res.length} more items loaded!`);
    });

  };
  return (
    <div className={styles.container}>
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
                avatar={<img src='../src/assets/excel.svg' className={styles.avatar}></img>}
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
