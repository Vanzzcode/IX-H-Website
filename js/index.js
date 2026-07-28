// =======================================================
// INDEX.JS
// Ini file "utama" yang menjalankan semua fungsi.
// File ini WAJIB dimuat PALING TERAKHIR di index.html,
// karena dia memakai fungsi-fungsi dari siswa.js dan jadwal.js.
// =======================================================

// Semua dijalankan setelah HTML selesai dimuat, biar aman dari urutan
// loading script yang kadang tidak konsisten (terutama di live server HP).
document.addEventListener("DOMContentLoaded", () => {
  // Menampilkan struktur kelas (wali kelas, ketua, dst)
  tampilkanStruktur();

  // Menampilkan seluruh daftar siswa saat halaman pertama dibuka
  tampilkanSiswa(daftarSiswa);

  // Mengaktifkan fitur pencarian pada kotak input
  pasangPencarianSiswa();

  // Menampilkan jadwal pelajaran hari ini & info besok
  tampilkanJadwalHariIni();
  tampilkanInfoBesok();

  // Mengaktifkan tombol hamburger menu
  pasangHamburgerMenu();

  // Kalau sudah login, menu "Akun" di navbar langsung arahkan ke dashboard
  const navAkunLink = document.getElementById("navAkunLink");
  if (navAkunLink && ambilSesi()) {
    navAkunLink.href = "akun.html";
    navAkunLink.textContent = "Akun (" + ambilSesi().nama.split(" ")[0] + ")";
  }
});
