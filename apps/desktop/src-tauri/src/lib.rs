use tauri::Manager;
use std::thread;
use tiny_http::{Server, Response, Header};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

mod computer;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_ws_token() -> Result<String, String> {
    let mut dir = dirs::home_dir().ok_or("Home directory not found")?;
    dir.push(".three");
    let token_path = dir.join("ws_token");
    fs::read_to_string(token_path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            thread::spawn(|| {
                // 1. Generate token and store it securely
                let token = Uuid::new_v4().to_string();
                
                // ensure ~/.three directory exists
                let mut dir = dirs::home_dir().expect("Home directory not found");
                dir.push(".three");
                if !dir.exists() {
                    fs::create_dir_all(&dir).expect("Failed to create .three dir");
                }
                let token_path = dir.join("bridge_token");
                fs::write(token_path, &token).expect("Failed to write bridge_token");
                // TODO: set file permissions to 600 (unix) in real production

                // 2. Start HTTP server
                let server = Server::http("127.0.0.1:18881").unwrap();
                for mut request in server.incoming_requests() {
                    
                    // 3. Verify Authentication
                    let mut authenticated = false;
                    for header in request.headers() {
                        if header.field.equiv("Authorization") {
                            let val = header.value.as_str();
                            if val == format!("Bearer {}", token) {
                                authenticated = true;
                            }
                        }
                    }

                    if !authenticated {
                        let resp = Response::from_string("Unauthorized").with_status_code(401);
                        let _ = request.respond(resp);
                        continue;
                    }

                    let mut content = String::new();
                    request.as_reader().read_to_string(&mut content).unwrap_or(0);
                    let result: Result<Value, String> = (|| {
                        let parsed: Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
                        let command = parsed["command"].as_str().unwrap_or("");
                        let args = &parsed["args"];
                        
                        // Strict command routing. NO arbitrary commands allowed.
                        match command {
                            "open_application" => {
                                let name = args["name"].as_str().unwrap_or("");
                                computer::open_application(name).map(|s| serde_json::json!(s))
                            }
                            "close_application" => {
                                let name = args["name"].as_str().unwrap_or("");
                                computer::close_application(name).map(|s| serde_json::json!(s))
                            }
                            "focus_application" => {
                                let name = args["name"].as_str().unwrap_or("");
                                computer::focus_application(name).map(|s| serde_json::json!(s))
                            }
                            "is_application_running" => {
                                let name = args["name"].as_str().unwrap_or("");
                                computer::is_application_running(name).map(|b| serde_json::json!(b))
                            }
                            "list_applications" => computer::list_applications().map(|v| serde_json::json!(v)),
                            "open_file" => {
                                let path = args["path"].as_str().unwrap_or("");
                                computer::open_file(path).map(|s| serde_json::json!(s))
                            }
                            "open_folder" => {
                                let path = args["path"].as_str().unwrap_or("");
                                computer::open_folder(path).map(|s| serde_json::json!(s))
                            }
                            "read_file" => {
                                let path = args["path"].as_str().unwrap_or("");
                                computer::read_file(path).map(|s| serde_json::json!(s))
                            }
                            "create_file" => {
                                let path = args["path"].as_str().unwrap_or("");
                                let content = args["content"].as_str().unwrap_or("");
                                computer::create_file(path, content).map(|s| serde_json::json!(s))
                            }
                            "write_file" => {
                                let path = args["path"].as_str().unwrap_or("");
                                let content = args["content"].as_str().unwrap_or("");
                                computer::write_file(path, content).map(|s| serde_json::json!(s))
                            }
                            "delete_file" => {
                                let path = args["path"].as_str().unwrap_or("");
                                computer::delete_file(path).map(|s| serde_json::json!(s))
                            }
                            "find_files" => {
                                let query = args["pattern"].as_str().unwrap_or("");
                                let directory = args["path"].as_str().unwrap_or("");
                                computer::find_files(query, directory).map(|v| serde_json::json!(v))
                            }
                            "move_file" => {
                                let source = args["source"].as_str().unwrap_or("");
                                let dest = args["destination"].as_str().unwrap_or("");
                                computer::move_file(source, dest).map(|s| serde_json::json!(s))
                            }
                            "rename_file" => {
                                let path = args["path"].as_str().unwrap_or("");
                                let new_name = args["new_name"].as_str().unwrap_or("");
                                computer::rename_file(path, new_name).map(|s| serde_json::json!(s))
                            }
                            "take_screenshot" => {
                                let path = args["savePath"].as_str().unwrap_or("");
                                computer::take_screenshot(path).map(|s| serde_json::json!(s))
                            }
                            "get_clipboard" => computer::get_clipboard().map(|s| serde_json::json!(s)),
                            "set_clipboard" => {
                                let text = args["text"].as_str().unwrap_or("");
                                computer::set_clipboard(text).map(|s| serde_json::json!(s))
                            }
                            _ => Err(format!("Unknown command {}", command)),
                        }
                    })();

                    let response = match result {
                        Ok(res) => serde_json::json!({"success": true, "message": res}),
                        Err(e) => serde_json::json!({"success": false, "message": e}),
                    };
                    
                    let mut resp = Response::from_string(response.to_string());
                    resp.add_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap());
                    let _ = request.respond(resp);
                }
            });
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_ws_token,
            computer::open_application,
            computer::close_application,
            computer::focus_application,
            computer::is_application_running,
            computer::list_applications,
            computer::open_file,
            computer::open_folder,
            computer::read_file,
            computer::create_file,
            computer::write_file,
            computer::delete_file,
            computer::find_files,
            computer::move_file,
            computer::rename_file,
            computer::take_screenshot,
            computer::get_clipboard,
            computer::set_clipboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
