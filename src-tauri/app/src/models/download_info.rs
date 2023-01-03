use entity::download;
use serde::Serialize;

#[derive(Clone, Serialize)]
pub struct DownloadInfo {
    pub data: download::Model,
    pub progress: f64,
}
