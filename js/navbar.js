// =======================================================
// NAVBAR.JS
// Logika untuk membuka/menutup menu hamburger di layar HP.
// =======================================================

function pasangHamburgerMenu() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  // Saat tombol hamburger diklik, toggle (buka/tutup) class "show"
  // "show" ini yang bikin menu-nya muncul (diatur di navbar.css)
  hamburgerBtn.addEventListener("click", () => {
    navLinks.classList.toggle("show");
    hamburgerBtn.classList.toggle("active"); // animasi ikon jadi "X"
  });

  // Menu otomatis tertutup begitu salah satu link diklik
  // (biar user gak perlu klik hamburger lagi setelah pindah section)
  const semuaLink = navLinks.querySelectorAll("a");
  semuaLink.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("show");
      hamburgerBtn.classList.remove("active");
    });
  });
}
