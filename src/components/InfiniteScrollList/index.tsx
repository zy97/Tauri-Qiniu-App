import { Divider, List, message, Skeleton, Tag } from "antd";
import { Item, ItemParams, ItemProps, Menu, useContextMenu } from "react-contexify";
import InfiniteScroll from "react-infinite-scroll-component";
import { QiNiuApi } from "../../apis";
import { QnFile } from "../../models/File";
import { transformFileType } from "../../utils/utils";
import styles from "./index.module.less";
const MENU_ID = 'contextMenu';
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
  const { show } = useContextMenu({
    id: MENU_ID,
  });
  const handleContextMenu = (event: any, file: QnFile) => {
    show({
      event,
      props: { file },
    })
  }
  const handleItemClick = async ({ id, event, props, data, triggerEvent }: ItemParams<ItemProps, any>) => {

    try {
      switch (id) {
        case "delete":
          const key = (props["file"] as QnFile).key;
          await QiNiuApi.deleteFile(key);
          message.success("删除成功");
          break;
        default:
          console.log(id, event, props, data, triggerEvent,);
      }
    } catch (error) {
      message.error("删除失败");
    }
  }
  return (
    <div >
      <InfiniteScroll height={(containerHeight ?? 100) - extractHeight}
        dataLength={dataSource.length}
        next={loadMore}
        hasMore={newItems !== undefined ? (newItems.length != 0 ? newItems[newItems.length - 1].marker.length != 0 : false) : true}
        loader={< Skeleton avatar paragraph={{ rows: 1 }} active />}
        endMessage={< Divider plain > 这就是全部了，没有更多了 🤐</Divider >}>
        <List
          dataSource={dataSource}
          renderItem={(item) => (
            <List.Item key={item.key} onContextMenu={e => handleContextMenu(e, item)}>
              <List.Item.Meta
                avatar={<img src={`../src/assets/${transformFileType(item.mime_type)}.svg`} className={styles.avatar}></img>}
                title={<a onClick={() => { download(item) }}>{item.key}</a>}
                description={<div>${item.mime_type}  (${item.size})  {item.downloaded && <Tag color="green">已下载</Tag>}  </div>}
              />

              <div></div>

            </List.Item>
          )}
        />
        <Menu id={MENU_ID}>
          <Item id="delete" onClick={handleItemClick}>删除</Item>
        </Menu>
      </InfiniteScroll>

    </div>
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