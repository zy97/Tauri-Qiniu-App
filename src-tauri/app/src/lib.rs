use diesel::prelude::*;
use models::download::Download;

use crate::models::download::NewDownload;
pub mod models;
pub mod schema;
pub fn establish_connection() -> SqliteConnection {
    // dotenv().ok();
    // println!("{}", std::env::current_dir().unwrap().display());
    // dotenv().expect(".env file not found");

    // let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let database_url = "sqlite://../test.db";
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}

pub fn create_download(
    conn: &mut SqliteConnection,
    key: &str,
    hash: &str,
    size: i32,
    mime_type: &str,
) -> Download {
    use crate::schema::downloads;

    let new_post = NewDownload {
        key,
        hash,
        size,
        mime_type,
    };

    diesel::insert_into(downloads::table)
        .values(&new_post)
        .get_result(conn)
        .expect("Error saving new post")
}
