import { useEffect, useRef, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons';
import { Drawer, Input, Select, message, Badge, Button, Space } from 'antd';
import styles from "./App.module.less";
import { useAsyncEffect, useEventEmitter, useGetState, useRequest, useSize } from 'ahooks';
import 'react-contexify/ReactContexify.css';
import { DownloadEventPayload, QnFile, UploadEventPayload, UploadStatus } from './models/File';
import { QiNiuApi } from './apis';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import DownloadPanel from './components/DownloadPanel';
import InfiniteScrollList from './components/InfiniteScrollList';
import { appWindow } from '@tauri-apps/api/window';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { dialog, event } from "@tauri-apps/api";

function App() {
  //#region 上传相关
  useAsyncEffect(async function* () {
    toast("Wow so easy!", { closeOnClick: false, closeButton: false, autoClose: false, });
    const unlistenDropFile = await event.listen<string[]>(event.TauriEvent.WINDOW_FILE_DROP, async e => {
      processUpload(await QiNiuApi.uploadFile(e.payload[0]))
    });
    const unlistenUploadProgress = await appWindow.listen<UploadEventPayload>('upload-progress', (event) => {
      if (event.payload.progress === 1) {
        // const info = event.payload.data;
        // setData((data) => {
        //   const index = data.findIndex(i => i.hash === info.hash && i.key === info.key && i.size === info.size && i.mime_type === info.mime_type);
        //   if (index !== -1) {
        //     data[index].downloaded = true;
        //   }
        //   else {
        //     console.log("下载完成，但是没有找到对应的文件", data, info);
        //   }
        //   return [...data];
        // });
      }
    });
    yield;
    unlistenDropFile();
    unlistenUploadProgress();
  }, [])
  const showFilePickerWindow = async () => {
    const selectFile = await dialog.open({});
    if (selectFile !== null && !Array.isArray(selectFile)) {
      processUpload(await QiNiuApi.uploadFile(selectFile));
    }
  }
  const processUpload = (status: UploadStatus) => {
    switch (status) {
      case UploadStatus.DirNotSupport:
        message.error("不支持上传文件夹");
        break;
      case UploadStatus.Uploaded:
        message.error("文件已经上传");
        break;
      default:
        break;
    }
  }
  //#endregion

  //#region 下载相关
  const pages = [{ label: "10项", value: 10 }, { label: "20项", value: 20 }, { label: "50项", value: 50 }, { label: "100项", value: 100 }];
  const defaultPageSize = 10;
  const [open, setOpen] = useState(false);
  const [downloadNifityCount, setDownloadNifityCount] = useState(0)
  const [downloadPanelVisibility, setdownloadPanelVisibility, getDownloadPanelVisibility] = useGetState(false);
  const downloadPanelVisibilityEventEmitter$ = useEventEmitter<boolean>();
  downloadPanelVisibilityEventEmitter$.useSubscription(visibility => {
    setdownloadPanelVisibility(visibility);
  });
  const showDrawer = () => {
    setDownloadNifityCount(0);
    setOpen(true);
  };
  const onCloseDrawer = () => {
    setOpen(false);
  };
  const download = (item: QnFile) => {
    QiNiuApi.downloadFile(item);
  }
  useAsyncEffect(async function* () {
    const unlisten = await appWindow.listen<DownloadEventPayload>('download-progress', (event) => {
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
      }
    });
    yield;
    unlisten();
  }, [])
  //#endregion

  //#region 获取文件列表相关
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [searchTxt, setSearchTxt] = useState("");
  const [data, setData] = useState<QnFile[]>([]);
  const searchQueryChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value;
    if (txt !== searchTxt) {
      setData([]);
      setSearchTxt(e.target.value);
      search({ query: txt, pageSize });
    }
  };
  const { data: searchResult, runAsync: search } = useRequest(QiNiuApi.getLists, {
    debounceWait: 50,
    manual: true,
    onSuccess: (res) => { message.success(`${res.length} 个文件查询成功`); }
  });
  const loadMore = () => {
    let marker = data[data.length - 1].marker;
    search({ marker, query: searchTxt, pageSize });
  }
  useEffect(() => {
    if (searchResult) {
      const array = data;
      for (const item of searchResult) {
        if (array.find(i => i.key === item.key && i.hash === item.hash && i.size === item.size && i.mime_type === item.mime_type) === undefined) {
          array.push(item);
        }
      }
      setData([...array]);
    }
  }, [searchResult]);
  useEffect(() => {
    search({ pageSize });
  }, []);

  //#endregion
  const containerRef = useRef(null);
  const footerRef = useRef(null);
  const footerSize = useSize(footerRef);
  const extractHeight = 40 + (footerSize?.height ?? 0);
  const containerSize = useSize(containerRef);
  return (
    <div className={styles.container} ref={containerRef} >
      <Input className={styles.searchInput} size="large" placeholder="输入搜索的文件名字" prefix={<SearchOutlined />} onChange={searchQueryChanged} />
      <div>
        <InfiniteScrollList dataSource={data} newItems={searchResult}
          containerHeight={containerSize?.height} extractHeight={extractHeight}
          loadMore={loadMore} download={download} pageSize={pageSize} />
      </div>
      <div ref={footerRef} className={styles.footer}>
        <Space>
          <span>
            <Button icon={<UploadOutlined />} type="primary" onClick={showFilePickerWindow} >
            </Button >
          </span>
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
      <Drawer title="下载" placement="right" onClose={onCloseDrawer} open={open} size="large">
        <DownloadPanel downloadPanelVisibilityEventEmitter={downloadPanelVisibilityEventEmitter$} />
      </Drawer>
      <ToastContainer />
    </div >
  )
}
export default App

