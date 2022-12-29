import { emit } from "@tauri-apps/api/event";
import { Button, Divider, List, Skeleton } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { QnFile } from "../../models/File";
import { transformFileType } from "../../utils/utils";
import styles from "./index.module.less";
interface Props {
  dataSource: QnFile[];
  newItems: QnFile[] | undefined;
  containerHeight: number | undefined;
  extractHeight: number;
  pageSize: number;
  loadMore: () => void;
  download: (item: QnFile) => void;
}
function InfiniteScrollList(props: Props) {
  const { dataSource, newItems, containerHeight, extractHeight, loadMore, download, pageSize } = props
  
  return (
    <>
      <InfiniteScroll height={(containerHeight ?? 100) - extractHeight}
        dataLength={dataSource.length}
        next={loadMore}
        hasMore={newItems !== undefined ? newItems.length == pageSize : true}
        loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
        endMessage={<Divider plain>It is all, nothing more 🤐</Divider>}>
        <List
          dataSource={dataSource}
          renderItem={(item) => (
            <List.Item key={item.key}>
              <List.Item.Meta
                avatar={<img src={`../src/assets/${transformFileType(item.mime_type)}.svg`} className={styles.avatar}></img>}
                title={<a onClick={() => { download(item) }}>{item.key}</a>}
                description={`${item.mime_type}--(${item.size})`}
              />
              <div></div>
            </List.Item>
          )}
        />
      </InfiniteScroll>
    </>
  );
}

export default InfiniteScrollList;
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