use app::{models::download::Download, *};
use diesel::{QueryDsl, RunQueryDsl, SqliteExpressionMethods};

fn main() {
    use self::schema::downloads::dsl::*;
    let connection = &mut establish_connection();
    let results = downloads
        // .filter(hash.is("other"))
        .limit(5)
        .load::<Download>(connection)
        .expect("Error loading posts");

    println!("Displaying {} downloads", results.len());
    for download in results {
        println!("{}", download.hash);
        println!("-----------\n");
        println!("{}", download.key);
    }
}
