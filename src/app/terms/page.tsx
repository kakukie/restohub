import React from 'react'

export const metadata = {
  title: 'Syarat dan Ketentuan - RestoHub',
  description: 'Syarat dan ketentuan penggunaan platform RestoHub.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Syarat dan <span className="text-[#10B981]">Ketentuan</span>
          </h1>
          <p className="text-slate-400">Terakhir diperbarui: 17 April 2026</p>
        </header>

        <section className="bg-[#1A2235] border border-[#2A344A] p-8 rounded-3xl space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-sm font-bold">1</span>
              Ketentuan Umum
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Selamat datang di RestoHub. Dengan mengakses dan menggunakan platform kami, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. RestoHub adalah platform SaaS (Software as a Service) yang menyediakan solusi manajemen restoran digital, termasuk menu QR, sistem POS, dan manajemen stok.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-sm font-bold">2</span>
              Pendaftaran Akun
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Untuk menggunakan layanan tertentu, Anda wajib mendaftarkan akun. Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun dan password Anda. Setiap aktivitas yang dilakukan menggunakan akun Anda dianggap sebagai tanggung jawab Anda sepenuhnya.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-sm font-bold">3</span>
              Layanan dan Biaya
            </h2>
            <p className="text-slate-400 leading-relaxed">
              RestoHub menyediakan berbagai paket berlangganan. Biaya layanan akan dikenakan sesuai dengan paket yang dipilih. Kami berhak mengubah biaya layanan atau struktur paket dengan pemberitahuan terlebih dahulu kepada pengguna.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-sm font-bold">4</span>
              Kewajiban Merchant
            </h2>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Memberikan informasi restoran yang akurat dan legal.</li>
              <li>Menjamin bahwa semua menu dan harga yang ditampilkan adalah benar.</li>
              <li>Bertanggung jawab atas transaksi yang dilakukan dengan pelanggan.</li>
              <li>Mematuhi peraturan perundang-undangan yang berlaku di Indonesia terkait bisnis kuliner.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-sm font-bold">5</span>
              Kebijakan Pembayaran
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Pembayaran langganan dilakukan di muka. Kami menggunakan penyedia layanan pembayaran pihak ketiga yang aman. Pengembalian dana (refund) hanya akan dipertimbangkan dalam kasus kegagalan sistem yang signifikan yang tidak dapat diperbaiki dalam waktu wajar.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-sm font-bold">6</span>
              Hukum yang Berlaku
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Syarat dan Ketentuan ini diatur dan tunduk pada hukum Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan terlebih dahulu melalui musyawarah untuk mufakat, dan jika tidak tercapai, akan diselesaikan melalui Pengadilan Negeri Jakarta.
            </p>
          </div>
        </section>

        <footer className="text-center text-slate-500 text-sm">
          <p>&copy; 2026 RestoHub by Meenuin. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
