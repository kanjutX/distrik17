# 🎮 DISTRIK 17 — Roblox Development Hub

Website resmi pelacakan status pengembangan game Roblox **"Distrik 17"** (Tema Tawuran & Gelut Anak SMA Berandal Indonesia).

Stack: **React 19 + Vite + TypeScript + Tailwind v4**, API serverless di **Vercel Functions**, database **Vercel Postgres**.

---

## 🖼️ Soal style background & logo

- Background texture (`public/bg-texture.webp`) dipasang sebagai **satu layer `position: fixed` yang membentang dari atas sampai bawah halaman** (lihat `.site-bg` di `src/index.css`), bukan ditempel per-section — jadi alurnya menyatu top-to-bottom pas discroll, dengan gradient gelap di bagian bawah biar section terbaca.
- Logo (`public/logo-distrik17.png`) **dirender terpisah** sebagai elemen `<img>` sendiri di Navbar, Hero, dan Footer — tidak digabung jadi satu file dengan background lagi.

Mau ganti warna/tema? Edit token di `@theme` dalam `src/index.css` (`--color-blood`, `--color-ink`, dll).

---

## 🚀 Deploy ke Vercel

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "feat: Distrik 17 Hub v2 — auth, like, database wiring"
git branch -M main
git remote add origin https://github.com/USERNAME-ANDA/distrik-17-hub.git
git push -u origin main
```

### 2. Deploy
1. Masuk [vercel.com](https://vercel.com), **Add New → Project**, pilih repo-nya.
2. Framework otomatis terdeteksi **Vite**. Klik **Deploy**.

### 3. Sambungkan Vercel Postgres
1. Di halaman project Vercel, tab **Storage → Create Database → Postgres**.
2. Beri nama (misal `distrik17-db`), pilih region terdekat (`Singapore (sin1)`), **Create & Continue**, lalu **Connect** ke project ini.
3. Vercel otomatis inject `POSTGRES_URL` dkk ke environment variables — tidak perlu copy-paste manual.
4. Tabel dibuat **otomatis** saat endpoint API pertama kali dipanggil (lihat `api/_lib/db.ts`). Menjalankan `schema.sql` manual di tab Query itu opsional, bukan wajib.

### 4. Set environment variables lain
Di **Settings → Environment Variables**, tambahkan dari `.env.example`:
- `JWT_SECRET` — string acak panjang, wajib diisi sendiri (jangan pakai default).
- `VITE_APP_TITLE`, `VITE_ROBLOX_GAME_ID`, `VITE_DISCORD_INVITE` — info publik.

### 5. Jadikan akun kamu Owner
Registrasi akun pertama lewat tombol **"Gabung Geng"** di situs, lalu di tab **Storage → Query**:
```sql
UPDATE users SET role = 'owner' WHERE email = 'email-kamu@contoh.com';
```
Akun owner bisa post Devlog/Changelog dan update Milestone langsung dari UI.

---

## 💎 Fitur

| Fitur | Status |
|---|---|
| Roadmap & Milestones (progress bar real-time) | ✅ |
| Owner Devlog & Changelog (form posting langsung dari web) | ✅ |
| Review & Feedback komunitas (rating bintang + kategori) | ✅ |
| Sistem Like per-review — dibatasi 1x per akun lewat tabel `review_likes` | ✅ |
| Autentikasi (Register/Login/JWT) | ✅ |
| Dukungan Kas Tongkrongan dengan leaderboard top 3 supporter | ✅ |
| Tema noir-grafiti, background top-to-bottom terpisah dari logo, glow + grit layer tambahan | ✅ |
| **Countdown Rilis** — fase & tanggal diset owner; kalau tanggal belum diisi, otomatis tampil `00 00 00 00` + ikon jam pasir, bukan error/kosong | ✅ baru |
| **Pengumuman** — CRUD penuh (tambah/edit/hapus/pin) oleh owner, 3 level (info/peringatan/event) | ✅ baru |
| **Link Donasi** — diisi owner lewat Panel Admin, tombol donasi otomatis muncul/hilang di section Kas | ✅ baru |
| **Identitas & Arsip** — tanpa cuplikan gameplay (anti-spoiler): avatar builder "bohongan" (emoji-layer, client-side) + minigame gacha kosmetik yang hasilnya kesimpen per akun | ✅ baru |
| **Profil User** — ganti title & foto profil (pilih preset atau upload PNG/JPG, dikompres otomatis di browser sebelum diupload) | ✅ baru |
| **Kaitkan Akun Roblox** — verifikasi aman tanpa password: user taruh kode unik di bio Roblox publik, server cek lewat API publik Roblox (`users.roblox.com`) | ✅ baru |
| **Statistik Kill/Death** — tampilan sudah jadi di Profil (kolom `kills`/`deaths` di tabel `users`); belum ada API yang nulis ke kolom itu dari game-nya sendiri | 🟡 tampilan siap, nunggu integrasi game |
| **Panel Admin** — satu tempat buat owner atur fase rilis, tanggal rilis, dan link donasi | ✅ baru |
| **Form Milestone owner** — tambah/edit/hapus milestone langsung dari section Roadmap (sebelumnya cuma bisa lewat API) | ✅ baru |
| **Moderasi** — owner bisa hapus devlog & review; penulis bisa hapus review-nya sendiri | ✅ baru |

### Yang belum ada (di luar scope dasar)
- Pembayaran kas tongkrongan masih dicatat manual lewat form `POST /api/supporters` — belum terhubung ke payment gateway (Midtrans/Saweria API).
- Kolom `kills`/`deaths` di tabel `users` sudah ada dan tampil di Profil, tapi belum ada yang nulis ke sana — itu nunggu endpoint dari sisi game Roblox (misalnya lewat `MessagingService`/HTTP request ke Vercel saat player mati/membunuh). UI-nya sudah siap tinggal disambung.

### Perbaikan bug (v2.0.1)
- **Review nggak lagi bikin respons raksasa** — foto profil upload (base64) dulu ikut ke-embed di tiap review, bisa tembus limit respons Vercel 4.5MB. Sekarang disajikan lewat `/api/users/:id/avatar`, dan title/foto di review selalu ikut profil terbaru.
- **Like**: double-click / 2 tab nggak lagi 500; like ke review yang sudah dihapus balas 404 (bukan error FK). Tombol like nonaktif buat tamu.
- **`POST /api/supporters` sekarang owner-only** — sebelumnya siapa pun bisa nambah entri palsu ke leaderboard.
- **`JWT_SECRET` wajib di production** — nggak ada lagi fallback secret default yang bisa dipakai buat memalsukan token owner.
- **Register/login**: validasi username & email, email case-insensitive, batas password 72 karakter (batas bcrypt).
- **Validasi input** (rating, kategori review, progress/status milestone, tag & isi changelog, link donasi harus http/https, tanggal rilis harus valid) + semua endpoint dibungkus error handler JSON.
- **Gacha**: cooldown dicek atomik di DB (dulu bisa ditembus request paralel).
- **Kode verifikasi Roblox kedaluwarsa 15 menit**; error 429/5xx dari Roblox nggak lagi salah dibaca "username tidak ditemukan"; ada timeout fetch.
- **`ensureSchema` aman dari cold-start race**, dan pool DB dibatasi `max: 3` buat serverless.
- Import `pg` pakai default import + import relatif API pakai ekstensi `.js` supaya aman di mode ESM (`"type": "module"`).
- **Frontend**: spinner nggak nyangkut selamanya kalau API error, foto profil nggak "nyangkut" di preview kalau gagal disimpan, upload file yang sama bisa diulang, countdown nggak nampilin `NaN`, background mobile (3 layer) ukurannya benar.
- **Aset**: `bg-texture.png` 3.3MB → `bg-texture.webp` ±300KB, logo 1.6MB → ±670KB.

### Migrasi database
Semua tabel & kolom baru (`site_settings`, `announcements`, `gacha_pulls`, plus kolom `kills`/`deaths`/`roblox_*` di `users`) dibuat otomatis oleh `ensureSchema()` di `api/_lib/db.ts` — pakai `CREATE TABLE IF NOT EXISTS` dan `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, jadi **aman dideploy ke database yang sudah ada isinya**, nggak perlu query manual.

---

## 🗂️ Struktur
```
src/
  components/   UI sections (Hero, Countdown, Announcements, Roadmap, Changelog,
                 ArchiveIdentity, Reviews, Supporters, AdminSettingsPanel,
                 Navbar, AuthModal, ProfileModal)
  lib/          api client, auth context, shared types
api/
  _lib/         db connection + settings helpers + auth helpers (dipakai semua endpoint)
  auth/         register, login, me
  reviews/      list+create, like
  changelogs/   list+create (owner only)
  milestones/   list+upsert (owner only)
  supporters/   list+create
  settings/     GET (publik) + PUT (owner only) — fase rilis, tanggal rilis, link donasi
  announcements/ list+create, PATCH/DELETE per id (owner only)
  profile/      PATCH title + avatar; roblox/request-code, roblox/verify, roblox/unlink
  gacha/        roll kosmetik + riwayat per user
schema.sql      referensi struktur tabel (dibuat/dimigrasi otomatis juga oleh api/_lib/db.ts)
```

## 🧪 Development lokal
```bash
npm install
vercel dev   # menjalankan frontend + /api functions sekaligus, perlu Vercel CLI + vercel link
```
"# distrik17" 
