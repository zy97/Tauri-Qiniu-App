use qiniu_sdk::{download::DownloadError, objects::apis::http_client::ResponseError};
use sea_orm::DatabaseConnection;
use serde::Serialize;
use std::{
    io,
    sync::{MutexGuard, PoisonError},
};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum TauriError {
    #[error("IO error: {0:?}")]
    IO(#[from] io::Error),
    // #[error("lock error")]
    // Lock(#[from] PoisonError<std::sync::MutexGuard<'static, DatabaseConnection>>),
    #[error("lock error: {0:?}")]
    SeaDbErrpr(#[from] sea_orm::DbErr),
    #[error("download error: {0:?}")]
    InvalidHeader(#[from] DownloadError),
    // #[error("unknown data store error")]
    // Unknown,
    #[error("七牛请求错误: {0:?}")]
    Qiniu(#[from] ResponseError),
}
impl Serialize for TauriError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
