import { useEffect, useRef, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons';
import { Input, List, message } from 'antd';
import { invoke } from '@tauri-apps/api';
import VirtualList from 'rc-virtual-list';
import styles from "./App.module.less";
import { useRequest, useSize } from 'ahooks';
import 'react-contexify/ReactContexify.css';
import { Item, Menu, useContextMenu } from 'react-contexify';
import { QnFile } from './models/File';
import { QiNiuApi } from './apis';

const MENU_ID = 'contextMenu';
const extractHeight = 40 + 21;
function App() {
  const containerRef = useRef(null);
  const { show } = useContextMenu({
    id: MENU_ID,
  });
  const handleContextMenu = (event: any) => {
    show({
      event,
      props: {
        key: 'value'
      }
    })
  }
  const containerSize = useSize(containerRef);
  const { data: searchResult, run: search } = useRequest(QiNiuApi.getLists, {
    debounceWait: 50,
    manual: true,
  });
  useEffect(() => {
    if (searchResult) {
      setData(data.concat(searchResult));
    }
  }, [searchResult]);

  const [searchTxt, setSearchTxt] = useState("");
  useEffect(() => {
    QiNiuApi.getLists().then((res) => {
      console.log(res);
      setData(res);
    });
  }, []);
  const [data, setData] = useState<QnFile[]>([]);
  const onScroll = (e: React.UIEvent<HTMLElement, UIEvent>) => {
    if (e.currentTarget.scrollHeight - e.currentTarget.scrollTop === (containerSize?.height ?? 0) - extractHeight) {
      let marker = data[data.length - 1].marker;
      QiNiuApi.getLists({ marker, query: searchTxt }).then((res) => {
        setData(res);
        setData(data.concat(res));
        console.log(res);
        message.success(`${res.length} 个文件查询成功`);
      });
    }
  };
  const searchQueryChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value;
    if (txt !== searchTxt) {
      setData([]);
      setSearchTxt(e.target.value);
      search({ query: txt });
    }
  };


  return (
    <div className={styles.container} ref={containerRef} >

      <Input className={styles.searchInput} size="large" placeholder="输入搜索的文件名字" prefix={<SearchOutlined />} onChange={searchQueryChanged} />
      <div onContextMenu={handleContextMenu}>
        <List size='small'>
          <VirtualList
            data={data}
            height={(containerSize?.height ?? 100) - extractHeight}
            itemHeight={22}
            itemKey="key"
            onScroll={onScroll}
          >
            {(item: QnFile) => (
              <List.Item key={item.key}>
                <List.Item.Meta
                  avatar={<img src={`../src/assets/${FileType(item.mime_type)}.svg`} className={styles.avatar}></img>}
                  title={<a onClick={() => { QiNiuApi.downloadFile(item) }}>{item.key}</a>}
                  description={`${item.mime_type}--(${item.size})`}
                />
                <div></div>
              </List.Item>
            )}
          </VirtualList>

        </List></div>

      <p className={styles.footer}>总共加载：{data.length}项</p>
      <Menu id={MENU_ID}>
        <Item id="copy">预览</Item>
        <Item id="cut" >下载</Item>
      </Menu>
    </div >
  )
}
const FileType = (fileType: string) => {
  switch (fileType) {
    case "application/vnd.ms-excel":
      return "excel"
    case "application/x-msdownload":
      return "exe"
    case "image/gif":
      return "gif"
    case "image/gif":
      return "json"
    case "application/x-msi":
      return "msi"
    case "image/png":
    case "image/jpeg":
      return "photo"
    case "application/x-httpd-php":
      return "php"
    case "text/plain":
      return "txt"
    case "video/mp4":
      return "video"
    default:
      return "unknown"
  }
};
export default App

