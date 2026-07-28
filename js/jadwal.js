// =======================================================
// JADWAL.JS
// Menampilkan jadwal pelajaran hari ini (otomatis ganti sesuai
// hari berjalan) dan info besok (bisa diisi Penjadwal/Admin/Owner).
// =======================================================

const NAMA_HARI = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

// Ambil nomor hari sekarang: 1=Senin ... 6=Sabtu, 0=Minggu
function hariIniAngka() {
  return new Date().getDay();
}

// Tampilkan jadwal pelajaran hari ini di elemen #jadwalContainer
async function tampilkanJadwalHariIni() {
  const container = document.getElementById("jadwalContainer");
  const judulHari = document.getElementById("judulHariJadwal");
  if (!container) return;

  const hari = hariIniAngka();
  judulHari.textContent = `Jadwal Hari ${NAMA_HARI[hari]}`;

  // Weekend (Minggu) -> tidak ada jadwal
  if (hari === 0) {
    container.innerHTML = `<p class="jadwal-kosong">Hari ini libur, tidak ada jadwal pelajaran.</p>`;
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("jadwal_pelajaran")
      .select("urutan, jam_mulai, jam_selesai, mapel, guru")
      .eq("hari", hari)
      .order("urutan", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `<p class="jadwal-kosong">Belum ada jadwal untuk hari ini.</p>`;
      return;
    }

    container.innerHTML = `
      <table class="tabel-jadwal">
        <thead>
          <tr>
            <th>Jam</th>
            <th>Mata Pelajaran</th>
            <th>Guru</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (j) => `
            <tr>
              <td>${j.jam_mulai} - ${j.jam_selesai}</td>
              <td>${escapeHtmlJadwal(j.mapel)}</td>
              <td>${escapeHtmlJadwal(j.guru || "-")}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<p class="jadwal-kosong">Gagal memuat jadwal. Coba muat ulang halaman.</p>`;
  }
}

// Tampilkan info besok di elemen #infoBesokContainer
async function tampilkanInfoBesok() {
  const container = document.getElementById("infoBesokContainer");
  if (!container) return;

  try {
    const { data, error } = await supabaseClient
      .from("info_besok")
      .select("isi, diisi_oleh, diupdate_pada")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    if (!data || !data.isi || data.isi.trim() === "") {
      container.innerHTML = `<p class="jadwal-kosong">Belum ada info.</p>`;
      return;
    }

    const tanggal = data.diupdate_pada
      ? new Date(data.diupdate_pada).toLocaleString("id-ID", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    container.innerHTML = `
      <p class="info-besok-isi">${escapeHtmlJadwal(data.isi)}</p>
      <p class="info-besok-meta">${data.diisi_oleh ? "Diisi oleh " + escapeHtmlJadwal(data.diisi_oleh) : ""}${tanggal ? " • " + tanggal : ""}</p>
    `;
  } catch (err) {
    container.innerHTML = `<p class="jadwal-kosong">Gagal memuat info besok.</p>`;
  }
}

function escapeHtmlJadwal(teks) {
  const div = document.createElement("div");
  div.textContent = teks;
  return div.innerHTML;
}
