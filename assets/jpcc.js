/* JPCC Worship People: penghubung halaman GitHub Pages dengan Google Sheet (lewat web app Apps Script, tanpa login). */
(function () {
  var API = "https://script.google.com/macros/s/AKfycbyif8RHAvE2yWnyPz6f8KaVPpGOcOsfaD1rlLuKDNS_ZmCkbvY1IZWI58jGfyPxqrTg/exec";

  function kirim(fn, args) {
    return fetch(API, { method: 'POST', body: JSON.stringify({ fn: fn, args: args }) })
      .then(function (r) { if (!r.ok) throw new Error('Server tidak menjawab (' + r.status + ').'); return r.json(); })
      .catch(function (e) { throw new Error(e && /JSON|server|fetch|network|Load failed/i.test(e.message) ? 'Koneksi terputus. Cek internet, lalu coba lagi.' : (e && e.message) || e); })
      .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || 'Gagal diproses. Coba lagi.'); return j.r; });
  }

  // pengganti google.script.run: google.script.run.withSuccessHandler(f).withFailureHandler(g).namaFungsi(arg...)
  function pelari(sukses, gagal) {
    return new Proxy({}, {
      get: function (_, k) {
        if (k === 'withSuccessHandler') return function (f) { return pelari(f, gagal); };
        if (k === 'withFailureHandler') return function (f) { return pelari(sukses, f); };
        if (k === 'withUserObject') return function () { return pelari(sukses, gagal); };
        if (typeof k !== 'string' || k === 'then') return undefined;
        return function () {
          var args = Array.prototype.slice.call(arguments);
          kirim(k, args).then(function (r) { if (sukses) sukses(r); }, function (e) { if (gagal) gagal(e); else console.error(e); });
        };
      }
    });
  }
  window.google = { script: {} };
  Object.defineProperty(window.google.script, 'run', { get: function () { return pelari(null, null); } });

  function param() {
    var q = new URLSearchParams(location.search), o = {};
    ['mode', 'm', 'b', 't'].forEach(function (k) { o[k] = q.get(k) || ''; });
    return o;
  }

  function jalankan() {
    var asal = document.getElementById('jpcc-app'), s = document.createElement('script');
    s.text = asal.textContent;
    document.body.appendChild(s);
  }

  function mulai(hal) {
    var lapis = document.getElementById('jpcc-muat'), teks = lapis.querySelector('.jm-teks'), ulang = lapis.querySelector('.jm-ulang');
    var awal = teks.textContent, coba = 0, lama;
    var muat = function () {
      coba++;
      lapis.classList.remove('gagal'); ulang.hidden = true; teks.textContent = awal;
      clearTimeout(lama);
      lama = setTimeout(function () { teks.textContent = 'Masih memuat, sebentar lagi…'; }, 7000);
      fetch(API + '?api=' + encodeURIComponent(hal))
        .then(function (r) { if (!r.ok) throw new Error('Server tidak menjawab (' + r.status + ').'); return r.json(); })
        .then(function (j) {
          if (!j || !j.ok) throw new Error((j && j.error) || 'Data belum bisa dimuat.');
          clearTimeout(lama);
          window.__DATA__ = j.data;
          window.__PARAM__ = param();
          jalankan();
          lapis.classList.add('selesai');
          setTimeout(function () { lapis.remove(); }, 250);
        })
        .catch(function (e) {
          clearTimeout(lama);
          if (coba < 2) { setTimeout(muat, 1500); return; }
          lapis.classList.add('gagal');
          teks.textContent = 'Halaman belum bisa dimuat. ' + (e && e.message && !/JSON|fetch|network|Load failed/i.test(e.message) ? e.message : 'Cek koneksi internet, lalu coba lagi.');
          ulang.hidden = false;
        });
    };
    ulang.addEventListener('click', function () { coba = 0; muat(); });
    muat();
  }

  window.JPCC = { mulai: mulai, kirim: kirim, api: API };   // api: link web app (dipakai tombol Simpan ke kalender HP)
})();
