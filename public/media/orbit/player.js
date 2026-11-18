// Orbit player: native HLS on Safari/iOS, hls.js everywhere else.
(function () {
  var v = document.getElementById('v');
  if (!v) return;
  var src = '/media/orbit/master.m3u8';
  if (v.canPlayType('application/vnd.apple.mpegurl')) {
    v.src = src;
  } else if (window.Hls && Hls.isSupported()) {
    var hls = new Hls({ capLevelToPlayerSize: true });
    hls.loadSource(src);
    hls.attachMedia(v);
  }
  v.addEventListener('play', function () { document.body.classList.add('playing'); });
  v.addEventListener('pause', function () { document.body.classList.remove('playing'); });
})();
