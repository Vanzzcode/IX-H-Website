// =======================================================
// AUTH.JS
// Logika login/logout memakai database Supabase.
// Sesi login disimpan di localStorage: TETAP login walau tab/browser
// ditutup dan dibuka lagi, sampai orangnya klik "Keluar" secara sadar.
// =======================================================

const SESSION_KEY = "ixh_sesi_akun";

// Ambil seluruh daftar akun dari Supabase (tanpa kolom password kalau tak perlu)
async function ambilDaftarAkun() {
  const { data, error } = await supabaseClient
    .from("akun")
    .select("id, no, nama, username, role, foto_url")
    .order("no", { ascending: true });

  if (error) throw error;
  return data;
}

// Cek username + password, kembalikan data akun (tanpa password) kalau cocok
async function cobaLogin(username, password) {
  const usernameBersih = username.trim().toLowerCase();

  const { data, error } = await supabaseClient
    .from("akun")
    .select("id, no, nama, username, password, role, foto_url")
    .ilike("username", usernameBersih)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  if (data.password !== password) return null;

  // Simpan sesi TANPA password (biar password gak nongkrong di penyimpanan browser)
  const sesi = {
    id: data.id,
    no: data.no,
    nama: data.nama,
    username: data.username,
    role: data.role,
    foto_url: data.foto_url,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesi));
  return sesi;
}

// Ambil sesi yang sedang login (null kalau belum login)
function ambilSesi() {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

// Update data sesi yang tersimpan (dipakai setelah ganti foto profil, dsb)
function perbaruiSesi(perubahan) {
  const sesi = ambilSesi();
  if (!sesi) return;
  const sesiBaru = { ...sesi, ...perubahan };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesiBaru));
}

// Logout: hapus sesi (satu-satunya cara sesi hilang, selain hapus data browser manual)
function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "index.html";
}

// Label tampilan untuk tiap role
function labelRole(role) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "penjadwal":
      return "Penjadwal";
    default:
      return "Siswa";
  }
}
