// =======================================================
// THEME.JS
// Toggle dark/light mode, disimpan di localStorage supaya
// pilihan bertahan di kunjungan berikutnya.
// Catatan: warna aslinya sudah di-set SANGAT AWAL lewat inline
// script kecil di <head> tiap halaman (sebelum CSS/HTML dirender),
// supaya tidak ada kedipan warna salah. File ini cuma mengurus
// tombol togglenya.
// =======================================================

const TEMA_KEY = "ixh_tema";

function ambilTemaSaatIni() {
  return localStorage.getItem(TEMA_KEY) || "dark";
}

function terapkanTema(tema) {
  document.documentElement.setAttribute("data-tema", tema);
  localStorage.setItem(TEMA_KEY, tema);
}

function pasangTombolTema() {
  const tombol = document.getElementById("tombolTema");
  if (!tombol) return;

  function perbaruiIkon() {
    const tema = ambilTemaSaatIni();
    tombol.textContent = tema === "dark" ? "🌙" : "☀️";
    tombol.setAttribute("aria-label", tema === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap");
  }

  perbaruiIkon();

  tombol.addEventListener("click", () => {
    const temaBaru = ambilTemaSaatIni() === "dark" ? "light" : "dark";
    terapkanTema(temaBaru);
    perbaruiIkon();
  });
}
