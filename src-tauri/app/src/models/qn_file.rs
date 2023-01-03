use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct QnFile {
    pub key: String,
    pub hash: String,
    pub size: String,
    pub mime_type: String,
    pub downloaded: bool,
    pub marker: Option<String>,
}
