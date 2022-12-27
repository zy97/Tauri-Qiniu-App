use app::{models::download::Download, *};
use diesel::*;

fn main() {
    use self::schema::downloads::dsl::*;
    let connection = &mut establish_connection();
    let results = downloads
        .limit(5)
        .load::<Download>(connection)
        .expect("Error loading posts");

    println!("Displaying {} downloads", results.len());

    let download = create_download(connection, "key", "hash", 100, "mime_type");
    println!("Download: {:?}", download);
}
