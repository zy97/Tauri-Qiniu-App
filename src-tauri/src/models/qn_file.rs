use serde::Serialize;

#[derive(Serialize)]
pub struct QnFile {
    pub key: String,
    pub hash: String,
    pub size: String,
    pub total_bytes: u64,
    pub mime_type: String,
}
