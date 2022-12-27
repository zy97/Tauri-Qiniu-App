pub use sea_orm_migration::prelude::*;

mod m20221227_152441_create_download_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![Box::new(m20221227_152441_create_download_table::Migration)]
    }
}
