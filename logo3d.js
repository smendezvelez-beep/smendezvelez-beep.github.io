/* ===== Logo 3D (Three.js r128). Opcional: si falla, queda el logo estático en CSS ===== */
(function () {
  'use strict';
  var root = document.documentElement;
  var mark = document.getElementById('heroMark');
  var canvas = document.getElementById('bg3d');
  var reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var dead = false;
  var stopLoop = null;

  function fallback() {
    dead = true;
    if (stopLoop) stopLoop();
    root.classList.remove('has-3d');
    root.classList.add('no-3d');
    if (canvas) canvas.style.display = 'none';
  }

  if (!mark || !canvas) return;
  if (reduceMQ && reduceMQ.matches) return fallback();
  var cores = navigator.hardwareConcurrency || 4;
  var memory = navigator.deviceMemory || 4;
  var saveData = navigator.connection && navigator.connection.saveData;
  if (cores <= 2 || memory <= 2 || saveData) return fallback();
  try {
    var probe = document.createElement('canvas');
    if (!window.WebGLRenderingContext || !(probe.getContext('webgl') || probe.getContext('experimental-webgl'))) return fallback();
  } catch (err) { return fallback(); }

  if (reduceMQ) {
    var onChange = function (e) { if (e.matches) fallback(); };
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onChange);
    else if (reduceMQ.addListener) reduceMQ.addListener(onChange);
  }

  function logoUri() {
    var v = getComputedStyle(root).getPropertyValue('--logo-mask');
    var m = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(v);
    return m ? m[1] : null;
  }

  function loadThree() {
    if (dead) return;
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    var timer = window.setTimeout(fallback, 12000);
    s.onload = function () {
      window.clearTimeout(timer);
      if (dead || !window.THREE) return fallback();
      var uri = logoUri();
      if (!uri) return fallback();
      var img = new Image();
      img.onload = function () { try { build(window.THREE, img); } catch (err) { fallback(); } };
      img.onerror = fallback;
      img.src = uri;
    };
    s.onerror = function () { window.clearTimeout(timer); fallback(); };
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') loadThree();
  else window.addEventListener('load', loadThree);

  function boxBlur(src, n, r) {
    var tmp = new Float32Array(n * n), out = new Float32Array(n * n), w = 2 * r + 1, x, y, acc;
    function c(v) { return v < 0 ? 0 : (v > n - 1 ? n - 1 : v); }
    for (y = 0; y < n; y++) {
      acc = 0;
      for (x = -r; x <= r; x++) acc += src[y * n + c(x)];
      for (x = 0; x < n; x++) { tmp[y * n + x] = acc / w; acc += src[y * n + c(x + r + 1)] - src[y * n + c(x - r)]; }
    }
    for (x = 0; x < n; x++) {
      acc = 0;
      for (y = -r; y <= r; y++) acc += tmp[c(y) * n + x];
      for (y = 0; y < n; y++) { out[y * n + x] = acc / w; acc += tmp[c(y + r + 1) * n + x] - tmp[c(y - r) * n + x]; }
    }
    return out;
  }

  // El logo negro solo aporta la forma: su canal alfa se convierte en máscara y en relieve.
  function makeMaps(img) {
    var A = 1024;
    var ca = document.createElement('canvas'); ca.width = ca.height = A;
    var xa = ca.getContext('2d'); xa.drawImage(img, 0, 0, A, A);
    var da = xa.getImageData(0, 0, A, A), p = da.data, i;
    for (i = 0; i < p.length; i += 4) { var a = p[i + 3]; p[i] = p[i + 1] = p[i + 2] = a; p[i + 3] = 255; }
    xa.putImageData(da, 0, 0);

    var N = 512;
    var cn = document.createElement('canvas'); cn.width = cn.height = N;
    var xn = cn.getContext('2d'); xn.drawImage(img, 0, 0, N, N);
    var dn = xn.getImageData(0, 0, N, N), q = dn.data;
    var h = new Float32Array(N * N);
    for (i = 0; i < N * N; i++) h[i] = q[i * 4 + 3] / 255;
    h = boxBlur(boxBlur(h, N, 3), N, 3);
    var k = 4;
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        i = y * N + x;
        var l = h[y * N + Math.max(0, x - 1)], r = h[y * N + Math.min(N - 1, x + 1)];
        var u = h[Math.max(0, y - 1) * N + x], d = h[Math.min(N - 1, y + 1) * N + x];
        var nx = (l - r) * k, ny = (d - u) * k, len = Math.sqrt(nx * nx + ny * ny + 1);
        q[i * 4] = (nx / len * 0.5 + 0.5) * 255;
        q[i * 4 + 1] = (ny / len * 0.5 + 0.5) * 255;
        q[i * 4 + 2] = (1 / len * 0.5 + 0.5) * 255;
        q[i * 4 + 3] = 255;
      }
    }
    xn.putImageData(dn, 0, 0);
    return { alpha: ca, normal: cn };
  }

  function makeEnv(T, renderer) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256;
    var g = c.getContext('2d');
    var grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#0b1830');
    grad.addColorStop(0.38, '#26324a');
    grad.addColorStop(0.48, '#efe2bd');
    grad.addColorStop(0.54, '#d9c58e');
    grad.addColorStop(0.64, '#2f2712');
    grad.addColorStop(1, '#050b17');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
    [[120, 70, 60], [390, 96, 44]].forEach(function (s) {
      var rg = g.createRadialGradient(s[0], s[1], 0, s[0], s[1], s[2]);
      rg.addColorStop(0, 'rgba(255,248,232,0.7)'); rg.addColorStop(1, 'rgba(255,248,232,0)');
      g.fillStyle = rg; g.fillRect(0, 0, 512, 256);
    });
    var tex = new T.CanvasTexture(c);
    tex.mapping = T.EquirectangularReflectionMapping;
    tex.encoding = T.sRGBEncoding;
    var pm = new T.PMREMGenerator(renderer);
    var env = pm.fromEquirectangular(tex).texture;
    tex.dispose(); pm.dispose();
    return env;
  }

  function build(T, img) {
    if (dead) return;
    var renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); fallback(); });

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(28, 1, 0.1, 50);
    camera.position.set(0, 0, 6);

    var env = makeEnv(T, renderer);
    var maps = makeMaps(img);
    var alphaMap = new T.CanvasTexture(maps.alpha);
    alphaMap.generateMipmaps = false;
    alphaMap.minFilter = T.LinearFilter;
    var normalMap = new T.CanvasTexture(maps.normal);

    // Oro satinado, más sobrio que pulido.
    var gold = new T.Color('#C9A84C').convertSRGBToLinear();
    var goldDeep = new T.Color('#715B23').convertSRGBToLinear();
    var face = new T.MeshStandardMaterial({
      color: gold, metalness: 1, roughness: 0.38, envMap: env, envMapIntensity: 1.1,
      normalMap: normalMap, normalScale: new T.Vector2(0.9, 0.9), alphaMap: alphaMap, alphaTest: 0.5
    });
    var edge = new T.MeshStandardMaterial({
      color: goldDeep, metalness: 1, roughness: 0.55, envMap: env, envMapIntensity: 0.75,
      alphaMap: alphaMap, alphaTest: 0.5
    });

    // Volumen a partir del PNG: capas apiladas con la misma máscara alfa.
    var small = Math.min(window.innerWidth, window.innerHeight) < 600;
    var layers = small ? 14 : 22, depth = 0.07;
    var geo = new T.PlaneGeometry(1, 1);
    var logo = new T.Group();
    for (var i = 0; i < layers; i++) {
      var mesh = new T.Mesh(geo, i === layers - 1 ? face : edge);
      mesh.position.z = -depth / 2 + depth * i / (layers - 1);
      logo.add(mesh);
    }
    scene.add(logo);

    var key = new T.DirectionalLight(0xfff2d6, 1.2); key.position.set(-2, 3, 4); scene.add(key);
    var rim = new T.DirectionalLight(0x9fb6e8, 0.35); rim.position.set(3, -1.5, -2); scene.add(rim);
    scene.add(new T.AmbientLight(0xffffff, 0.1));

    var halfFov = T.MathUtils.degToRad(14);
    function resize() {
      var r = mark.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      var vh = 2 * camera.position.z * Math.tan(halfFov);
      var s = Math.min(vh * camera.aspect, vh) * 0.86;
      logo.scale.set(s, s, s);
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(mark);
    else window.addEventListener('resize', resize);

    // Movimiento contenido: puntero en escritorio; giroscopio o desplazamiento en celular.
    var tx = 0, ty = 0, cx = 0, cy = 0, gyro = false;
    var coarse = window.matchMedia && window.matchMedia('(hover: none)').matches;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    window.addEventListener('deviceorientation', function (e) {
      if (e.gamma == null || e.beta == null) return;
      gyro = true;
      tx = Math.max(-1, Math.min(1, e.gamma / 30));
      ty = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
    }, { passive: true });
    if (coarse) {
      window.addEventListener('scroll', function () {
        if (gyro) return;
        ty = Math.max(-1, Math.min(1, window.scrollY / 260));
        tx = ty * 0.6;
      }, { passive: true });
    }

    var running = false, raf = 0, last = 0, t = 0, shown = false;
    var pageVisible = !document.hidden, onScreen = true;
    function frame(now) {
      raf = 0;
      if (!running || dead) return;
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now; t += dt;
      cx += (tx - cx) * 0.045; cy += (ty - cy) * 0.045;
      logo.rotation.y = Math.sin(t * 0.22) * 0.2 + cx * 0.24;
      logo.rotation.x = Math.sin(t * 0.17) * 0.04 + cy * 0.14;
      key.position.x = -2 + cx * 1.2;
      renderer.render(scene, camera);
      if (!shown) { shown = true; root.classList.add('has-3d'); }
      raf = window.requestAnimationFrame(frame);
    }
    function update() {
      var should = pageVisible && onScreen && !dead;
      if (should && !running) { running = true; last = 0; raf = window.requestAnimationFrame(frame); }
      else if (!should && running) { running = false; if (raf) window.cancelAnimationFrame(raf); raf = 0; }
    }
    stopLoop = function () { running = false; if (raf) window.cancelAnimationFrame(raf); raf = 0; };
    document.addEventListener('visibilitychange', function () { pageVisible = !document.hidden; update(); });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; update(); }).observe(mark);
    }
    update();
  }
})();
