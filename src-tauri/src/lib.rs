use std::fs;
use std::path::Path;

/// True when `path` is an existing folder. The app checks this before it renders over a folder.
#[tauri::command]
fn folder_exists(path: String) -> bool {
    Path::new(&path).is_dir()
}

/// Creates one folder. A folder that is already there is left untouched.
/// The parent must exist: the app creates the project folder before its bins.
#[tauri::command]
fn create_folder(path: String) -> Result<(), String> {
    let target = Path::new(&path);
    if target.is_dir() {
        return Ok(());
    }
    fs::create_dir(target).map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![folder_exists, create_folder])
        .run(tauri::generate_context!())
        .expect("error while running Resolve Organizer");
}
