// =======================================================
// AKUN-DASHBOARD.JS
// Menampilkan isi halaman akun.html sesuai role yang login.
// - siswa      -> profil + upload foto profil sendiri
// - penjadwal  -> + fitur update info besok
// - admin      -> + kelola data siswa, kelola jadwal, info storage
// - owner      -> semua fitur admin, akses mutlak
// =======================================================

const NAMA_HARI_DASHBOARD = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const UKURAN_BUCKET_GRATIS_BYTES = 1024 * 1024 * 1024; // 1 GB

async function muatDashboard() {
  const wrapper = document.getElementById("dashboardWrapper");
  const sesi = ambilSesi();

  // Belum login -> tampilkan pesan & arahkan ke login
  if (!sesi) {
    wrapper.innerHTML = `
      <div class="akses-ditolak">
        <h2>Belum Masuk Akun</h2>
        <p>Silakan login dulu untuk mengakses halaman ini.</p>
        <br />
        <a href="login.html" class="btn-login" style="display:inline-block;text-decoration:none;padding:12px 24px;">Ke Halaman Login</a>
      </div>
    `;
    return;
  }

  // ---- KARTU PROFIL (selalu tampil untuk semua role) ----
  let html = `
    <div class="profil-card">
      <div class="profil-foto-wrapper">
        <img id="profilFotoPreview" class="profil-foto" src="${sesi.foto_url || fotoDefault()}" alt="Foto profil" />
        <label for="inputFotoProfil" class="btn-ubah-foto" title="Ganti foto profil">✎</label>
        <input type="file" id="inputFotoProfil" accept="image/*" style="display:none;" />
      </div>
      <div class="profil-info">
        <h2>${escapeHtml(sesi.nama)}</h2>
        <p>@${escapeHtml(sesi.username)}</p>
        <span class="badge-role badge-${sesi.role}">${labelRole(sesi.role)}</span>
        <p class="foto-status" id="fotoStatus"></p>
      </div>
      <button class="btn-logout" id="btnLogout">Keluar</button>
    </div>
  `;

  // ---- FITUR PENJADWAL (muncul untuk role: penjadwal, admin, owner) ----
  if (sesi.role === "penjadwal" || sesi.role === "admin" || sesi.role === "owner") {
    html += `
      <div class="fitur-section">
        <h3>Fitur Penjadwal</h3>
        <div class="fitur-card">
          <h4>Update Info Besok</h4>
          <p class="desc">Tulis info untuk besok (misal baju yang dipakai). Kosongkan lalu simpan untuk menghapus info (tampil "belum ada info").</p>
          <div class="jadwal-form">
            <label for="inputInfoBesok">Info besok</label>
            <textarea id="inputInfoBesok" rows="3" placeholder="Contoh: Baju bebas rapi, bawa alat olahraga"></textarea>
            <button class="btn-simpan" id="btnSimpanInfoBesok">Simpan</button>
            <p class="hint-note" id="infoBesokStatus"></p>
          </div>
        </div>
      </div>
    `;
  }

  // ---- FITUR ADMIN (muncul untuk role: admin, owner) ----
  if (sesi.role === "admin" || sesi.role === "owner") {
    html += `
      <div class="fitur-section">
        <h3>Info Database & Storage</h3>
        <div class="fitur-card">
          <p class="desc" id="infoStorageText">Menghitung pemakaian storage...</p>
          <div class="storage-bar-track">
            <div class="storage-bar-fill" id="storageBarFill" style="width:0%;"></div>
          </div>
        </div>
      </div>

      <div class="fitur-section">
        <h3>Kelola Data Siswa</h3>
        <div class="fitur-card">
          <p class="desc">Ubah nama siswa atau role akun langsung tersimpan ke database.</p>
          <div class="tabel-scroll">
            <table class="tabel-akun" id="tabelKelolaSiswa">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="tbodyKelolaSiswa">
                <tr><td colspan="5">Memuat...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="fitur-section">
        <h3>Kelola Jadwal Pelajaran</h3>
        <div class="fitur-card">
          <p class="desc">Tambah jam pelajaran per hari. Data langsung dipakai di halaman beranda.</p>
          <div class="jadwal-form">
            <label for="pilihHariJadwal">Hari</label>
            <select id="pilihHariJadwal">
              <option value="1">Senin</option>
              <option value="2">Selasa</option>
              <option value="3">Rabu</option>
              <option value="4">Kamis</option>
              <option value="5">Jumat</option>
              <option value="6">Sabtu</option>
            </select>
            <label for="inputJamMulai">Jam mulai</label>
            <input type="text" id="inputJamMulai" placeholder="07.00" />
            <label for="inputJamSelesai">Jam selesai</label>
            <input type="text" id="inputJamSelesai" placeholder="08.20" />
            <label for="inputMapel">Mata pelajaran</label>
            <input type="text" id="inputMapel" placeholder="Matematika" />
            <label for="inputGuru">Nama guru (opsional)</label>
            <input type="text" id="inputGuru" placeholder="Contoh: Budi Santoso, S.Pd" />
            <button class="btn-simpan" id="btnTambahJadwal">Tambah ke Jadwal</button>
            <p class="hint-note" id="jadwalAdminStatus"></p>
          </div>
          <div class="tabel-scroll">
            <table class="tabel-akun" id="tabelJadwalAdmin">
              <thead>
                <tr><th>Hari</th><th>Jam</th><th>Mapel</th><th>Guru</th><th></th></tr>
              </thead>
              <tbody id="tbodyJadwalAdmin">
                <tr><td colspan="4">Memuat...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ---- FITUR OWNER (akses mutlak, ditandai khusus) ----
  if (sesi.role === "owner") {
    html += `
      <div class="fitur-section">
        <h3>Panel Owner</h3>
        <div class="fitur-card">
          <h4>Akses Penuh</h4>
          <p class="desc">Kamu adalah pemilik website ini. Semua fitur admin & penjadwal otomatis tersedia, ditambah kendali penuh atas pengembangan situs (lewat kode & database langsung).</p>
        </div>
      </div>
    `;
  }

  wrapper.innerHTML = html;

  // Pasang event listener setelah HTML dirender
  document.getElementById("btnLogout").addEventListener("click", logout);
  pasangUploadFoto();

  if (sesi.role === "penjadwal" || sesi.role === "admin" || sesi.role === "owner") {
    muatFormInfoBesok();
  }

  if (sesi.role === "admin" || sesi.role === "owner") {
    isiTabelKelolaSiswa();
    muatInfoStorage();
    muatKelolaJadwal();
  }
}

// ---- FOTO PROFIL ----

function fotoDefault() {
  return "https://api.dicebear.com/7.x/initials/svg?backgroundColor=4f9dff&seed=IXH";
}

function pasangUploadFoto() {
  const input = document.getElementById("inputFotoProfil");
  const preview = document.getElementById("profilFotoPreview");
  const status = document.getElementById("fotoStatus");

  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      status.textContent = "Ukuran foto maksimal 2 MB.";
      status.className = "foto-status foto-status-gagal";
      return;
    }

    status.textContent = "Mengunggah foto...";
    status.className = "foto-status";

    try {
      const sesi = ambilSesi();
      const ekstensi = file.name.split(".").pop();
      const namaFile = `${sesi.username}-${Date.now()}.${ekstensi}`;

      const { error: errUpload } = await supabaseClient.storage
        .from("foto-profil")
        .upload(namaFile, file, { upsert: true });

      if (errUpload) throw errUpload;

      const { data: urlData } = supabaseClient.storage
        .from("foto-profil")
        .getPublicUrl(namaFile);

      const fotoUrl = urlData.publicUrl;

      const { error: errUpdate } = await supabaseClient
        .from("akun")
        .update({ foto_url: fotoUrl })
        .eq("id", sesi.id);

      if (errUpdate) throw errUpdate;

      preview.src = fotoUrl;
      perbaruiSesi({ foto_url: fotoUrl });
      status.textContent = "Foto profil berhasil diperbarui.";
      status.className = "foto-status foto-status-sukses";
    } catch (err) {
      status.textContent = "Gagal mengunggah foto. Coba lagi.";
      status.className = "foto-status foto-status-gagal";
    }
  });
}

// ---- INFO BESOK (Penjadwal/Admin/Owner) ----

async function muatFormInfoBesok() {
  const input = document.getElementById("inputInfoBesok");
  const status = document.getElementById("infoBesokStatus");
  const btn = document.getElementById("btnSimpanInfoBesok");

  try {
    const { data, error } = await supabaseClient
      .from("info_besok")
      .select("isi")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    input.value = data && data.isi ? data.isi : "";
  } catch (err) {
    status.textContent = "Gagal memuat info saat ini.";
  }

  btn.addEventListener("click", async () => {
    const sesi = ambilSesi();
    btn.disabled = true;
    status.textContent = "Menyimpan...";

    try {
      const { error } = await supabaseClient
        .from("info_besok")
        .update({
          isi: input.value.trim() === "" ? null : input.value.trim(),
          diisi_oleh: sesi.nama,
          diupdate_pada: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw error;
      status.textContent = "Tersimpan.";
    } catch (err) {
      status.textContent = "Gagal menyimpan. Coba lagi.";
    } finally {
      btn.disabled = false;
    }
  });
}

// ---- KELOLA SISWA (Admin/Owner) ----

async function isiTabelKelolaSiswa() {
  const tbody = document.getElementById("tbodyKelolaSiswa");
  try {
    const daftarAkun = await ambilDaftarAkun();
    tbody.innerHTML = daftarAkun
      .map(
        (akun) => `
        <tr data-id="${akun.id}">
          <td>${akun.no}</td>
          <td><input type="text" value="${escapeHtml(akun.nama)}" class="input-nama-akun" /></td>
          <td>${escapeHtml(akun.username)}</td>
          <td>
            <select class="select-role-akun">
              <option value="siswa" ${akun.role === "siswa" ? "selected" : ""}>Siswa</option>
              <option value="penjadwal" ${akun.role === "penjadwal" ? "selected" : ""}>Penjadwal</option>
              <option value="admin" ${akun.role === "admin" ? "selected" : ""}>Admin</option>
              <option value="owner" ${akun.role === "owner" ? "selected" : ""}>Owner</option>
            </select>
          </td>
          <td><button class="btn-simpan btn-simpan-baris">Simpan</button></td>
        </tr>
      `
      )
      .join("");

    tbody.querySelectorAll(".btn-simpan-baris").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const tr = e.target.closest("tr");
        const id = tr.dataset.id;
        const namaBaru = tr.querySelector(".input-nama-akun").value.trim();
        const roleBaru = tr.querySelector(".select-role-akun").value;

        btn.disabled = true;
        btn.textContent = "...";
        try {
          const { error } = await supabaseClient
            .from("akun")
            .update({ nama: namaBaru, role: roleBaru })
            .eq("id", id);
          if (error) throw error;
          btn.textContent = "Tersimpan";
          setTimeout(() => (btn.textContent = "Simpan"), 1500);
        } catch (err) {
          btn.textContent = "Gagal";
        } finally {
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">Gagal memuat data akun.</td></tr>`;
  }
}

