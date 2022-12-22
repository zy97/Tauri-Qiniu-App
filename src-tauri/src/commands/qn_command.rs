use crate::{error::TauriError, models::qn_file::QnFile};
use humansize::{format_size, DECIMAL};
use qiniu_sdk::{
    credential::Credential,
    download::{DownloadManager, StaticDomainsUrlsGenerator},
    objects::ObjectsManager,
};
use tauri::AppHandle;
const ACCESS_KEY: &str = "mElDt3TjoRM7iL5qpeZ15U4R9RGy3SBEqNTinKar";
const SECRET_KEY: &str = "B5fcfvWOuQPZD0EKwVDvEfHk9FBcnRtgocxsMR1Q";
const BUCKET_NAME: &str = "sc-download";
const DOMAIN: &str = "download.yucunkeji.com";
use std::{
    path::{self, Path},
    vec,
};
#[tauri::command]
pub fn get_lists(marker: Option<String>, query: Option<String>) -> Result<Vec<QnFile>, TauriError> {
    println!("marker:{marker:?}, query:{query:?}");

    let mut files = vec![];
    let credential = Credential::new(ACCESS_KEY, SECRET_KEY);
    let object_manager = ObjectsManager::new(credential);
    let bucket = object_manager.bucket(BUCKET_NAME);
    let mut iter = bucket
        .list()
        .prefix(query.unwrap_or("".to_owned()))
        .limit(10)
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
    let mut hash_file_name = file_info.hash;
    let extension_name = file_info.key.rfind('.');
    if let Some(index) = extension_name {
        let base64 = base64::encode(&file_info.key[..index]);
        hash_file_name += &base64;
        hash_file_name += &file_info.key[index..];
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
