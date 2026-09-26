// PROTOTYPE (branch prototype/desktop-wrap, tiket #4): wrapper Tauri minimum
// untuk memvalidasi Pixico Studio jalan offline sebagai app desktop.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("gagal menjalankan Pixico Studio");
}
