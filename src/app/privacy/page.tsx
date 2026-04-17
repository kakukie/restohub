import React from 'react'

export const metadata = {
  title: 'Kebijakan Privasi - Meenuin',
  description: 'Kebijakan privasi dan pelindungan data pribadi pengguna Meenuin sesuai UU PDP.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Kebijakan <span className="text-[#3B82F6]">Privasi</span>
          </h1>
          <p className="text-slate-400">Sesuai dengan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</p>
          <p className="text-slate-500 text-sm">Terakhir diperbarui: 17 April 2026</p>
        </header>

        <section className="bg-[#1A2235] border border-[#2A344A] p-8 rounded-3xl space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Informasi yang Kami Kumpulkan
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Kami mengumpulkan data pribadi yang Anda berikan secara sukarela saat mendaftar, menggunakan layanan kami, atau menghubungi tim dukungan kami. Data tersebut meliputi namun tidak terbatas pada:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Nama lengkap, alamat email, dan nomor telepon.</li>
              <li>Informasi bisnis (nama restoran, alamat, detail operasional).</li>
              <li>Data transaksi dan riwayat pemesanan.</li>
              <li>Informasi teknis (alamat IP, jenis perangkat, browser).</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Tujuan Pemrosesan Data
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Sesuai dengan prinsip UU PDP, kami memproses data Anda hanya untuk tujuan yang sah, antara lain:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Menyediakan, mengelola, dan meningkatkan layanan Meenuin.</li>
              <li>Memproses transaksi pembayaran dan pendaftaran merchant.</li>
              <li>Mengirimkan informasi administratif, pembaruan keamanan, dan notifikasi layanan.</li>
              <li>Mematuhi kewajiban hukum dan regulasi yang berlaku di Indonesia.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Hak Anda sebagai Subjek Data
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Berdasarkan UU PDP, Anda memiliki hak-hak berikut terkait data pribadi Anda:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li><strong>Hak untuk Mengakses:</strong> Anda berhak mendapatkan informasi tentang pemrosesan data Anda.</li>
              <li><strong>Hak untuk Memperbaiki:</strong> Anda berhak melengkapi atau memperbarui data yang tidak akurat.</li>
              <li><strong>Hak untuk Menghapus:</strong> Anda berhak meminta penghapusan data (right to be forgotten) dalam kondisi tertentu.</li>
              <li><strong>Hak untuk Menarik Persetujuan:</strong> Anda berhak menarik kembali persetujuan pemrosesan data yang sebelumnya diberikan.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Keamanan dan Penyimpanan Data
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Kami menerapkan standar keamanan teknis dan organisasi yang ketat untuk melindungi data pribadi Anda dari akses yang tidak sah, kehilangan, atau kerusakan. Data Anda disimpan di server yang aman dan kami menggunakan enkripsi untuk data sensitif.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Kontak Pelindungan Data
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Jika Anda memiliki pertanyaan mengenai kebijakan ini atau ingin menggunakan hak Anda sebagai subjek data, silakan hubungi Petugas Pelindungan Data (DPO) kami melalui:
            </p>
            <p className="text-white font-semibold">Email: privacy@meenuin.biz.id</p>
          </div>
        </section>

        <footer className="text-center text-slate-500 text-sm">
          <p>&copy; 2026 Meenuin. Sesuai Regulasi Pelindungan Data Pribadi Indonesia.</p>
        </footer>
      </div>
    </div>
  )
}
