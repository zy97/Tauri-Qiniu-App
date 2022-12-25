use diesel::prelude::*;

#[derive(Queryable)]
pub struct Download {
    pub id: i32,
    pub key: String,
    pub hash: String,
    pub size: i32,
    pub mime_type: String,
}
