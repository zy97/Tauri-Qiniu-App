use crate::models::qn_file::QnFile;
use humansize::{format_size, DECIMAL};
use qiniu_sdk::{credential::Credential, objects::ObjectsManager};
use std::vec;
#[tauri::command]
pub async fn test(marker: Option<String>, query: Option<String>) -> Vec<QnFile> {
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
        println!("777");
        files.push(QnFile {
            key: entry.get_key_as_str().into(),
            hash: entry.get_hash_as_str().into(),
            size: format_size(entry.get_size_as_u64(), DECIMAL),
            // size: entry
            //     .get_size_as_u64()
            //     .file_size(options::CONVENTIONAL)
            //     .unwrap(),
            mime_type: entry.get_mime_type_as_str().into(),
            total_bytes: entry.get_size_as_u64(),
            marker: iter.marker().map(|s| s.to_string()),
        });
    }

    println!("files");
    files
}
