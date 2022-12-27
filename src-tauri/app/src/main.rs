#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
extern crate humansize;
mod commands;
use commands::qn_command::get_lists;
use sea_orm::{ConnectOptions, Database, DatabaseConnection};
use std::{sync::Mutex, time::Duration};
use tauri::{
    generate_context, CustomMenuItem, Manager, RunEvent, SystemTray, SystemTrayEvent,
    SystemTrayMenu, SystemTrayMenuItem, WindowBuilder,
};
use tracing::log;
mod error;
use crate::commands::qn_command::{download, get_download_files, get_test};
pub mod models;
use migration::{Migrator, MigratorTrait};
pub struct DbConnection {
    db: Mutex<DatabaseConnection>,
}
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_test_writer()
        .init();
    let mut opt = ConnectOptions::new("sqlite://./test.db?mode=rwc".to_owned());
    opt.max_connections(100)
        .min_connections(5)
        .connect_timeout(Duration::from_secs(8))
        .acquire_timeout(Duration::from_secs(8))
        .idle_timeout(Duration::from_secs(8))
        .max_lifetime(Duration::from_secs(8))
        .sqlx_logging(false)
        .sqlx_logging_level(log::LevelFilter::Info)
        .sqlcipher_key("bomky");

    let db = Database::connect(opt).await?;
    Migrator::up(&db, None).await?;
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let tray_menu = SystemTrayMenu::new()
        .add_item(quit)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(hide);
    let tray = SystemTray::new().with_menu(tray_menu);
    tauri::Builder::default()
        .manage(DbConnection { db: Mutex::new(db) })
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::DoubleClick { .. } => {
                WindowBuilder::new(app, "main", tauri::WindowUrl::App("index.html".into()))
                    .build()
                    .unwrap();

                // app.get_window("main").unwrap().show();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "hide" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            get_lists,
            download,
            get_download_files,
            get_test
        ])
        .build(generate_context!())
        .expect("error while building tauri application")
        .run(|_, event| match event {
            RunEvent::ExitRequested { api, .. } => {
                api.prevent_exit();
            }
            _ => {}
        });
    Ok(())
}
