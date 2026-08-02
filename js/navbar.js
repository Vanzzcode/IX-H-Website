// =======================================================
// NAVBAR.JS
// Logika untuk membuka/menutup panel menu (sidebar kiri) di layar HP.
// =======================================================

function pasangHamburgerMenu() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");
  const overlay = document.getElementById("navOverlay");
  const tombolTutup = document.getElementById("navTutupBtn");

  function bukaMenu() {
    navLinks.classList.add("show");
    hamburgerBtn.classList.add("active");
    if (overlay) overlay.classList.add("show");
  }

  function tutupMenu() {
    navLinks.classList.remove("show");
    hamburgerBtn.classList.remove("active");
    if (overlay) overlay.classList.remove("show");
  }

  hamburgerBtn.addEventListener("click", () => {
    const sedangTerbuka = navLinks.classList.contains("show");
    if (sedangTerbuka) {
      tutupMenu();
    } else {
      bukaMenu();
    }
  });

  // Menutup panel saat area gelap di luar panel (overlay) disentuh
  if (overlay) {
    overlay.addEventListener("click", tutupMenu);
  }

  // Menutup panel lewat tombol "✕" di header panel itu sendiri
  if (tombolTutup) {
    tombolTutup.addEventListener("click", tutupMenu);
  }

  // Menu otomatis tertutup begitu salah satu link diklik
  // (biar user gak perlu buka-tutup manual setelah pindah section)
  const semuaLink = navLinks.querySelectorAll("a");
  semuaLink.forEach((link) => {
    link.addEventListener("click", tutupMenu);
  });

  // Menutup panel dengan tombol Escape di keyboard (aksesibilitas)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") tutupMenu();
  });
}
