import { useInViewport, useMap, useRequest, useUpdate } from 'ahooks';
import styles from './index.module.less';
import { QiNiuApi } from '../../apis';
import { useEffect, useRef, useState } from 'react';
import { List, notification, Progress, Space } from 'antd';
import { open } from '@tauri-apps/api/shell';
import { Download, DownloadEventPayload } from '../../models/File';
import { transformFileType } from '../../utils/utils';
import { appWindow } from '@tauri-apps/api/window';
function DownloadPanel() {
    const ref = useRef(null);
    const [list, setList] = useState<Download[]>();
    const update = useUpdate();
    const [map, { set, get }] = useMap<string, number>();
    const [inViewport] = useInViewport(ref);
    useEffect(() => {
        const unlisten = appWindow.listen<DownloadEventPayload>('download-progress', (event) => {
            const key = JSON.stringify(event.payload.data);
            const value = Math.round(event.payload.progress * 100);
            // if (downloads[key] !== undefined) {
            //     setdownloads(i => { i[key] = value; return i });
            // }
            // else {
            //     downloads[key] = value;
            //     setdownloads({ ...downloads });
            // }
            // console.log(`时间名称：${event.event}，负载：${JSON.stringify(event.payload)}`)
            set(key, value);
            // update();
        }).then((result) => {
            console.log("监听成功");
        }).catch((err) => {
            console.log("监听失败");
        })

        return (() => {
            unlisten.then(() => {
                console.log("取消监听");
            });
        })
    }, [])
    const { data: searchResult, run: search } = useRequest(QiNiuApi.getdownloadLists, {
        debounceWait: 50,
        manual: true,
    });
    useEffect(() => {
        if (inViewport === true) {
            search();
        }

    }, [inViewport])
    useEffect(() => {
        setList(searchResult);
        console.log(searchResult);
    }, [searchResult])

    const openFile = (file: Download) => {
        if (map.get(JSON.stringify(file)) !== 100) {
            notification.error({
                message: '文件未下载完成'
            });
            return;
        }
        open(file.path);
    }
    return (
        <div ref={ref} className={styles['download-panel']}>
            <List
                dataSource={list}
                renderItem={(item) => (
                    <List.Item key={item.key}>
                        <List.Item.Meta
                            avatar={<img src={`../src/assets/${transformFileType(item.mime_type)}.svg`} className={styles.avatar}></img>}
                            description={<Progress percent={map.get(JSON.stringify(item)) ?? 100} />}
                            title={<Space>
                                <a onClick={() => { openFile(item) }}>{item.key}</a>
                                <span className={styles['gray-txt']}>{item.size}</span>
                            </Space>}
                        />
                        <div></div>
                    </List.Item>
                )}
            />
        </div>
    );
}

export default DownloadPanel;