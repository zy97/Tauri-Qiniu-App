import { useEffect, useRef, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons';
import { Avatar, Button, Divider, Drawer, FloatButton, Input, List, Pagination, Select, Skeleton, message } from 'antd';
import { invoke } from '@tauri-apps/api';
import VirtualList from 'rc-virtual-list';
import styles from "./App.module.less";
import { useRequest, useSize } from 'ahooks';
import 'react-contexify/ReactContexify.css';
import { Item, Menu, useContextMenu } from 'react-contexify';
import { QnFile } from './models/File';
import { QiNiuApi } from './apis';
import { DownloadOutlined } from '@ant-design/icons';
import DownloadPanel from './components/DownloadPanel';
import { transformFileType } from './utils/utils';
import InfiniteScroll from 'react-infinite-scroll-component';
const MENU_ID = 'contextMenu';
const pages = [{ label: "10项", value: 10 }, { label: "20项", value: 20 }, { label: "50项", value: 50 }, { label: "100项", value: 100 }];
const defaultPageSize = 10;
function App() {
  const containerRef = useRef(null);
  const footerRef = useRef(null);
  const footerSize = useSize(footerRef);
  const extractHeight = 40 + (footerSize?.height ?? 0);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [open, setOpen] = useState(false);
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
  const { data: searchResult, run: search, loading } = useRequest(QiNiuApi.getLists, {
    debounceWait: 50,
    manual: true,
    onSuccess: (res) => { message.success(`${res.length} 个文件查询成功`); }
  });
  useEffect(() => {
    if (searchResult) {
      setData(data.concat(searchResult));
    }
  }, [searchResult]);

  const [searchTxt, setSearchTxt] = useState("");
  useEffect(() => {
    search({ pageSize });
  }, []);
  const [data, setData] = useState<QnFile[]>([]);
  const onScroll = (e: React.UIEvent<HTMLElement, UIEvent>) => {
    if (e.currentTarget.scrollHeight - e.currentTarget.scrollTop === (containerSize?.height ?? 0) - extractHeight) {
      let marker = data[data.length - 1].marker;
      search({ marker, query: searchTxt, pageSize });
    }
  };
  const searchQueryChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value;
    if (txt !== searchTxt) {
      setData([]);
      setSearchTxt(e.target.value);
      search({ query: txt, pageSize });
    }
  };

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };
  return (
    <div className={styles.container} ref={containerRef} >

      <Input className={styles.searchInput} size="large" placeholder="输入搜索的文件名字" prefix={<SearchOutlined />} onChange={searchQueryChanged} />
      <div onContextMenu={handleContextMenu} >
        {/* <List size='small' loading={loading}>
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
                  avatar={<img src={`../src/assets/${transformFileType(item.mime_type)}.svg`} className={styles.avatar}></img>}
                  title={<a onClick={() => { QiNiuApi.downloadFile(item) }}>{item.key}</a>}
                  description={`${item.mime_type}--(${item.size})`}
                />
                <div></div>
              </List.Item>
            )}
          </VirtualList>
        </List> */}
        <InfiniteScroll height={(containerSize?.height ?? 100) - extractHeight}
          dataLength={data.length}
          next={() => { let marker = data[data.length - 1].marker; search({ marker, query: searchTxt, pageSize }); }}
          hasMore={searchResult !== undefined ? searchResult.length > 0 : true}
          loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
          endMessage={<Divider plain>It is all, nothing more 🤐</Divider>}>
          <List
            dataSource={data}
            renderItem={(item) => (
              <List.Item key={item.key}>
                <List.Item.Meta
                  avatar={<img src={`../src/assets/${transformFileType(item.mime_type)}.svg`} className={styles.avatar}></img>}
                  title={<a onClick={() => { QiNiuApi.downloadFile(item) }}>{item.key}</a>}
                  description={`${item.mime_type}--(${item.size})`}
                />
                <div><Button onClick={() => invoke("get_test")}>test</Button></div>
              </List.Item>
            )}
          />
        </InfiniteScroll>
      </div>
      <div ref={footerRef} className={styles.footer}>
        <span className={styles.page}>
          <Select defaultValue={defaultPageSize}
            style={{ width: 120 }} onChange={value => setPageSize(value)}
            options={pages}
          />
        </span>
        <span  >总共加载：{data.length}项</span>
      </div>

      <Menu id={MENU_ID}>
        <Item id="copy">预览</Item>
        <Item id="cut" >下载</Item>
      </Menu>
      <FloatButton icon={<DownloadOutlined />} type="primary" onClick={showDrawer} />
      <Drawer title="下载" placement="right" onClose={onClose} open={open} size="large">
        <DownloadPanel />
      </Drawer>
    </div >
  )
}
export default App

