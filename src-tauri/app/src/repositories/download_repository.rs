use crate::error::TauriError;
use chrono::Utc;
use entity::{
    download::{self, Model},
    prelude::Downloads,
};
use sea_orm::{
    prelude::Uuid, ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter,
    QueryOrder, Set,
};

pub async fn download_exist(
    key: &str,
    hash: &str,
    mime_type: &str,
    size: &str,
    connection: &DatabaseConnection,
) -> Result<bool, TauriError> {
    let downloaded = Downloads::find()
        .filter(download::Column::Hash.eq(hash))
        .filter(download::Column::Key.eq(key))
        .filter(download::Column::MimeType.eq(mime_type))
        .filter(download::Column::Size.eq(size))
        .one(connection)
        .await?
        .is_some();
    Ok(downloaded)
}
pub async fn download_find_by_path(
    path: &str,
    connection: &DatabaseConnection,
) -> Result<Option<Model>, TauriError> {
    let downloaded = Downloads::find()
        .filter(download::Column::Path.eq(path))
        .one(connection)
        .await?;
    Ok(downloaded)
}
pub async fn download_insert(
    key: &str,
    hash: &str,
    mime_type: &str,
    size: &str,
    path: &str,
    connection: &DatabaseConnection,
) -> Result<Model, TauriError> {
    let download = download::ActiveModel {
        id: Set(Uuid::new_v4()),
        key: Set(key.to_owned()),
        hash: Set(hash.to_owned()),
        size: Set(size.to_owned()),
        mime_type: Set(mime_type.to_owned()),
        path: Set(path.to_owned()),
        download_date: Set(Utc::now()),
    };
    let download = download.insert(connection).await.unwrap();
    Ok(download)
}
pub async fn download_get_all(connection: &DatabaseConnection) -> Result<Vec<Model>, TauriError> {
    let downloads = Downloads::find()
        .order_by_desc(download::Column::DownloadDate)
        .all(connection)
        .await?;
    Ok(downloads)
}
pub async fn download_delete_by_id(
    id: Uuid,
    connection: &DatabaseConnection,
) -> Result<(), TauriError> {
    Downloads::delete_by_id(id).exec(connection).await?;
    Ok(())
}
