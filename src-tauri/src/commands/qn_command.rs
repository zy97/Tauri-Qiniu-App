use std::vec;

use crate::models::qn_file::QnFile;
use futures::stream::TryStreamExt;
use humansize::file_size_opts as options;
use humansize::FileSize;
use qiniu_sdk::http_client::BucketRegionsQueryer;
use qiniu_sdk::http_client::HttpClient;
use qiniu_sdk::http_client::RegionsProviderEndpoints;
use qiniu_sdk::http_client::ServiceName;
use qiniu_sdk::objects::ListVersion;
use qiniu_sdk::{credential::Credential, objects::ObjectsManager};
#[tauri::command]
pub async fn test() -> Vec<QnFile> {
    let mut files = vec![];
    let access_key = "mElDt3TjoRM7iL5qpeZ15U4R9RGy3SBEqNTinKar";
    let secret_key = "B5fcfvWOuQPZD0EKwVDvEfHk9FBcnRtgocxsMR1Q";
    let bucket_name = "sc-download";
    let credential = Credential::new(access_key, secret_key);
    let object_manager = ObjectsManager::new(credential);
    let bucket = object_manager.bucket(bucket_name);
    let mut iter = bucket
        .list()
        .limit(100)
        .version(ListVersion::V1)
        .need_parts()
        .iter();
    println!("1:{:?}", iter);
    while let Some(entry) = iter.next() {
        println!("{:?}", entry);
        let entry = entry.unwrap();
        files.push(QnFile {
            key: entry.get_key_as_str().into(),
            hash: entry.get_hash_as_str().into(),
            size: entry
                .get_size_as_u64()
                .file_size(options::CONVENTIONAL)
                .unwrap(),
            mime_type: entry.get_mime_type_as_str().into(),
            total_bytes: entry.get_size_as_u64(),
        });
    }
    files
}
// #[tauri::command]
// pub async fn test1() -> Vec<QnFile> {
//     let mut files = vec![];
//     let access_key = "mElDt3TjoRM7iL5qpeZ15U4R9RGy3SBEqNTinKar";
//     let secret_key = "B5fcfvWOuQPZD0EKwVDvEfHk9FBcnRtgocxsMR1Q";
//     let bucket_name = "sc-download";
//     let credential = Credential::new(access_key, secret_key);
//     let response = HttpClient::default().async_get(
//         &[ServiceName::Rsf],
//         RegionsProviderEndpoints::new(
//             BucketRegionsQueryer::new().query(credential.access_key().to_owned(), bucket_name),
//         ),
//     ).path(path)

//     files
// }
