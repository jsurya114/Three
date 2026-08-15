use std::process::Command;
use std::fs;
use std::path::Path;

#[tauri::command]
pub fn open_application(name: &str) -> Result<String, String> {
    Command::new("open")
        .arg("-a")
        .arg(name)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(format!("Opened application: {}", name))
}

#[tauri::command]
pub fn close_application(name: &str) -> Result<String, String> {
    let script = format!("quit app \"{}\"", name);
    Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(format!("Closed application: {}", name))
}

#[tauri::command]
pub fn open_file(path: &str) -> Result<String, String> {
    Command::new("open")
        .arg(path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(format!("Opened file: {}", path))
}

#[tauri::command]
pub fn open_folder(path: &str) -> Result<String, String> {
    open_file(path) // Mac uses 'open' for both files and folders
}

#[tauri::command]
pub fn find_files(query: &str, directory: &str) -> Result<Vec<String>, String> {
    let output = Command::new("find")
        .arg(directory)
        .arg("-name")
        .arg(format!("*{}*", query))
        .output()
        .map_err(|e| e.to_string())?;
    
    let result = String::from_utf8_lossy(&output.stdout);
    let files: Vec<String> = result
        .split('\n')
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect();
    
    Ok(files)
}

#[tauri::command]
pub fn focus_application(name: &str) -> Result<String, String> {
    let script = format!("activate application \"{}\"", name);
    Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(format!("Focused application: {}", name))
}

#[tauri::command]
pub fn is_application_running(name: &str) -> Result<bool, String> {
    let script = format!("application \"{}\" is running", name);
    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| e.to_string())?;
    
    let result = String::from_utf8_lossy(&output.stdout).trim().to_lowercase();
    Ok(result == "true")
}

#[tauri::command]
pub fn list_applications() -> Result<Vec<String>, String> {
    let script = "tell application \"System Events\" to get name of every application process whose background only is false";
    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .map_err(|e| e.to_string())?;
        
    let result = String::from_utf8_lossy(&output.stdout);
    let apps: Vec<String> = result
        .split(", ")
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
        
    Ok(apps)
}

#[tauri::command]
pub fn read_file(path: &str) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_file(path: &str, content: &str) -> Result<String, String> {
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(format!("Created file: {}", path))
}

#[tauri::command]
pub fn write_file(path: &str, content: &str) -> Result<String, String> {
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(format!("Wrote to file: {}", path))
}

#[tauri::command]
pub fn delete_file(path: &str) -> Result<String, String> {
    fs::remove_file(path).map_err(|e| e.to_string())?;
    Ok(format!("Deleted file: {}", path))
}

#[tauri::command]
pub fn move_file(source: &str, destination: &str) -> Result<String, String> {
    fs::rename(source, destination).map_err(|e| e.to_string())?;
    Ok(format!("Moved {} to {}", source, destination))
}

#[tauri::command]
pub fn rename_file(path: &str, new_name: &str) -> Result<String, String> {
    let old_path = Path::new(path);
    if let Some(parent) = old_path.parent() {
        let new_path = parent.join(new_name);
        fs::rename(old_path, new_path).map_err(|e| e.to_string())?;
        Ok(format!("Renamed {} to {}", path, new_name))
    } else {
        Err("Invalid path".to_string())
    }
}

#[tauri::command]
pub fn take_screenshot(save_path: &str) -> Result<String, String> {
    Command::new("screencapture")
        .arg("-x")
        .arg(save_path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(format!("Screenshot saved to {}", save_path))
}

#[tauri::command]
pub fn get_clipboard() -> Result<String, String> {
    let output = Command::new("pbpaste")
        .output()
        .map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

#[tauri::command]
pub fn set_clipboard(text: &str) -> Result<String, String> {
    use std::io::Write;
    let mut child = Command::new("pbcopy")
        .stdin(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;
        
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(text.as_bytes()).map_err(|e| e.to_string())?;
    }
    
    child.wait().map_err(|e| e.to_string())?;
    Ok("Clipboard updated".to_string())
}
