use chrono::{DateTime, NaiveDateTime};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug)]
pub struct QnFile {
    pub key: String,
    pub hash: String,
    pub size: String,
    pub mime_type: String,
    pub downloaded: bool,
    pub marker: Option<String>,
}

// #[derive(Serialize, Deserialize, Debug)]
// pub struct LocalFile {
//     pub name: String,
//     pub path: PathBuf,
//     pub mime: String,
//     pub download_date: NaiveDateTime,
// }
