import { useEffect, useRef, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons';
import { Drawer, FloatButton, Input, Select, message, Badge, Button, Space } from 'antd';
import styles from "./App.module.less";
import { useEventEmitter, useFocusWithin, useGetState, useInViewport, useRequest, useSize } from 'ahooks';
import 'react-contexify/ReactContexify.css';
import { Item, Menu, useContextMenu } from 'react-contexify';
import { DownloadEventPayload, QnFile } from './models/File';
import { QiNiuApi } from './apis';
import { DownloadOutlined } from '@ant-design/icons';
import DownloadPanel from './components/DownloadPanel';
import InfiniteScrollList from './components/InfiniteScrollList';
import { appWindow } from '@tauri-apps/api/window';
const MENU_ID = 'contextMenu';
const pages = [{ label: "10项", value: 10 }, { label: "20项", value: 20 }, { label: "50项", value: 50 }, { label: "100项", value: 100 }];
const defaultPageSize = 10;
function App() {
  const containerRef = useRef(null);
  const footerRef = useRef(null);
  const [downloadNifityCount, setDownloadNifityCount] = useState(0)
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
      const array = data;
      for (const item of searchResult) {
        if (array.find(i => i.key === item.key && i.hash === item.hash && i.size === item.size && i.mime_type === item.mime_type) === undefined) {
          array.push(item);
        }
      }
      console.log(array);
      setData([...array]);
    }
  }, [searchResult]);

  const [searchTxt, setSearchTxt] = useState("");

  useEffect(() => {
    search({ pageSize });
    appWindow.listeners
    const unlisten = appWindow.listen<DownloadEventPayload>('download-progress', (event) => {
      if (event.payload.progress === 1) {
        console.log(JSON.stringify(event.payload.data))
        console.log(getDownloadPanelVisibility());
        if (getDownloadPanelVisibility() === false) {
          setDownloadNifityCount((count) => count + 1);
        }
        const info = event.payload.data;
        setData((data) => {
          const index = data.findIndex(i => i.hash === info.hash && i.key === info.key && i.size === info.size && i.mime_type === info.mime_type);
          if (index !== -1) {
            data[index].downloaded = true;
          }
          else {
            console.log("下载完成，但是没有找到对应的文件", data, info);
          }
          return [...data];
        });
        // setData([...data]);
      }
    }).then((result) => {
      return result;
    }).catch((err) => {
      console.log("监听失败");
      return undefined;
    })
    return (() => {
      unlisten.then(result => {
        if (result !== undefined) {
          result();
          console.log("取消监听");

        }
      });
    })
  }, []);
  const [data, setData] = useState<QnFile[]>([]);

  const searchQueryChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value;
    if (txt !== searchTxt) {
      setData([]);
      setSearchTxt(e.target.value);
      search({ query: txt, pageSize });
    }
  };

  const showDrawer = () => {
    setDownloadNifityCount(0);
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };
  const loadMore = () => {
    let marker = data[data.length - 1].marker;
    search({ marker, query: searchTxt, pageSize });
  }
  const download = (item: QnFile) => {
    QiNiuApi.downloadFile(item);
  }
  const downloadPanelVisibilityEventEmitter$ = useEventEmitter<boolean>();
  downloadPanelVisibilityEventEmitter$.useSubscription(visibility => {
    console.log("downloadPanelVisibilityEventEmitter$", visibility);
    setdownloadPanelVisibility(visibility);
  });
  const [downloadPanelVisibility, setdownloadPanelVisibility, getDownloadPanelVisibility] = useGetState(false);
  return (
    <div className={styles.container} ref={containerRef} >

      <Input className={styles.searchInput} size="large" placeholder="输入搜索的文件名字" prefix={<SearchOutlined />} onChange={searchQueryChanged} />
      <div onContextMenu={handleContextMenu} >
        <InfiniteScrollList dataSource={data} newItems={searchResult}
          containerHeight={containerSize?.height} extractHeight={extractHeight}
          loadMore={loadMore} download={download} pageSize={pageSize} />
      </div>
      <div ref={footerRef} className={styles.footer}>
        <Space>
          <span >
            <Badge count={downloadNifityCount} size="small" >
              <Button icon={<DownloadOutlined />} type="primary" onClick={showDrawer} >
              </Button ></Badge>
          </span>
          <span >
            <Select defaultValue={defaultPageSize}
              style={{ width: 120 }} onChange={value => setPageSize(value)}
              options={pages}
            />
          </span>
          <span  >总共加载：{data.length}项</span>
        </Space>

      </div>

      <Menu id={MENU_ID}>
        <Item id="copy">预览</Item>
        <Item id="cut" >下载</Item>
      </Menu>



      <Drawer title="下载" placement="right" onClose={onClose} open={open} size="large">
        <DownloadPanel downloadPanelVisibilityEventEmitter={downloadPanelVisibilityEventEmitter$} />
      </Drawer>
    </div >
  )
}
export default App

