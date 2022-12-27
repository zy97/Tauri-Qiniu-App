use crate::{
    error::TauriError,
    models::qn_file::{LocalFile, QnFile},
    DbConnection,
};
use entity::{downloads, prelude::Downloads};
use humansize::{format_size, DECIMAL};
use qiniu_sdk::{
    credential::Credential,
    download::{DownloadManager, StaticDomainsUrlsGenerator},
    objects::ObjectsManager,
};
use sea_orm::EntityTrait;
use tauri::{AppHandle, State};
const ACCESS_KEY: &str = "mElDt3TjoRM7iL5qpeZ15U4R9RGy3SBEqNTinKar";
const SECRET_KEY: &str = "B5fcfvWOuQPZD0EKwVDvEfHk9FBcnRtgocxsMR1Q";
const BUCKET_NAME: &str = "sc-download";
const DOMAIN: &str = "download.yucunkeji.com";
use std::{
    path::{self},
    vec,
};
#[tauri::command]
pub fn get_lists(
    marker: Option<String>,
    query: Option<String>,
    page_size: Option<usize>,
) -> Result<Vec<QnFile>, TauriError> {
    println!("marker:{marker:?}, query:{query:?}, page_size:{page_size:?}");

    let mut files = vec![];
    let credential = Credential::new(ACCESS_KEY, SECRET_KEY);
    let object_manager = ObjectsManager::new(credential);
    let bucket = object_manager.bucket(BUCKET_NAME);
    let mut iter = bucket
        .list()
        .prefix(query.unwrap_or("".to_owned()))
        .limit(page_size.unwrap_or(10))
        .marker(marker.unwrap_or("".to_owned()))
        .iter();

    while let Some(entry) = iter.next() {
        let entry = entry?;
        files.push(QnFile {
            key: entry.get_key_as_str().into(),
            hash: entry.get_hash_as_str().into(),
            size: format_size(entry.get_size_as_u64(), DECIMAL),
            mime_type: entry.get_mime_type_as_str().into(),
            marker: iter.marker().map(|s| s.to_string()),
        });
    }
    Ok(files)
}

#[tauri::command]
pub async fn download(file_info: QnFile, app_handle: AppHandle) -> Result<String, TauriError> {
    let app_dir = app_handle.path_resolver().app_cache_dir().unwrap();
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
    if file_path.exists() {
        println!("缓存文件夹已存在: {}", file_path.display());
        return Ok(file_path.display().to_string());
    }

    let download_manager = DownloadManager::new(
        StaticDomainsUrlsGenerator::builder(DOMAIN)
            .use_https(true) // 设置为 HTTP 协议
            .build(),
    );
    download_manager
        .download(file_info.key)?
        .on_download_progress(|e| {
            println!(
                "已下载：{}/{}",
                e.transferred_bytes(),
                e.total_bytes().unwrap_or_default()
            );
            Ok(())
        })
        .to_path(&file_path)
        .unwrap();
    println!("下载完成: {}", file_path.display());
    Ok(file_path.display().to_string())
}

#[tauri::command]
pub fn get_download_files(app_handle: AppHandle) -> Result<Vec<LocalFile>, TauriError> {
    let app_dir = app_handle.path_resolver().app_cache_dir().unwrap();
    let mut local_files = vec![];
    for entry in path::Path::new(&app_dir).read_dir()? {
        let entry = entry?;
        let path = entry.path();
        if path.is_file() {
            let mut key = String::new();
            let file_name = path.file_name().unwrap().to_str().unwrap();
            let extension_name = file_name.rfind('.');

            let mime = mime_guess::from_path(&path)
                .first_or_octet_stream()
                .to_string();
            match extension_name {
                Some(index) => local_files.push(LocalFile {
                    name: format!(
                        "{}{}",
                        base64::decode(&file_name[..index])
                            .unwrap()
                            .into_iter()
                            .map(|c| c as char)
                            .collect::<String>(),
                        &file_name[index..]
                    ),
                    path,
                    mime,
                }),
                None => {
                    local_files.push(LocalFile {
                        name: base64::decode(file_name)
                            .unwrap()
                            .into_iter()
                            .map(|c| c as char)
                            .collect::<String>(),
                        path,
                        mime,
                    });
                }
            }
        }
    }

    Ok(local_files)
}

// remember to call `.manage(MyState::default())`
#[tauri::command]
pub async fn get_test(state: State<'_, DbConnection>) -> Result<(), String> {
    let db = state.db.lock().unwrap().clone();
    let cheese: Option<downloads::Model> = Downloads::find_by_id("1".to_owned())
        .one(&db)
        .await
        .unwrap();
    println!("test: {:?}", cheese);
    Ok(())
}
