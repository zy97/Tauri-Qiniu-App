use crate::{
    error::TauriError,
    models::{
        download_info::DownloadInfo,
        qn_file::QnFile,
        upload_info::{UploadInfo, UploadStatus},
    },
    repositories::{download_repository::*, upload_repository::*},
    DbConnection,
};
use chrono::Utc;
use entity::download;
use futures::stream::TryStreamExt;
use humansize::{format_size, DECIMAL};
use qiniu_sdk::{
    credential::Credential,
    download::{DownloadManager, StaticDomainsUrlsGenerator},
    objects::ObjectsManager,
    upload::*,
};
use tauri::{AppHandle, State, Window};
use tracing::{info, trace};
const ACCESS_KEY: &str = "mElDt3TjoRM7iL5qpeZ15U4R9RGy3SBEqNTinKar";
const SECRET_KEY: &str = "B5fcfvWOuQPZD0EKwVDvEfHk9FBcnRtgocxsMR1Q";
const BUCKET_NAME: &str = "sc-download";
const DOMAIN: &str = "download.yucunkeji.com";
const DOWNLOADEVENT: &str = "download-progress";
const UPLOADEVENT: &str = "upload-progress";
use std::{
    fs::{self},
    path::{Path, PathBuf},
    time::Duration,
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
        let downloaded = download_exist(&key, &hash, &mime_type, &size, &connection).await?;

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
    file: QnFile,
    app_handle: AppHandle,
    window: Window,
    state: State<'_, DbConnection>,
) -> Result<(), TauriError> {
    let app_dir = app_handle.path_resolver().app_cache_dir().unwrap();
    let connection = state.db.lock().unwrap().clone();

    let mut hash_file_name = String::new();
    let extension_name = file.key.rfind('.');

    match extension_name {
        Some(index) => {
            let base64 = base64::encode(&file.key[..index]);
            hash_file_name += &base64;
            hash_file_name += &file.key[index..];
        }
        None => {
            hash_file_name += &base64::encode(&file.key);
        }
    }
    let file_path = app_dir.join(hash_file_name);

    if download_find_by_path(file_path.display().to_string().as_str(), &connection)
        .await?
        .is_some()
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
        let download = download_insert(
            &file.key,
            &file.hash,
            &file.mime_type,
            &file.size,
            &file_path.display().to_string().to_owned(),
            &connection,
        )
        .await?;
        download_manager
            .async_download(&file.key)
            .await?
            .on_download_progress(move |e| {
                let transferred_bytes = e.transferred_bytes() as f64;
                let total_bytes = e.total_bytes().unwrap_or(transferred_bytes as u64) as f64;
                window.emit(
                    DOWNLOADEVENT,
                    DownloadInfo {
                        data: download.clone(),
                        progress: transferred_bytes / total_bytes,
                    },
                )?;
                trace!("已下载：{}/{}", total_bytes, transferred_bytes);
                Ok(())
            })
            .async_to_path(&file_path)
            .await?;
        trace!("下载完成: {}", file_path.display());
        Ok::<(), TauriError>(())
    });
    Ok(())
}

#[tauri::command]
pub async fn get_download_files(
    state: State<'_, DbConnection>,
) -> Result<Vec<download::Model>, TauriError> {
    let db = state.db.lock().unwrap().clone();
    Ok(download_get_all(&db).await?)
}
#[tauri::command]
pub async fn delete_download_file(
    data: download::Model,
    state: State<'_, DbConnection>,
) -> Result<(), TauriError> {
    let db = state.db.lock().unwrap().clone();
    download_delete_by_id(data.id, &db).await?;
    if Path::new(&data.path).exists() {
        fs::remove_file(data.path)?;
    }
    Ok(())
}
#[tauri::command]
pub async fn upload_file(
    file_path: PathBuf,
    window: Window,
    state: State<'_, DbConnection>,
) -> Result<UploadStatus, TauriError> {
    info!("upload_file:{}", file_path.display());
    let connection = state.db.lock().unwrap().clone();
    if file_path.is_dir() {
        return Ok(UploadStatus::DirNotSupport);
    }
    if upload_find_by_path(file_path.display().to_string().as_str(), &connection)
        .await?
        .is_some()
    {
        return Ok(UploadStatus::Uploaded);
    }
    let insert_result = upload_insert(&file_path.display().to_string(), &connection).await?;
    let update_model = insert_result.clone();
    tokio::spawn(async move {
        let credential = Credential::new(ACCESS_KEY, SECRET_KEY);
        let upload_manager = UploadManager::builder(UploadTokenSigner::new_credential_provider(
            credential,
            BUCKET_NAME,
            Duration::from_secs(3600),
        ))
        .build();
        let mut uploader: AutoUploader = upload_manager.auto_uploader();

        let params = AutoUploaderObjectParams::builder()
            .object_name(file_path.file_name().unwrap().to_str().unwrap())
            .file_name(file_path.file_name().unwrap().to_str().unwrap())
            .build();
        let result = uploader
            .on_upload_progress(move |e| {
                let transferred_bytes = e.transferred_bytes() as f64;
                let total_bytes = e.total_bytes().unwrap_or(transferred_bytes as u64) as f64;
                window.emit(
                    UPLOADEVENT,
                    UploadInfo {
                        data: insert_result.clone(),
                        progress: transferred_bytes / total_bytes,
                    },
                )?;
                trace!("已上传：{}/{}", total_bytes, transferred_bytes);
                Ok(())
            })
            .async_upload_path(file_path, params)
            .await?;
        let key = result["key"].as_str();
        let hask = result["hash"].as_str();
        match key {
            Some(key) => {
                let hash = hask.unwrap();
                upload_update_hash_key(update_model, key, hash, &connection).await?;
            }
            None => {}
        }

        trace!("upload result: {:?}", result);
        Ok::<(), TauriError>(())
    });

    Ok(UploadStatus::Uploading)
}

#[tauri::command]
pub async fn delete_file(
    key: &str,
    state: tauri::State<'_, DbConnection>,
) -> Result<(), TauriError> {
    let connection = state.db.lock().unwrap().clone();
    let credential = Credential::new(ACCESS_KEY, SECRET_KEY);
    let object_manager = ObjectsManager::new(credential);
    let bucket = object_manager.bucket(BUCKET_NAME);
    upload_delete_by_key(key, &connection).await?;
    bucket.delete_object(key).async_call().await?;
    Ok(())
}
