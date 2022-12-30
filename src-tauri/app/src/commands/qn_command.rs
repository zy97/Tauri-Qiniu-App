use crate::{error::TauriError, models::qn_file::QnFile, DbConnection};
use chrono::Utc;
use entity::{download, prelude::Downloads};
use futures::{future::ok, stream::TryStreamExt};
use humansize::{format_size, DECIMAL};
use qiniu_sdk::{
    credential::Credential,
    download::{DownloadManager, StaticDomainsUrlsGenerator},
    objects::ObjectsManager,
};
use sea_orm::{
    prelude::{ChronoDateTime, ChronoDateTimeWithTimeZone, DateTimeLocal, TimeDate, Uuid},
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, Set,
};
use serde::Serialize;
use serde_json::json;
use tauri::{AppHandle, Manager, State, Window};
use tracing::{info, trace};
const ACCESS_KEY: &str = "mElDt3TjoRM7iL5qpeZ15U4R9RGy3SBEqNTinKar";
const SECRET_KEY: &str = "B5fcfvWOuQPZD0EKwVDvEfHk9FBcnRtgocxsMR1Q";
const BUCKET_NAME: &str = "sc-download";
const DOMAIN: &str = "download.yucunkeji.com";
use std::{
    path::{self},
    str::FromStr,
    vec,
};
#[tauri::command]
pub async fn get_lists(
    marker: Option<String>,
    query: Option<String>,
    page_size: Option<usize>,
    state: State<'_, DbConnection>,
) -> Result<Vec<QnFile>, TauriError> {
    let connection = state.db.lock().unwrap().clone();
    info!("marker:{marker:?}, query:{query:?}, page_size:{page_size:?}");
    info!("{}", Utc::now());
    let mut files = vec![];
    let credential = Credential::new(ACCESS_KEY, SECRET_KEY);
    let object_manager = ObjectsManager::new(credential);
    let bucket = object_manager.bucket(BUCKET_NAME);
    let mut iter = bucket
        .list()
        .prefix(query.unwrap_or("".to_owned()))
        .limit(page_size.unwrap_or(10))
        .marker(marker.unwrap_or("".to_owned()))
        .stream();
    while let Some(entry) = iter.try_next().await? {
        let key = entry.get_key_as_str().to_owned();
        let hash = entry.get_hash_as_str().to_owned();
        let size = format_size(entry.get_size_as_u64(), DECIMAL);
        let mime_type = entry.get_mime_type_as_str().to_owned();
        let marker = iter.marker().map(|s| s.to_string());
        let downloaded = Downloads::find()
            .filter(download::Column::Hash.eq(hash.clone()))
            .filter(download::Column::Key.eq(key.clone()))
            .filter(download::Column::MimeType.eq(mime_type.clone()))
            .filter(download::Column::Size.eq(size.clone()))
            .count(&connection)
            .await?
            > 0;

        files.push(QnFile {
            key,
            hash,
            size,
            mime_type,
            marker,
            downloaded,
        });
    }
    trace!("files:{:?}", files);
    Ok(files)
}

#[tauri::command]
pub async fn download(
    file_info: QnFile,
    app_handle: AppHandle,
    window: Window,
    state: State<'_, DbConnection>,
) -> Result<(), TauriError> {
    let app_dir = app_handle.path_resolver().app_cache_dir().unwrap();
    let connection = state.db.lock().unwrap().clone();

    let mut hash_file_name = String::new();
    let extension_name = file_info.key.rfind('.');

    match extension_name {
        Some(index) => {
            let base64 = base64::encode(&file_info.key[..index]);
            hash_file_name += &base64;
            hash_file_name += &file_info.key[index..];
        }
        None => {
            hash_file_name += &base64::encode(&file_info.key);
        }
    }
    let file_path = app_dir.join(hash_file_name);

    if Downloads::find()
        .filter(download::Column::Path.eq(file_path.display().to_string()))
        .count(&connection)
        .await?
        != 0
    {
        println!("缓存文件夹已存在: {}", file_path.display());
        return Ok(());
    }
    let download_manager = DownloadManager::new(
        StaticDomainsUrlsGenerator::builder(DOMAIN)
            .use_https(true) // 设置为 HTTP 协议
            .build(),
    );

    // 如果不用spawn执行异步下载那么会出现stackoverflow异常
    tokio::spawn(async move {
        let download = download::ActiveModel {
            id: Set(Uuid::new_v4()),
            key: Set(file_info.key.clone()),
            hash: Set(file_info.hash),
            size: Set(file_info.size),
            mime_type: Set(file_info.mime_type),
            path: Set(String::from(&file_path.display().to_string())),
            download_date: Set(Utc::now()),
        };
        let download = download.insert(&connection).await.unwrap();
        download_manager
            .async_download(&file_info.key)
            .await
            .unwrap()
            .on_download_progress(move |e| {
                let transferred_bytes = e.transferred_bytes() as f64;
                let total_bytes = e.total_bytes().unwrap_or(transferred_bytes as u64) as f64;
                window
                    .emit(
                        "download-progress",
                        Payload {
                            data: download.clone(),
                            progress: transferred_bytes / total_bytes,
                        },
                    )
                    .unwrap();
                println!("已下载：{}/{}", total_bytes, transferred_bytes);
                Ok(())
            })
            .async_to_path(&file_path)
            .await
            .unwrap();

        println!("下载完成: {}", file_path.display());
    });

    Ok(())
}

#[tauri::command]
pub async fn get_download_files(
    app_handle: AppHandle,
    state: State<'_, DbConnection>,
) -> Result<Vec<download::Model>, TauriError> {
    let db = state.db.lock().unwrap().clone();
    let downloads = Downloads::find().all(&db).await?;
    Ok(downloads)
}
#[derive(Clone, Serialize)]
struct Payload {
    data: download::Model,
    progress: f64,
}