// ---- KELOLA JADWAL (Admin/Owner) ----

async function muatKelolaJadwal() {
  const tbody = document.getElementById("tbodyJadwalAdmin");
  const btnTambah = document.getElementById("btnTambahJadwal");
  const status = document.getElementById("jadwalAdminStatus");

  async function refreshTabelJadwal() {
    try {
      const { data, error } = await supabaseClient
        .from("jadwal_pelajaran")
        .select("id, hari, urutan, jam_mulai, jam_selesai, mapel, guru")
        .order("hari", { ascending: true })
        .order("urutan", { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">Belum ada jadwal.</td></tr>`;
        return;
      }

      tbody.innerHTML = data
        .map(
          (j) => `
        <tr data-id="${j.id}">
          <td>${NAMA_HARI_DASHBOARD[j.hari]}</td>
          <td>${escapeHtml(j.jam_mulai)} - ${escapeHtml(j.jam_selesai)}</td>
          <td>${escapeHtml(j.mapel)}</td>
          <td>${escapeHtml(j.guru || "-")}</td>
          <td><button class="btn-logout btn-hapus-jadwal" style="padding:6px 10px;font-size:0.75rem;">Hapus</button></td>
        </tr>
      `
        )
        .join("");

      tbody.querySelectorAll(".btn-hapus-jadwal").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const tr = e.target.closest("tr");
          const id = tr.dataset.id;
          btn.disabled = true;
          try {
            const { error } = await supabaseClient.from("jadwal_pelajaran").delete().eq("id", id);
            if (error) throw error;
            tr.remove();
          } catch (err) {
            btn.textContent = "Gagal";
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5">Gagal memuat jadwal.</td></tr>`;
    }
  }

  btnTambah.addEventListener("click", async () => {
    const hari = parseInt(document.getElementById("pilihHariJadwal").value, 10);
    const jamMulai = document.getElementById("inputJamMulai").value.trim();
    const jamSelesai = document.getElementById("inputJamSelesai").value.trim();
    const mapel = document.getElementById("inputMapel").value.trim();
    const guru = document.getElementById("inputGuru").value.trim();

    if (!jamMulai || !jamSelesai || !mapel) {
      status.textContent = "Jam mulai, jam selesai, dan mapel wajib diisi.";
      return;
    }

    btnTambah.disabled = true;
    status.textContent = "Menyimpan...";

    try {
      // Cari urutan terakhir untuk hari itu, biar urut otomatis
      const { data: existing, error: errExisting } = await supabaseClient
        .from("jadwal_pelajaran")
        .select("urutan")
        .eq("hari", hari)
        .order("urutan", { ascending: false })
        .limit(1);
      if (errExisting) throw errExisting;

      const urutanBaru = existing && existing.length > 0 ? existing[0].urutan + 1 : 1;

      const { error } = await supabaseClient.from("jadwal_pelajaran").insert({
        hari,
        urutan: urutanBaru,
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai,
        mapel,
        guru: guru || null,
      });
      if (error) throw error;

      document.getElementById("inputJamMulai").value = "";
      document.getElementById("inputJamSelesai").value = "";
      document.getElementById("inputMapel").value = "";
      document.getElementById("inputGuru").value = "";
      status.textContent = "Jadwal ditambahkan.";
      refreshTabelJadwal();
    } catch (err) {
      status.textContent = "Gagal menyimpan jadwal.";
    } finally {
      btnTambah.disabled = false;
    }
  });

  refreshTabelJadwal();
}

// ---- INFO STORAGE (Admin/Owner) ----

async function muatInfoStorage() {
  const teks = document.getElementById("infoStorageText");
  const bar = document.getElementById("storageBarFill");

  try {
    const { data, error } = await supabaseClient.storage.from("foto-profil").list("", {
      limit: 1000,
    });
    if (error) throw error;

    const totalBytes = (data || []).reduce((sum, f) => {
      return sum + (f.metadata && f.metadata.size ? f.metadata.size : 0);
    }, 0);

    const persen = Math.min(100, (totalBytes / UKURAN_BUCKET_GRATIS_BYTES) * 100);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

    teks.textContent = `Storage terpakai: ${totalMB} MB dari 1024 MB (1 GB) — ${(data || []).length} file terupload (foto profil).`;
    bar.style.width = persen.toFixed(1) + "%";
    if (persen > 80) bar.style.backgroundColor = "#ff6b6b";
  } catch (err) {
    teks.textContent = "Gagal menghitung pemakaian storage.";
  }
}

// Utilitas kecil biar teks dari data gak bikin masalah HTML
function escapeHtml(teks) {
  const div = document.createElement("div");
  div.textContent = teks;
  return div.innerHTML;
}
