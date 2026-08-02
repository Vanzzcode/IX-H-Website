// =======================================================
// SISWA.JS
// Semua fungsi yang berhubungan dengan struktur kelas dan
// daftar siswa (termasuk fitur pencarian) ada di file ini.
// File ini butuh data dari data.js, jadi data.js harus
// dimuat lebih dulu di index.html.
// =======================================================

// ---- FUNGSI: Menampilkan Struktur Kelas ----
// Mengambil elemen <p> di HTML lewat id, lalu mengisi teksnya
function tampilkanStruktur() {
  document.getElementById("wali-kelas").textContent = strukturKelas.waliKelas;
  document.getElementById("ketua-kelas").textContent = strukturKelas.ketuaKelas;
  document.getElementById("wakil-ketua").textContent = strukturKelas.wakilKetua;

  // Sekretaris & bendahara diisi 2 orang -- tampilkan sebagai baris
  // terpisah (bukan digabung "Nama A & Nama B" dalam satu baris),
  // supaya tetap mudah dibaca di layar sempit.
  document.getElementById("sekretaris").innerHTML =
    `<span class="nama-ganda">${strukturKelas.sekretaris1}</span><span class="nama-ganda">${strukturKelas.sekretaris2}</span>`;
  document.getElementById("bendahara").innerHTML =
    `<span class="nama-ganda">${strukturKelas.bendahara1}</span><span class="nama-ganda">${strukturKelas.bendahara2}</span>`;
}

// ---- FUNGSI: Menampilkan Daftar Siswa ----
// "list" adalah array siswa yang mau ditampilkan
// (dipisah dari daftarSiswa asli supaya bisa dipakai ulang saat pencarian)
function tampilkanSiswa(list) {
  const container = document.getElementById("daftarSiswa");

  // Kosongkan dulu isi container sebelum diisi ulang
  container.innerHTML = "";

  // Kalau tidak ada hasil pencarian
  if (list.length === 0) {
    container.innerHTML = "<p>Siswa tidak ditemukan.</p>";
    return;
  }

  // Looping setiap siswa, lalu buat kartu HTML-nya
  list.forEach((siswa) => {
    const card = document.createElement("div");
    card.className = "siswa-card";
    card.innerHTML = `
      <div class="nomor">No. ${siswa.no}</div>
      <div class="nama">${siswa.nama}</div>
    `;
    container.appendChild(card);
  });
}

// ---- FITUR: Pencarian Siswa ----
// "input" event berjalan setiap kali user mengetik di kotak pencarian
function pasangPencarianSiswa() {
  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("input", (e) => {
    const kataKunci = e.target.value.toLowerCase();

    // Filter siswa yang namanya mengandung kata kunci
    const hasil = daftarSiswa.filter((siswa) =>
      siswa.nama.toLowerCase().includes(kataKunci)
    );

    tampilkanSiswa(hasil);
  });
}
