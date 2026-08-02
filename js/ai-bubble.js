// =======================================================
// AI-BUBBLE.JS
// Bubble AI yang bisa digeser ke mana saja di layar (pakai Pointer
// Events, jalan di HP & desktop). Tekan (tanpa geser) untuk membuka
// panel chat di tengah layar.
// =======================================================

function pasangBubbleAI() {
  // ---- Buat elemen bubble ----
  const bubble = document.createElement("div");
  bubble.id = "aiBubble";
  bubble.className = "ai-bubble";
  bubble.innerHTML = "AI";
  bubble.setAttribute("aria-label", "Buka Chat AI");
  document.body.appendChild(bubble);

  // ---- Buat elemen panel chat (tersembunyi awalnya) ----
  const overlay = document.createElement("div");
  overlay.id = "aiOverlay";
  overlay.className = "ai-overlay";
  overlay.innerHTML = `
    <div class="ai-panel">
      <div class="ai-panel-header">
        <span>Asisten AI IX-H</span>
        <button id="aiTutupBtn" class="ai-tutup-btn" aria-label="Tutup chat">✕</button>
      </div>
      <div id="aiPesanArea" class="ai-pesan-area">
        <div class="ai-pesan ai-pesan-bot">Halo! Aku asisten AI Kelas IX-H. Tanya apa saja seputar jadwal, siswa, atau website ini ya 😊</div>
      </div>
      <div class="ai-input-area">
        <input type="text" id="aiInput" placeholder="Tulis pertanyaan..." autocomplete="off" />
        <button id="aiKirimBtn" class="ai-kirim-btn">Kirim</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // ---- Posisi bubble tersimpan di localStorage biar tidak reset tiap halaman ----
  const POSISI_KEY = "ixh_posisi_bubble_ai";
  function muatPosisi() {
    const posisi = localStorage.getItem(POSISI_KEY);
    if (posisi) {
      const { x, y } = JSON.parse(posisi);
      // Pastikan posisi masih dalam batas layar (kalau resize/beda device)
      const xAman = Math.min(Math.max(x, 8), window.innerWidth - 64);
      const yAman = Math.min(Math.max(y, 8), window.innerHeight - 64);
      bubble.style.left = xAman + "px";
      bubble.style.top = yAman + "px";
    } else {
      // Posisi default: kanan bawah
      bubble.style.left = window.innerWidth - 76 + "px";
      bubble.style.top = window.innerHeight - 140 + "px";
    }
  }
  function simpanPosisi(x, y) {
    localStorage.setItem(POSISI_KEY, JSON.stringify({ x, y }));
  }
  muatPosisi();

  // ---- Logic drag pakai Pointer Events (jalan di touch & mouse) ----
  let sedangDrag = false;
  let sudahGeser = false;
  let offsetX = 0;
  let offsetY = 0;

  bubble.addEventListener("pointerdown", (e) => {
    sedangDrag = true;
    sudahGeser = false;
    bubble.setPointerCapture(e.pointerId);
    const rect = bubble.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });

  bubble.addEventListener("pointermove", (e) => {
    if (!sedangDrag) return;
    sudahGeser = true;
    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;
    x = Math.min(Math.max(x, 8), window.innerWidth - bubble.offsetWidth - 8);
    y = Math.min(Math.max(y, 8), window.innerHeight - bubble.offsetHeight - 8);
    bubble.style.left = x + "px";
    bubble.style.top = y + "px";
  });

  bubble.addEventListener("pointerup", (e) => {
    sedangDrag = false;
    bubble.releasePointerCapture(e.pointerId);
    const rect = bubble.getBoundingClientRect();
    simpanPosisi(rect.left, rect.top);

    // Kalau tidak digeser (cuma tap/klik), buka panel chat
    if (!sudahGeser) {
      bukaPanelAI();
    }
  });

  // Jaga-jaga posisi tetap valid kalau layar di-resize (misal putar HP)
  window.addEventListener("resize", muatPosisi);

  // ---- Buka / tutup panel chat ----
  function bukaPanelAI() {
    overlay.classList.add("ai-overlay-aktif");
    document.getElementById("aiInput").focus();
  }
  function tutupPanelAI() {
    overlay.classList.remove("ai-overlay-aktif");
  }

  document.getElementById("aiTutupBtn").addEventListener("click", tutupPanelAI);
  overlay.addEventListener("click", (e) => {
    // Klik di area gelap (luar panel) menutup chat
    if (e.target === overlay) tutupPanelAI();
  });

  // ---- Kirim pesan ----
  const pesanArea = document.getElementById("aiPesanArea");
  const input = document.getElementById("aiInput");
  const btnKirim = document.getElementById("aiKirimBtn");

  function tambahBubblePesan(teks, dariUser) {
    const div = document.createElement("div");
    div.className = dariUser ? "ai-pesan ai-pesan-user" : "ai-pesan ai-pesan-bot";
    div.textContent = teks;
    pesanArea.appendChild(div);
    pesanArea.scrollTop = pesanArea.scrollHeight;
    return div;
  }

  async function prosesKirim() {
    const teks = input.value.trim();
    if (!teks) return;

    input.value = "";
    input.disabled = true;
    btnKirim.disabled = true;

    tambahBubblePesan(teks, true);
    const bubbleLoading = tambahBubblePesan("Mengetik...", false);

    try {
      const jawaban = await kirimPesanAI(teks);
      bubbleLoading.textContent = jawaban;
    } catch (err) {
      bubbleLoading.textContent = "Maaf, terjadi kesalahan menghubungi AI. Coba lagi ya.";
    } finally {
      input.disabled = false;
      btnKirim.disabled = false;
      input.focus();
    }
  }

  btnKirim.addEventListener("click", prosesKirim);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") prosesKirim();
  });
}
