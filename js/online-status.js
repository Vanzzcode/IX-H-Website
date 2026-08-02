// =======================================================
// ONLINE-STATUS.JS
// Menghitung "sedang online" tanpa perlu akun/login.
// - Tiap tab yang membuka beranda dapat session_id acak (localStorage,
//   TIDAK terhubung ke akun manapun) dan kirim "denyut" (heartbeat)
//   tiap 20 detik ke tabel pengunjung_online.
// - Saat tab ditutup, sinyal keluar dikirim SEGERA (bukan nunggu
//   timeout) lewat pagehide/beforeunload, sehingga angka online
//   langsung berkurang 1.
// - Sebagai jaga-jaga kalau sinyal keluar gagal terkirim (HP mati
//   mendadak, koneksi putus), baris yang heartbeat-nya lebih tua dari
//   40 detik dianggap basi dan tidak dihitung sebagai online.
// =======================================================

const ONLINE_SESSION_KEY = "ixh_sesi_pengunjung";
const INTERVAL_HEARTBEAT_MS = 20000; // 20 detik
const BATAS_BASI_DETIK = 40; // baris tanpa denyut > 40 detik dianggap sudah offline

function ambilSessionIdPengunjung() {
  let sid = localStorage.getItem(ONLINE_SESSION_KEY);
  if (!sid) {
    sid = "pengunjung-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(ONLINE_SESSION_KEY, sid);
  }
  return sid;
}

async function kirimHeartbeat() {
  const sid = ambilSessionIdPengunjung();
  try {
    await supabaseClient
      .from("pengunjung_online")
      .upsert({ session_id: sid, denyut_terakhir: new Date().toISOString() });
  } catch (err) {
    // Diam saja kalau gagal, akan dicoba lagi di denyut berikutnya
  }
}

async function kirimSinyalKeluar() {
  const sid = ambilSessionIdPengunjung();
  try {
    // sendBeacon lebih andal saat tab benar-benar ditutup dibanding fetch biasa
    const url = `${SUPABASE_URL}/rest/v1/pengunjung_online?session_id=eq.${encodeURIComponent(sid)}`;
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    };

    if (navigator.sendBeacon) {
      // sendBeacon tidak mendukung method DELETE atau header custom secara langsung,
      // jadi tetap pakai fetch dengan keepalive sebagai jalur utama, sendBeacon jadi
      // cadangan kalau browser benar-benar menutup konteks sebelum fetch selesai.
      fetch(url, { method: "DELETE", headers, keepalive: true }).catch(() => {});
    } else {
      fetch(url, { method: "DELETE", headers, keepalive: true }).catch(() => {});
    }
  } catch (err) {
    // Diam saja; kalau gagal, baris akan dianggap basi otomatis setelah 40 detik
  }
}

// Hitung jumlah pengunjung yang benar-benar masih online (denyut < 40 detik lalu)
// dan sekalian bersihkan baris-baris basi dari sesi lain yang gagal kirim sinyal keluar.
async function hitungPengunjungOnline() {
  const batasWaktu = new Date(Date.now() - BATAS_BASI_DETIK * 1000).toISOString();

  try {
    // Bersihkan baris basi (best-effort, tidak masalah kalau gagal karena RLS dsb)
    await supabaseClient.from("pengunjung_online").delete().lt("denyut_terakhir", batasWaktu);
  } catch (err) {}

  try {
    const { count, error } = await supabaseClient
      .from("pengunjung_online")
      .select("session_id", { count: "exact", head: true })
      .gte("denyut_terakhir", batasWaktu);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    return null;
  }
}

// Tampilkan & jaga status online di elemen #statusOnlineText
function pasangStatusOnline() {
  const elemen = document.getElementById("statusOnlineText");
  if (!elemen) return;

  async function refreshTampilan() {
    const jumlah = await hitungPengunjungOnline();
    if (jumlah === null) {
      elemen.textContent = "Status online tidak tersedia.";
    } else {
      elemen.textContent = `${jumlah} orang sedang online`;
    }
  }

  // Mulai heartbeat: kirim langsung, lalu ulang tiap 20 detik selagi tab terbuka
  kirimHeartbeat();
  const timerHeartbeat = setInterval(kirimHeartbeat, INTERVAL_HEARTBEAT_MS);

  // Refresh angka yang ditampilkan tiap 5 detik (lebih sering dari heartbeat,
  // biar terasa responsif saat orang lain keluar/masuk)
  refreshTampilan();
  const timerTampilan = setInterval(refreshTampilan, 5000);

  // Kirim sinyal keluar SEGERA saat tab ditutup/dipindah dari halaman ini
  window.addEventListener("pagehide", kirimSinyalKeluar);
  window.addEventListener("beforeunload", kirimSinyalKeluar);

  // Kalau tab disembunyikan lama (pindah aplikasi di HP), tidak langsung
  // dianggap keluar -- heartbeat berhenti otomatis kalau benar-benar ditutup.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      kirimHeartbeat();
      refreshTampilan();
    }
  });
}
