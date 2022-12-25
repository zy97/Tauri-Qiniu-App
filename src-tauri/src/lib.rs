use diesel::prelude::*;
use dotenvy::dotenv;
use std::env;
pub mod models;
pub mod schema;
pub fn establish_connection() -> SqliteConnection {
    // dotenv().ok();
    // println!("{}", std::env::current_dir().unwrap().display());
    // dotenv().expect(".env file not found");

    // let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let database_url = r"sqlite://C:\Users\bom_k\Desktop\test.db";
    SqliteConnection::establish(database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}
