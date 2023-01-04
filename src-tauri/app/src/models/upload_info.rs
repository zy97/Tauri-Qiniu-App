use entity::upload;
use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct UploadInfo {
    pub data: upload::Model,
    pub progress: f64,
}
#[derive(Serialize)]
pub enum UploadStatus {
    Uploading,
    Uploaded,
    DirNotSupport,
}
