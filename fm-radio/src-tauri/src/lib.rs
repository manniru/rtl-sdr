use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::State;

struct RadioState {
    process: Mutex<Option<Child>>,
    current_frequency: Mutex<f64>,
    volume: Mutex<u32>,
}

impl Default for RadioState {
    fn default() -> Self {
        Self {
            process: Mutex::new(None),
            current_frequency: Mutex::new(100.0e6),
            volume: Mutex::new(75),
        }
    }
}

#[tauri::command]
fn check_device() -> bool {
    let output = Command::new("rtl_test")
        .arg("-t")
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .output();

    match output {
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr);
            stderr.contains("Found") && stderr.contains("device")
        }
        Err(_) => false,
    }
}

#[tauri::command]
fn start_radio(frequency: f64, state: State<RadioState>) -> Result<bool, String> {
    let mut process_guard = state.process.lock().map_err(|e| e.to_string())?;

    // Kill existing process if any
    if let Some(mut child) = process_guard.take() {
        let _ = child.kill();
        let _ = child.wait();
    }

    // Convert frequency to MHz string
    let freq_mhz = frequency / 1e6;
    let freq_str = format!("{}M", freq_mhz);

    // Start rtl_fm piped to play (sox)
    // rtl_fm -f 100.0M -M wbfm -s 200000 -r 48000 - | play -r 48000 -t raw -e s -b 16 -c 1 -V1 -
    let child = Command::new("sh")
        .arg("-c")
        .arg(format!(
            "rtl_fm -f {} -M wbfm -s 200000 -r 48000 - 2>/dev/null | play -r 48000 -t raw -e s -b 16 -c 1 -V0 - 2>/dev/null",
            freq_str
        ))
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to start radio: {}", e))?;

    *process_guard = Some(child);
    *state.current_frequency.lock().map_err(|e| e.to_string())? = frequency;

    Ok(true)
}

#[tauri::command]
fn stop_radio(state: State<RadioState>) -> Result<bool, String> {
    let mut process_guard = state.process.lock().map_err(|e| e.to_string())?;

    if let Some(mut child) = process_guard.take() {
        // Kill the shell process and its children
        let _ = Command::new("pkill")
            .arg("-P")
            .arg(child.id().to_string())
            .output();
        let _ = child.kill();
        let _ = child.wait();
    }

    // Also kill any orphaned rtl_fm and play processes
    let _ = Command::new("pkill").arg("-f").arg("rtl_fm").output();
    let _ = Command::new("pkill").arg("-f").arg("play.*raw").output();

    Ok(true)
}

#[tauri::command]
fn tune_frequency(frequency: f64, state: State<RadioState>) -> Result<bool, String> {
    // Stop current playback
    stop_radio(state.clone())?;

    // Small delay to ensure cleanup
    std::thread::sleep(std::time::Duration::from_millis(200));

    // Start with new frequency
    start_radio(frequency, state)
}

#[tauri::command]
fn set_volume(volume: u32, state: State<RadioState>) -> Result<bool, String> {
    *state.volume.lock().map_err(|e| e.to_string())? = volume;

    // Set system volume using osascript on macOS
    let volume_percent = (volume as f32 / 100.0 * 7.0) as u32; // macOS volume is 0-7
    let _ = Command::new("osascript")
        .arg("-e")
        .arg(format!("set volume output volume {}", volume))
        .output();

    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(RadioState::default())
        .invoke_handler(tauri::generate_handler![
            check_device,
            start_radio,
            stop_radio,
            tune_frequency,
            set_volume
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
