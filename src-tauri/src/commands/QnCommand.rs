// use futures::stream::TryStreamExt;
// use qiniu_sdk::objects::{apis::credential::Credential, ObjectsManager};

// use crate::models::QnFile::QnFile;
// // #[tauri::command]
// // pub async fn test() -> Vec<QnFile> {
// //     let mut files = vec![];
// //     let access_key = "mElDt3TjoRM7iL5qpeZ15U4R9RGy3SBEqNTinKar";
// //     let secret_key = "B5fcfvWOuQPZD0EKwVDvEfHk9FBcnRtgocxsMR1Q";
// //     let bucket_name = "sc-download";
// //     let credential = Credential::new(access_key, secret_key);
// //     let object_manager = ObjectsManager::new(credential);
// //     let bucket = object_manager.bucket(bucket_name);

// //     let mut iter = bucket.list().limit(10).stream();
// //     while let Some(entry) = iter.try_next().await.unwrap() {
// //         files.push(QnFile {
// //             key: entry.get_key_as_str().into(),
// //             hash: entry.get_hash_as_str().into(),
// //             size: entry.get_size_as_u64(),
// //             mime_type: entry.get_mime_type_as_str().into(),
// //         });
// //     }
// //     files
// // }
// #[tauri::command]
// pub async fn test() {
//     let mut files = vec![];
//     let access_key = "mElDt3TjoRM7iL5qpeZ15U4R9RGy3SBEqNTinKar";
//     let secret_key = "B5fcfvWOuQPZD0EKwVDvEfHk9FBcnRtgocxsMR1Q";
//     let bucket_name = "sc-download";
//     let credential = Credential::new(access_key, secret_key);
//     let object_manager = ObjectsManager::new(credential);
//     let bucket = object_manager.bucket(bucket_name);

//     let mut iter = bucket.list().limit(10).stream();
//     while let Some(entry) = iter.try_next().await.unwrap() {
//         files.push(QnFile {
//             key: entry.get_key_as_str().into(),
//             hash: entry.get_hash_as_str().into(),
//             size: entry.get_size_as_u64(),
//             mime_type: entry.get_mime_type_as_str().into(),
//         });
//     }
// }
