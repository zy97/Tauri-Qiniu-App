import { useDocumentVisibility, useInViewport, useRequest } from 'ahooks';
import styles from './index.module.less';
import { QiNiuApi } from '../../apis';
import { useEffect, useRef, useState } from 'react';
import { List } from 'antd';
import { open } from '@tauri-apps/api/shell';
import { Download } from '../../models/File';
import { transformFileType } from '../../utils/utils';
function DownloadPanel() {
    const ref = useRef(null);
    const [list, setList] = useState<Download[]>()
    const [inViewport] = useInViewport(ref);
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
        open(file.path);
        console.log(file);
    }
    return (
        <div ref={ref} className={styles['download-panel']}>
            {/* <List
                dataSource={list}
                renderItem={(item) =>
                    <List.Item> <a onClick={() => openFile(item)}>{item.name}</a> </List.Item>}
            /> */}
            <List
                dataSource={list}
                renderItem={(item) => (
                    <List.Item key={item.key}>
                        <List.Item.Meta
                            avatar={<img src={`../src/assets/${transformFileType(item.mime_type)}.svg`} className={styles.avatar}></img>}
                            title={<a onClick={() => { openFile(item) }}>{item.key}</a>}
                        />
                        <div></div>
                    </List.Item>
                )}
            />
        </div>
    );
}

export default DownloadPanel;