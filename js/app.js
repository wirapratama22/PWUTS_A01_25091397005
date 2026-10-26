$(function () {
  var KEY = 'copykuy_pesanan_wira';
  var STATUS = ['Menunggu', 'Diproses', 'Selesai'];
  var SEED = [
    { kode: 'CK-001', nama: 'Andi Saputra', layanan: 'Fotokopi A4 BW, 50 hal x 2', total: 30000, status: 'Menunggu', lunas: false },
    { kode: 'CK-002', nama: 'Siti Nurhaliza', layanan: 'Print A4 Warna, 10 hal x 1', total: 15000, status: 'Diproses', lunas: true },
    { kode: 'CK-003', nama: 'Budi Santoso', layanan: 'Print A4 BW 80 hal + jilid spiral', total: 47000, status: 'Selesai', lunas: true },
    { kode: 'CK-004', nama: 'Dewi Lestari', layanan: 'Fotokopi F4 BW, 100 hal x 3', total: 105000, status: 'Menunggu', lunas: false },
    { kode: 'CK-005', nama: 'Rizky Pratama', layanan: 'Print A4 BW, 30 hal x 2', total: 30000, status: 'Diproses', lunas: false },
    { kode: 'CK-006', nama: 'Maya Putri', layanan: 'Fotokopi A3 BW, 5 hal x 1', total: 5000, status: 'Selesai', lunas: false }
  ];
  var data, filter = 'Semua';

  function load() {
    try { var d = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(d)) return d; } catch (e) {}
    return JSON.parse(JSON.stringify(SEED));
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
  data = load();

  function rp(n) { return 'Rp' + Number(n).toLocaleString('id-ID'); }
  function esc(s) { return $('<div>').text(s).html(); }
  function find(k) { k = $.trim(k).toUpperCase(); return data.filter(function (o) { return o.kode === k; })[0]; }
  function count(s) { return data.filter(function (o) { return s === 'Semua' || o.status === s; }).length; }

  /* ---------- Dashboard ---------- */
  function renderStats() {
    var belum = data.filter(function (o) { return !o.lunas; }).length;
    var items = [['Total pesanan', count('Semua')], ['Menunggu', count('Menunggu')], ['Diproses', count('Diproses')], ['Selesai', count('Selesai')], ['Belum lunas', belum]];
    $('#stats').html(items.map(function (i) { return '<div class="stat"><b>' + i[1] + '</b><span>' + i[0] + '</span></div>'; }).join(''));
  }

  /* ---------- 2.b Filter antrean ---------- */
  function renderQueue() {
    if (!$('#antrean-body').length) return;
    $('#filters').html(['Semua'].concat(STATUS).map(function (s) {
      return '<button class="chip' + (s === filter ? ' on' : '') + '" data-f="' + s + '">' + s + ' (' + count(s) + ')</button>';
    }).join(''));
    var rows = data.filter(function (o) { return filter === 'Semua' || o.status === filter; });
    if (!rows.length) { $('#antrean-body').html('<tr><td colspan="7">Tidak ada pesanan berstatus ' + filter + '.</td></tr>'); return; }
    $('#antrean-body').html(rows.map(function (o) {
      var i = STATUS.indexOf(o.status), nxt = STATUS[i + 1];
      var aksi = nxt ? '<button class="btn sm btn-next" data-k="' + o.kode + '">Jadikan ' + nxt + '</button>' : '-';
      return '<tr><td data-l="Kode"><b>' + o.kode + '</b></td><td data-l="Pelanggan">' + esc(o.nama) + '</td><td data-l="Layanan">' + esc(o.layanan) + '</td>' +
        '<td data-l="Total">' + rp(o.total) + '</td><td data-l="Status"><span class="badge s-' + o.status + '">' + o.status + '</span></td>' +
        '<td data-l="Bayar"><span class="badge ' + (o.lunas ? 'p-Lunas">Lunas' : 'p-Belum">Belum') + '</span></td><td data-l="Aksi">' + aksi + '</td></tr>';
    }).join(''));
  }
  $(document).on('click', '.chip', function () { filter = $(this).data('f'); renderQueue(); });
  $(document).on('click', '.btn-next', function () {
    var o = find($(this).data('k'));
    if (o && STATUS.indexOf(o.status) < STATUS.length - 1) { o.status = STATUS[STATUS.indexOf(o.status) + 1]; save(); renderQueue(); renderStats(); }
  });
  $(document).on('click', '#btn-reset', function () {
    data = JSON.parse(JSON.stringify(SEED)); save(); filter = 'Semua'; renderQueue(); renderStats();
  });

  /* ---------- 2.c Form pembayaran tunai ---------- */
  function renderForm() {
    if (!$('#form-transaksi').length) return;
    var belum = data.filter(function (o) { return !o.lunas; });
    $('#belum-lunas').text(belum.length ? belum.map(function (o) { return o.kode; }).join(', ') : 'tidak ada');
    $('#daftar-id').html(belum.map(function (o) { return '<option value="' + o.kode + '">'; }).join(''));
    $('#tanggal-bayar').val(new Date().toISOString().slice(0, 10));
  }
  function err(id, msg) { $('.err[data-for="' + id + '"]').text(msg || ''); $('#' + id).toggleClass('bad', !!msg); }
  function hitung() {
    var o = find($('#id-pesanan').val());
    $('#tagihan').val(o && !o.lunas ? rp(o.total) : '');
    var uang = parseInt($('#uang').val(), 10);
    $('#kembalian').val(o && !o.lunas && !isNaN(uang) && uang >= o.total ? rp(uang - o.total) : '');
  }
  $(document).on('input', '#id-pesanan, #uang', hitung);

  $(document).on('submit', '#form-transaksi', function (e) {
    e.preventDefault();
    var ok = true, o = find($('#id-pesanan').val());
    var tgl = $('#tanggal-bayar').val(), raw = $.trim($('#uang').val()), uang = Number(raw);
    err('id-pesanan'); err('tanggal-bayar'); err('uang'); $('#hasil').prop('hidden', true);

    if (!$.trim($('#id-pesanan').val())) { err('id-pesanan', 'ID pesanan wajib diisi.'); ok = false; }
    else if (!o) { err('id-pesanan', 'ID pesanan tidak ditemukan. Gunakan format CK-001.'); ok = false; }
    else if (o.lunas) { err('id-pesanan', 'Pesanan ' + o.kode + ' sudah lunas.'); ok = false; }
    if (!tgl) { err('tanggal-bayar', 'Tanggal bayar wajib diisi.'); ok = false; }
    if (raw === '' || isNaN(uang)) { err('uang', 'Uang diterima wajib berupa angka.'); ok = false; }
    else if (o && !o.lunas && uang < o.total) { err('uang', 'Uang kurang ' + rp(o.total - uang) + ' dari tagihan ' + rp(o.total) + '.'); ok = false; }
    if (!ok) return;

    /* Lolos validasi. Untuk kirim ke server HTTP: this.submit() atau $.post($(this).attr('action'), $(this).serialize()) */
    o.lunas = true; o.tglBayar = tgl; save();
    $('#hasil').html('<b>Pembayaran ' + o.kode + ' tersimpan.</b><br>Tagihan ' + rp(o.total) + ' &middot; Diterima ' + rp(uang) + ' &middot; Kembalian <b>' + rp(uang - o.total) + '</b>').prop('hidden', false);
    this.reset(); renderForm(); renderStats();
  });

  /* ---------- Navigasi AJAX ---------- */
  function muat(url) {
    $('#main-content').load(url, function (_, status) {
      if (status === 'error') { $(this).text('Konten gagal dimuat. Jalankan lewat localhost / Live Server.'); return; }
      renderQueue(); renderForm();
    });
  }
  $('.nav-ajax').on('click', function (e) {
    e.preventDefault();
    $('.nav-ajax').removeClass('active'); $(this).addClass('active');
    $('#menu').removeClass('open'); $('#burger').attr('aria-expanded', 'false');
    muat($(this).attr('href'));
  });
  $('#burger').on('click', function () { $(this).attr('aria-expanded', $('#menu').toggleClass('open').hasClass('open')); });

  renderStats();
  muat('views/interaktif.html');
});
