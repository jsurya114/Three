// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod computer;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            computer::open_application,
            computer::close_application,
            computer::open_file,
            computer::open_folder,
            computer::find_files,
            computer::create_file,
            computer::move_file,
            computer::rename_file,
            computer::take_screenshot,
            computer::get_clipboard,
            computer::set_clipboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
