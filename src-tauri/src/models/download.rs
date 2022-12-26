use crate::schema::downloads;
use diesel::prelude::*;
#[derive(Queryable, Debug)]
pub struct Download {
    pub id: i32,
    pub key: String,
    pub hash: String,
    pub size: i32,
    pub mime_type: String,
}

#[derive(Insertable)]
#[diesel(table_name = downloads)]
pub struct NewDownload<'a> {
    pub key: &'a str,
    pub hash: &'a str,
    pub size: i32,
    pub mime_type: &'a str,
}
