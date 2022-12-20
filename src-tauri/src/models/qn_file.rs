use serde::Serialize;

#[derive(Serialize)]
pub struct QnFile {
    pub key: String,
    pub hash: String,
    pub size: String,
    pub mime_type: String,
    pub marker: Option<String>,
}
