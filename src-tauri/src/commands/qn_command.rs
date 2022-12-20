use crate::models::qn_file::QnFile;
use humansize::{format_size, DECIMAL};
use qiniu_sdk::{
    credential::Credential,
    download::{DownloadManager, StaticDomainsUrlsGenerator},
    objects::ObjectsManager,
};
use std::vec;
#[tauri::command]
pub async fn get_lists(marker: Option<String>, query: Option<String>) -> Vec<QnFile> {
    println!("marker:{marker:?}, query:{query:?}");

    let mut files = vec![];
    let access_key = "mElDt3TjoRM7iL5qpeZ15U4R9RGy3SBEqNTinKar";
    let secret_key = "B5fcfvWOuQPZD0EKwVDvEfHk9FBcnRtgocxsMR1Q";
    let bucket_name = "sc-download";
    let credential = Credential::new(access_key, secret_key);
    let object_manager = ObjectsManager::new(credential);
    let bucket = object_manager.bucket(bucket_name);
    let mut iter = bucket
        .list()
        .prefix(query.unwrap_or("".to_owned()))
        .limit(10)
        .marker(marker.unwrap_or("".to_owned()))
        .iter();

    while let Some(entry) = iter.next() {
        let entry = entry.unwrap();
        files.push(QnFile {
            key: entry.get_key_as_str().into(),
            hash: entry.get_hash_as_str().into(),
            size: format_size(entry.get_size_as_u64(), DECIMAL),
            mime_type: entry.get_mime_type_as_str().into(),
            marker: iter.marker().map(|s| s.to_string()),
        });
    }
    files
}

#[tauri::command]
pub async fn download(object_name: String) {
    println!("{}", object_name);
    let domain = "download.yucunkeji.com";
    let download_manager = DownloadManager::new(
        StaticDomainsUrlsGenerator::builder(domain)
            .use_https(false) // 设置为 HTTP 协议
            .build(),
    );
    let mut buf = vec![];
    download_manager
        .download(object_name)
        .unwrap()
        .on_download_progress(|e| {
            println!(
                "已下载：{}/{}",
                e.transferred_bytes(),
                e.total_bytes().unwrap_or_default()
            );
            Ok(())
        })
        .to_writer(&mut buf)
        .unwrap();
    println!("下载完成");
}
