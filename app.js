/* ===== Interfaz: trámites, motivos y WhatsApp (no depende del 3D) ===== */
(function () {
  'use strict';

  var WA_PHONE = '573104950157';
  var MAX_ENCODED = 1500;
  var OTRO = 'Otro';

  /* Cada trámite tiene su cierre y cada motivo su propia frase de solicitud.
     [motivo visible, frase que se envía por WhatsApp] */
  var TRAMITES = {
    peticion: {
      titulo: 'Derecho de petición',
      cierre: '¿Me indica qué información necesita para preparar la petición? Gracias.',
      otro: 'Necesito la redacción de un derecho de petición para un caso que no aparece en la lista.',
      motivos: [
        ['Salud (EPS / IPS)', 'Necesito la redacción de un derecho de petición dirigido a una EPS o IPS.'],
        ['Tránsito (comparendos, multas)', 'Necesito la redacción de un derecho de petición sobre comparendos o multas de tránsito.'],
        ['Servicios públicos', 'Necesito la redacción de un derecho de petición ante una empresa de servicios públicos.'],
        ['Entidad bancaria o financiera', 'Necesito la redacción de un derecho de petición ante una entidad bancaria o financiera.'],
        ['Pensiones o seguridad social', 'Necesito la redacción de un derecho de petición sobre pensiones o seguridad social.'],
        ['Entidad pública (solicitud o copias)', 'Necesito la redacción de un derecho de petición ante una entidad pública, para hacer una solicitud o pedir copias.']
      ]
    },
    poder: {
      titulo: 'Poder',
      cierre: '¿Me indica qué datos necesita para preparar el poder? Gracias.',
      otro: 'Necesito la redacción de un poder para un trámite que no aparece en la lista.',
      motivos: [
        ['Para trámite administrativo', 'Necesito la redacción de un poder para un trámite administrativo.'],
        ['Para proceso judicial', 'Necesito la redacción de un poder para un proceso judicial.'],
        ['Para trámite notarial o escrituras', 'Necesito la redacción de un poder para un trámite notarial o de escrituras.'],
        ['Para cobro o reclamación', 'Necesito la redacción de un poder para un cobro o una reclamación.']
      ]
    },
    tutela: {
      titulo: 'Acción de tutela',
      cierre: '¿Me indica cómo continuar y qué documentos debo tener a mano? Gracias.',
      otro: 'Necesito la redacción de una acción de tutela para un caso que no aparece en la lista.',
      motivos: [
        ['Salud (negación de servicio, medicamento o procedimiento)', 'Necesito la redacción de una acción de tutela por la negación de un servicio, medicamento o procedimiento de salud.'],
        ['Derecho de petición sin respuesta', 'Necesito la redacción de una acción de tutela porque un derecho de petición no ha sido respondido.'],
        ['Debido proceso (por ejemplo, comparendos)', 'Necesito la redacción de una acción de tutela por debido proceso (por ejemplo, comparendos).'],
        ['Pensiones o seguridad social', 'Necesito la redacción de una acción de tutela relacionada con pensiones o seguridad social.'],
        ['Servicios públicos', 'Necesito la redacción de una acción de tutela relacionada con servicios públicos.'],
        ['Impugnación o desacato', 'Necesito la redacción de una impugnación o de un incidente de desacato en una tutela.']
      ]
    },
    contratos: {
      titulo: 'Contratos',
      cierre: '¿Me indica qué información de las partes y del acuerdo necesita? Gracias.',
      otro: 'Necesito la redacción de un contrato que no aparece en la lista.',
      motivos: [
        ['Prestación de servicios', 'Necesito la redacción de un contrato de prestación de servicios.'],
        ['Arrendamiento', 'Necesito la redacción de un contrato de arrendamiento.'],
        ['Compraventa de bien mueble', 'Necesito la redacción de un contrato de compraventa de un bien mueble.'],
        ['Confidencialidad', 'Necesito la redacción de un acuerdo de confidencialidad.'],
        ['Transacción o acuerdo de pago', 'Necesito la redacción de una transacción o un acuerdo de pago.']
      ]
    },
    promesa: {
      titulo: 'Promesa de compraventa',
      cierre: '¿Me indica qué datos del negocio y de las partes necesita? Gracias.',
      otro: 'Necesito la redacción de una promesa de compraventa para un caso que no aparece en la lista.',
      motivos: [
        ['Inmueble (casa, apartamento)', 'Necesito la redacción de una promesa de compraventa de un inmueble (casa o apartamento).'],
        ['Lote', 'Necesito la redacción de una promesa de compraventa de un lote.'],
        ['Vehículo', 'Necesito la redacción de una promesa de compraventa de un vehículo.']
      ]
    },
    sucesiones: {
      titulo: 'Sucesiones',
      cierre: '¿Me indica cómo continuar y qué documentos debo reunir? Gracias.',
      otro: 'Necesito asesoría sobre un trámite de sucesión que no aparece en la lista.',
      motivos: [
        ['Sucesión notarial (herederos de acuerdo)', 'Necesito asesoría para una sucesión notarial, con los herederos de acuerdo.'],
        ['Sucesión judicial', 'Necesito asesoría para una sucesión judicial.'],
        ['Liquidación de sociedad conyugal o patrimonial', 'Necesito asesoría para la liquidación de una sociedad conyugal o patrimonial.'],
        ['Testamento', 'Necesito asesoría para la redacción de un testamento.'],
        ['No sé cuál necesito', 'Necesito orientación para saber qué trámite de sucesión corresponde a mi caso.']
      ]
    }
  };

  function $(sel) { return document.querySelector(sel); }
  var backdrop = $('#backdrop');
  var sheet = $('#sheet');
  var privacy = $('#privacy');
  var form = $('#motivoForm');
  var list = $('#motivos');
  var titleEl = $('#sheetTitle');
  var body = $('#sheetBody');
  var otroWrap = $('#otroWrap');
  var otroText = $('#otroText');
  var counter = $('#otroCounter');
  var nombre = $('#nombre');
  var ciudad = $('#ciudad');
  var preview = $('#preview');
  var previewText = $('#previewText');
  var btn = $('#btnContinuar');
  var hint = $('#hint');
  var confirmBox = $('#confirm');
  var confirmLink = $('#confirmLink');
  var confirmWeb = $('#confirmWeb');
  var page = [$('.topbar'), $('main'), $('.site-footer'), $('.skip')];
  var reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  var current = null;
  var openDialog = null;
  var opener = null;

  /* ---------- Texto seguro ---------- */
  function wellFormed(s) {
    // Reemplaza mitades de pares sustitutos sueltos para que encodeURIComponent nunca falle.
    return String(s).replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g, function (m, pre) {
      return (pre || '') + '�';
    });
  }
  function clean(s) { return wellFormed(s).replace(/\s+/g, ' ').trim(); }

  /* ---------- Diálogos accesibles ---------- */
  function focusables(root) {
    var nodes = root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])');
    return Array.prototype.filter.call(nodes, function (el) {
      if (el.type === 'radio' && !el.checked) {
        var group = root.querySelectorAll('input[type="radio"][name="' + el.name + '"]');
        var anyChecked = Array.prototype.some.call(group, function (r) { return r.checked; });
        if (anyChecked || group[0] !== el) return false;
      }
      return el.getClientRects().length > 0;
    });
  }
  function setPageInert(on) {
    page.forEach(function (el) {
      if (!el) return;
      if (on) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); }
      else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
    });
    document.documentElement.classList.toggle('is-locked', on);
  }
  function showDialog(dlg, from) {
    opener = from || document.activeElement;
    openDialog = dlg;
    dlg.hidden = false;
    backdrop.hidden = false;
    void dlg.offsetWidth; // fuerza el estado inicial para la transición
    dlg.classList.add('is-open');
    backdrop.classList.add('is-open');
    setPageInert(true);
    var target = dlg.querySelector('[data-autofocus]') || focusables(dlg)[0];
    if (target) target.focus({ preventScroll: true });
  }
  function hideDialog() {
    var dlg = openDialog;
    if (!dlg) return;
    openDialog = null;
    dlg.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    setPageInert(false);
    window.setTimeout(function () {
      if (!dlg.classList.contains('is-open')) dlg.hidden = true;
      if (!openDialog) backdrop.hidden = true;
    }, reduceMQ.matches ? 0 : 380);
    if (opener && typeof opener.focus === 'function') opener.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (!openDialog) return;
    if (e.key === 'Escape') { e.preventDefault(); hideDialog(); return; }
    if (e.key === 'Tab') {
      var f = focusables(openDialog);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      var active = document.activeElement;
      if (e.shiftKey && (active === first || !openDialog.contains(active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || !openDialog.contains(active))) { e.preventDefault(); first.focus(); }
    }
  });
  backdrop.addEventListener('click', hideDialog);
  privacy.addEventListener('click', function (e) { if (e.target === privacy) hideDialog(); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (el) {
    el.addEventListener('click', hideDialog);
  });

  /* ---------- Módulo de motivos ---------- */
  function renderMotivos(t) {
    list.textContent = '';
    t.motivos.map(function (m) { return m[0]; }).concat([OTRO]).forEach(function (m, i) {
      var label = document.createElement('label');
      label.className = 'motivo';
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'motivo';
      input.id = 'motivo-' + i;
      input.value = m;
      var span = document.createElement('span');
      span.className = 'motivo-text';
      span.textContent = m;
      label.appendChild(input);
      label.appendChild(span);
      list.appendChild(label);
    });
  }
  function selectedMotivo() {
    var r = form.querySelector('input[name="motivo"]:checked');
    return r ? r.value : null;
  }
  function introFor(t, motivo) {
    if (motivo === OTRO) return t.otro;
    for (var i = 0; i < t.motivos.length; i++) if (t.motivos[i][0] === motivo) return t.motivos[i][1];
    return t.otro;
  }
  function updateCounter() { counter.textContent = otroText.value.length + ' / 300'; }
  function validate() {
    var m = selectedMotivo();
    var isOtro = m === OTRO;
    otroWrap.hidden = !isOtro;
    var ok = !!m && (!isOtro || clean(otroText.value).length >= 5);
    btn.setAttribute('aria-disabled', ok ? 'false' : 'true');
    hint.textContent = !m ? 'Seleccione un motivo para continuar.' : (isOtro && !ok ? 'Escriba al menos 5 caracteres para continuar.' : '');
    hint.hidden = ok;
    preview.hidden = !ok;
    if (ok) {
      var text = buildText();
      var links = waLinks(text);
      previewText.textContent = text;
      btn.href = links.primary;
      confirmLink.href = links.primary;
      confirmWeb.href = links.alt;
    } else {
      btn.href = '#';
    }
    return ok;
  }
  function openSheet(key, from) {
    var t = TRAMITES[key];
    if (!t) return;
    current = t;
    titleEl.textContent = t.titulo;
    renderMotivos(t);
    otroText.value = '';
    updateCounter();
    confirmBox.hidden = true;
    preview.open = false;
    validate();
    body.scrollTop = 0;
    showDialog(sheet, from);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-tramite]'), function (el) {
    el.addEventListener('click', function () { openSheet(el.getAttribute('data-tramite'), el); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-privacy]'), function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); showDialog(privacy, el); });
  });
  form.addEventListener('change', function (e) {
    if (e.target && e.target.name === 'motivo') {
      confirmBox.hidden = true;
      validate();
      if (e.target.value === OTRO) {
        otroWrap.scrollIntoView({ block: 'nearest', behavior: reduceMQ.matches ? 'auto' : 'smooth' });
      }
    }
  });
  [otroText, nombre, ciudad].forEach(function (el) {
    el.addEventListener('input', function () {
      if (el === otroText) updateCounter();
      confirmBox.hidden = true;
      validate();
    });
  });

  /* ---------- Mensaje de WhatsApp, personalizado por trámite y motivo ---------- */
  function compose(t, motivo, detalle, nom, ciu) {
    var s = 'Hola, Dr. Sebastián. Me comunico desde la página de SM Legal.\n\n' +
      introFor(t, motivo) + '\n\n' +
      'Trámite: ' + t.titulo + '\n' +
      'Motivo: ' + motivo + '\n';
    if (detalle) s += 'Detalle: ' + detalle + '\n';
    if (nom) s += 'Nombre: ' + nom + '\n';
    if (ciu) s += 'Ciudad: ' + ciu + '\n';
    s += '\n' + t.cierre;
    return s;
  }
  function buildText() {
    var motivo = selectedMotivo();
    var detalle = motivo === OTRO ? clean(otroText.value) : '';
    var nom = clean(nombre.value);
    var ciu = clean(ciudad.value);
    var text = compose(current, motivo, detalle, nom, ciu);
    if (encodeURIComponent(text).length > MAX_ENCODED && detalle) {
      // Recorta solo el detalle, por puntos de código, hasta que el texto codificado quepa.
      var cps = Array.from(detalle);
      var lo = 0, hi = cps.length;
      while (lo < hi) {
        var mid = Math.ceil((lo + hi) / 2);
        var probe = cps.slice(0, mid).join('').trim() + '…';
        if (encodeURIComponent(compose(current, motivo, probe, nom, ciu)).length <= MAX_ENCODED) lo = mid;
        else hi = mid - 1;
      }
      detalle = lo > 0 ? cps.slice(0, lo).join('').trim() + '…' : '';
      text = compose(current, motivo, detalle, nom, ciu);
    }
    return text;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (current && validate()) btn.click();
  });
  // Enlace real (no apertura por script) para que funcione en cualquier navegador y dispositivo.
  btn.addEventListener('click', function (e) {
    if (!current || !validate()) { e.preventDefault(); return; }
    confirmBox.hidden = false;
  });

  /* ---------- Apertura directa de WhatsApp ----------
     Todos los botones abren la aplicación de WhatsApp (celular o computador) directamente en el chat,
     sin páginas intermedias ni redirecciones automáticas. La versión web solo se ofrece como enlace
     manual para quien no tenga la aplicación instalada. */
  function isMobile() {
    var ua = navigator.userAgent || '';
    return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  // Celular y tableta: wa.me abre la aplicación de WhatsApp directamente en el chat.
  // Computador: web.whatsapp.com abre el chat directo, sin la página intermedia de wa.me.
  var MOBILE = isMobile();
  function waLinks(text) {
    var t = encodeURIComponent(wellFormed(text));
    var app = 'https://wa.me/' + WA_PHONE + '?text=' + t;
    var api = 'https://api.whatsapp.com/send?phone=' + WA_PHONE + '&text=' + t;
    var web = 'https://web.whatsapp.com/send?phone=' + WA_PHONE + '&text=' + t;
    return MOBILE ? { primary: app, alt: api } : { primary: web, alt: app };
  }
  var ALT_LABEL = MOBILE ? '¿No se abrió? Use este enlace alterno' : '¿Usa WhatsApp de escritorio? Ábralo aquí';
  var toast = $('#waToast');
  var toastRetry = $('#toastRetry');
  var toastWeb = $('#toastWeb');
  var toastTimer = 0;
  toastWeb.textContent = ALT_LABEL;
  confirmWeb.textContent = ALT_LABEL;
  function showToast(links) {
    toastRetry.href = links.primary;
    toastWeb.href = links.alt;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.hidden = true; }, 10000);
  }
  $('#toastClose').addEventListener('click', function () { toast.hidden = true; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-wa]'), function (a) {
    var links = waLinks(a.getAttribute('data-wa'));
    a.href = links.primary;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.addEventListener('click', function () { showToast(links); });
  });

  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
