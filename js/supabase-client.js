// =======================================================
// SUPABASE-CLIENT.JS
// Inisialisasi koneksi ke database Supabase.
// WAJIB dimuat SEBELUM auth.js, akun-dashboard.js, dan jadwal.js
// karena file-file itu memakai variabel `supabaseClient` dari sini.
// =======================================================

const SUPABASE_URL = "https://wtrhvhrvuymzkgdttkel.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cGI9jbz-Tt_JO4adGRb_YA_7Lkv9FqG";

// `supabase` datang dari script CDN yang dimuat di <head> tiap halaman HTML
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
