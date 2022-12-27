// @generated automatically by Diesel CLI.

diesel::table! {
    downloads (id) {
        id -> Integer,
        key -> Text,
        hash -> Text,
        size -> Integer,
        mime_type -> Text,
    }
}
