use crate::error::TauriError;
use entity::{
    prelude::Uploads,
    upload::{self, ActiveModel, Model},
};
use sea_orm::{
    prelude::Uuid, ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait,
    QueryFilter, Set,
};
pub async fn upload_find_by_path(
    path: &str,
    connection: &DatabaseConnection,
) -> Result<Option<Model>, TauriError> {
    let upload = Uploads::find()
        .filter(upload::Column::Path.eq(path))
        .one(connection)
        .await?;
    Ok(upload)
}
pub async fn upload_insert(
    path: &str,
    connection: &DatabaseConnection,
) -> Result<Model, TauriError> {
    let upload = upload::ActiveModel {
        id: Set(Uuid::new_v4()),
        key: ActiveValue::NotSet,
        hash: ActiveValue::NotSet,
        path: Set(String::from(path)),
    };
    Ok(upload.insert(connection).await?)
}
pub async fn upload_update_hash_key(
    upload: Model,
    key: &str,
    hash: &str,
    connection: &DatabaseConnection,
) -> Result<(), TauriError> {
    let mut upload: ActiveModel = upload.into();
    upload.key = Set(Some(key.to_owned()));
    upload.hash = Set(Some(hash.to_owned()));
    upload.update(connection).await?;
    Ok(())
}
pub async fn upload_delete_by_key(
    key: &str,
    connection: &DatabaseConnection,
) -> Result<(), TauriError> {
    Uploads::delete_many()
        .filter(upload::Column::Key.eq(key))
        .exec(connection)
        .await?;
    Ok(())
}
