-- Your SQL goes here
create table if not exists "downloads" (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "key" text not null,
    "hash" text not null,
    "size" integer not null,
    "mime_type" text not null
);