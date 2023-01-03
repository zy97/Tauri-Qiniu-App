import { useInViewport, useMap, useRequest, useUpdate } from 'ahooks';
import styles from './index.module.less';
import { QiNiuApi } from '../../apis';
import { useEffect, useRef, useState } from 'react';
import { Button, List, notification, Progress, Space } from 'antd';
import { open } from '@tauri-apps/api/shell';
import { Download, DownloadEventPayload, QnFile } from '../../models/File';
import { transformFileType } from '../../utils/utils';
import { appWindow } from '@tauri-apps/api/window';
import dayjs from 'dayjs';
import { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { DeleteOutlined } from '@ant-design/icons';

interface Props {
    downloadPanelVisibilityEventEmitter: EventEmitter<boolean>
}
function DownloadPanel(props: Props) {
    const { downloadPanelVisibilityEventEmitter } = props;
    const ref = useRef(null);
    const [list, setList] = useState<Download[]>();
    const update = useUpdate();
    const [map, { set, get }] = useMap<string, number>();
    const [inViewport] = useInViewport(ref);
    useEffect(() => {
        downloadPanelVisibilityEventEmitter.emit(true);
        const unlisten = appWindow.listen<DownloadEventPayload>('download-progress', (event) => {
            const key = JSON.stringify(event.payload.data);
            const value = Math.round(event.payload.progress * 100);
            set(key, value);
        }).then((result) => {
            console.log("监听成功");
        }).catch((err) => {
            console.log("监听失败");
        })

        return (() => {
            unlisten.then(() => {
                console.log("取消监听");
            });
            downloadPanelVisibilityEventEmitter.emit(false);
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
        const progress = map.get(JSON.stringify(file));
        if (progress !== undefined && progress !== 100) {
            notification.error({
                message: '文件未下载完成'
            });
            return;
        }
        open(file.path);
    }
    const deleteDownloadFile = (item: Download) => {
        QiNiuApi.deleteDownloadFile(item).then(() => {
            notification.success({
                message: '删除成功'
            });
            search();
        }).catch(() => {
            notification.error({
                message: '删除失败'
            });
        });
    };
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
                                <span className={styles['gray-txt']}>{dayjs(item.download_date).format('L LTS')}</span>

                            </Space>}
                        />
                        <div>
                            {(map.get(JSON.stringify(item)) ?? 100) === 100 && <Button type="link" icon={<DeleteOutlined />} onClick={() => { deleteDownloadFile(item) }}></Button>}
                        </div>
                    </List.Item>
                )
                }
            />
        </div >
    );
}

export default DownloadPanel;