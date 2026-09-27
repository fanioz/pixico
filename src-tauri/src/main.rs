// Wrapper Tauri v2: seluruh aplikasi hidup di `../src` (di-embed ke binary saat
// build), tanpa backend dan tanpa panggilan jaringan — lihat docs/adr/0001.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("gagal menjalankan Pixico");
}
