// Wrapper Tauri v2: seluruh aplikasi hidup di `../src` (di-embed ke binary saat
// build), tanpa backend dan tanpa panggilan jaringan — lihat docs/adr/0001.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("gagal menjalankan Pixico");
}
