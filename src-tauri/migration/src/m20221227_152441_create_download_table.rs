use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts

        manager
            .create_table(
                Table::create()
                    .table(Download::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Download::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Download::Key).string().not_null())
                    .col(ColumnDef::new(Download::Hash).string().not_null())
                    .col(ColumnDef::new(Download::Size).integer().not_null())
                    .col(ColumnDef::new(Download::MimeType).string().not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts

        manager
            .drop_table(Table::drop().table(Download::Table).to_owned())
            .await
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum Download {
    Table,
    Id,
    Key,
    Hash,
    Size,
    MimeType,
}
