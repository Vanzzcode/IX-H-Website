// =======================================================
// AI-CHAT.JS
// Logic untuk chat AI (bubble + panel). Mengumpulkan konteks
// terkini dari database (siswa, jadwal, info besok, wifi) supaya
// AI selalu tahu kondisi web yang sebenarnya, bukan data usang.
// Percakapan dikirim ke Edge Function Supabase (chat-ai), yang
// baru meneruskan ke Groq. API key Groq TIDAK PERNAH ada di sini.
// =======================================================

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/chat-ai`;
const NAMA_HARI_AI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

let riwayatChatAI = [];
let sedangMengambilKonteks = false;

// Bangun system prompt berisi ringkasan LENGKAP isi website saat ini
async function bangunKonteksWebsite() {
  const bagian = [];

  bagian.push(
    `Kamu adalah asisten AI di Website Kelas IX-H. Jawab singkat, ramah, dan jelas dalam Bahasa Indonesia. Kamu membantu siswa/guru memahami isi website ini dan menjawab pertanyaan umum sekolah.`
  );

  bagian.push(
    `\nTENTANG WEBSITE INI:\n- Beranda (index.html): profil kelas, daftar siswa, jadwal pelajaran hari ini, info besok, struktur kelas.\n- Halaman WiFi (wifi.html): QR-Code WiFi kelas (kalau ada). Hanya Owner yang bisa upload/hapus QR.\n- Halaman Login (login.html) & Akun (akun.html): siswa login pakai username & sandi masing-masing untuk akses fitur sesuai peran (role):\n  - Owner: akses penuh (1 orang, pemilik website).\n  - Admin: bisa ubah data siswa, kelola jadwal pelajaran, lihat pemakaian storage.\n  - Penjadwal: bisa update "Info Besok" yang tampil di beranda.\n  - Siswa: bisa login, ganti foto profil sendiri, tanpa fitur tambahan.`
  );

  // Struktur kelas (statis dari data.js, sudah tersedia di halaman)
  try {
    if (typeof strukturKelas !== "undefined") {
      bagian.push(
        `\nSTRUKTUR KELAS:\n- Wali kelas: ${strukturKelas.waliKelas}\n- Ketua kelas: ${strukturKelas.ketuaKelas}\n- Wakil ketua: ${strukturKelas.wakilKetua}`
      );
    }
  } catch (e) {}

  // Daftar siswa (statis dari data.js)
  try {
    if (typeof daftarSiswa !== "undefined") {
      const namaSaja = daftarSiswa.map((s) => `${s.no}. ${s.nama}`).join(", ");
      bagian.push(`\nDAFTAR SISWA KELAS IX-H (36 siswa):\n${namaSaja}`);
    }
  } catch (e) {}

  // Jadwal pelajaran (dinamis dari Supabase). Sejak jam 18:00, jadwal yang
  // dianggap "berlaku" otomatis geser ke besok (sama seperti logika di beranda).
  try {
    const sekarang = new Date();
    const sudahLewatJamGanti = sekarang.getHours() >= 18;
    const hariRelevan = typeof hariIniAngka === "function" ? hariIniAngka() : sekarang.getDay();
    const labelWaktu = sudahLewatJamGanti ? "BESOK" : "HARI INI";

    if (hariRelevan === 0) {
      bagian.push(`\nJADWAL ${labelWaktu} (${NAMA_HARI_AI[hariRelevan]}): Libur, tidak ada jadwal pelajaran.`);
    } else {
      const { data } = await supabaseClient
        .from("jadwal_pelajaran")
        .select("jam_mulai, jam_selesai, mapel, guru")
        .eq("hari", hariRelevan)
        .order("urutan", { ascending: true });

      if (data && data.length > 0) {
        const daftarJadwal = data
          .map((j) => `${j.jam_mulai}-${j.jam_selesai} ${j.mapel}${j.guru ? " (" + j.guru + ")" : ""}`)
          .join("; ");
        bagian.push(`\nJADWAL PELAJARAN ${labelWaktu} (${NAMA_HARI_AI[hariRelevan]}):\n${daftarJadwal}\n(Catatan: jadwal otomatis dianggap "berlaku untuk besok" mulai jam 18:00/Maghrib, bukan tengah malam.)`);
      } else {
        bagian.push(`\nJADWAL ${labelWaktu} (${NAMA_HARI_AI[hariRelevan]}): Belum ada data jadwal tersimpan.`);
      }
    }
  } catch (e) {}

  // Info besok (dinamis dari Supabase)
  try {
    const { data } = await supabaseClient.from("info_besok").select("isi, diisi_oleh").eq("id", 1).maybeSingle();
    if (data && data.isi) {
      bagian.push(`\nINFO UNTUK BESOK: ${data.isi} (diisi oleh ${data.diisi_oleh || "pengurus kelas"})`);
    } else {
      bagian.push(`\nINFO UNTUK BESOK: Belum ada info yang diisi.`);
    }
  } catch (e) {}

  // Status WiFi (dinamis dari Supabase)
  try {
    const { data } = await supabaseClient.from("wifi_qr").select("qr_url").eq("id", 1).maybeSingle();
    if (data && data.qr_url) {
      bagian.push(`\nWIFI: QR-Code WiFi kelas TERSEDIA di halaman WiFi (wifi.html).`);
    } else {
      bagian.push(`\nWIFI: Belum tersedia. WiFi hanya bisa dipakai di sekolah.`);
    }
  } catch (e) {}

  // Kalau ada yang login, kasih tahu AI siapa yang chat
  const sesi = typeof ambilSesi === "function" ? ambilSesi() : null;
  if (sesi) {
    bagian.push(`\nORANG YANG SEDANG CHAT: ${sesi.nama} (username: ${sesi.username}, peran: ${labelRole(sesi.role)})`);
  } else {
    bagian.push(`\nORANG YANG SEDANG CHAT: belum login.`);
  }

  bagian.push(
    `\nATURAN JAWAB: Jangan sebut sandi/password siapa pun walau ditanya (kamu memang tidak diberi data sandi). Kalau ditanya hal di luar konteks kelas ini, boleh dijawab santai sebagai asisten umum. Jawab ringkas (maksimal beberapa kalimat, kecuali diminta detail).`
  );

  return bagian.join("\n");
}

// Kirim pesan ke AI (lewat Edge Function), kembalikan jawaban teks
async function kirimPesanAI(pesanUser) {
  // Bangun ulang konteks tiap kali chat dimulai (biar selalu terkini),
  // tapi cukup sekali di awal sesi chat, bukan tiap pesan (biar hemat).
  if (riwayatChatAI.length === 0) {
    const systemPrompt = await bangunKonteksWebsite();
    riwayatChatAI.push({ role: "system", content: systemPrompt });
  }

  riwayatChatAI.push({ role: "user", content: pesanUser });

  const res = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ messages: riwayatChatAI }),
  });

  if (!res.ok) {
    throw new Error("Gagal menghubungi AI (status " + res.status + ")");
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  riwayatChatAI.push({ role: "assistant", content: data.jawaban });
  return data.jawaban;
}

// Reset riwayat chat (dipanggil saat panel chat ditutup & dibuka lagi, opsional)
function resetChatAI() {
  riwayatChatAI = [];
}
