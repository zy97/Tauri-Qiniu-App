use std::io;

use qiniu_sdk::objects::apis::http_client::ResponseError;
use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum TauriError {
    #[error("IO异常: {0:?}")]
    IO(#[from] io::Error),
    // #[error("the data for key `{0}` is not available")]
    // Redaction(String),
    // #[error("invalid header (expected {expected:?}, found {found:?})")]
    // InvalidHeader { expected: String, found: String },
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
