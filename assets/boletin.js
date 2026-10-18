/* ============================================================
   ¡Diay! Santa Ana — comportamiento comun a todas las paginas.
   Todo es opcional: si el JS no carga, la pagina se lee igual.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;

  /* --- Modo oscuro ------------------------------------------------
     Se abre en claro siempre; el oscuro es solo si se elige aqui.    */
  var toggle = document.getElementById('themeToggle');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var actual = root.dataset.theme || 'light';
      var siguiente = actual === 'dark' ? 'light' : 'dark';
      root.dataset.theme = siguiente;
      try { localStorage.setItem('diay-theme', siguiente); } catch (e) {}
    });
  }

  /* --- Desplegable de secciones -----------------------------------
     El <details> ya abre y cierra solo. Aqui solo agregamos cerrar
     al hacer clic afuera y con la tecla Escape.                     */
  var menu = document.querySelector('.menu');

  if (menu) {
    document.addEventListener('click', function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.open) {
        menu.open = false;
        var resumen = menu.querySelector('summary');
        if (resumen) resumen.focus();
      }
    });
  }

  /* --- La barra aparece cuando la portada sale de pantalla --------
     Solo en la portada de la edicion, donde el logo va a pantalla
     completa. En el resto de paginas la barra es fija de entrada.   */
  var flotante = document.querySelector('.masthead--flotante');
  var hero = document.querySelector('.hero');

  if (flotante) {
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        flotante.classList.toggle('is-visible', !entradas[0].isIntersecting);
      }, { rootMargin: '-70% 0px 0px 0px' }).observe(hero);
    } else {
      flotante.classList.add('is-visible');
    }
  }

  /* --- Revelado escalonado de las tarjetas ------------------------ */
  var porRevelar = document.querySelectorAll('.reveal');

  if (porRevelar.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('is-in');
            io.unobserve(entrada.target);
          }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

      porRevelar.forEach(function (el) { io.observe(el); });
    } else {
      porRevelar.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* --- Barra de progreso de lectura -------------------------------
     Solo hace falta donde el navegador no soporta scroll timelines. */
  var barra = document.getElementById('progress');
  var nativo = window.CSS && CSS.supports && CSS.supports('animation-timeline', 'scroll()');

  if (barra && !nativo) {
    var pendiente = false;

    var actualizar = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      barra.style.setProperty('--p', max > 0 ? (doc.scrollTop / max).toFixed(4) : 0);
      pendiente = false;
    };

    window.addEventListener('scroll', function () {
      if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); }
    }, { passive: true });

    window.addEventListener('resize', actualizar, { passive: true });
    actualizar();
  }

  /* --- Compartir --------------------------------------------------
     WhatsApp es como circula de verdad un boletin comunal aqui.
     Cada boton comparte el enlace con su etiqueta de Analytics
     (utm_source), para saber por donde llega la gente. El canonical
     de la pagina evita que Google indexe esas variantes.            */
  var enlaceCon = function (fuente) {
    return location.origin + location.pathname + '?utm_source=' + fuente + '&utm_medium=compartir';
  };
  var btnCompartir = document.getElementById('btnCompartir');

  if (btnCompartir) {
    if (navigator.share) {
      btnCompartir.addEventListener('click', function () {
        navigator.share({
          title: document.title,
          url: enlaceCon('compartir')
        }).catch(function () { /* el usuario cancelo: no es un error */ });
      });
    } else {
      btnCompartir.hidden = true;
    }
  }

  var btnCopiar = document.getElementById('btnCopiar');

  if (btnCopiar) {
    var etiqueta = btnCopiar.querySelector('.rotulo');
    var textoOriginal = etiqueta ? etiqueta.textContent : '';

    btnCopiar.addEventListener('click', function () {
      var listo = function () {
        if (!etiqueta) return;
        etiqueta.textContent = '¡Copiado!';
        setTimeout(function () { etiqueta.textContent = textoOriginal; }, 2000);
      };

      if (navigator.clipboard) {
        navigator.clipboard.writeText(enlaceCon('enlace')).then(listo, function () {});
      } else {
        var campo = document.createElement('input');
        campo.value = enlaceCon('enlace');
        document.body.appendChild(campo);
        campo.select();
        try { document.execCommand('copy'); listo(); } catch (e) {}
        document.body.removeChild(campo);
      }
    });
  }

  /* --- Agenda: lo que ya paso se atenua ----------------------------
     La pagina es estatica y se lee semanas despues de publicada: la
     fecha de hoy la sabe el navegador, no el generador. Sin JS la
     agenda se lee completa, igual que el dia que salio.              */
  var eventos = document.querySelectorAll('.evento[data-fecha]');

  if (eventos.length) {
    var hoy = new Date();
    var hoyIso = hoy.getFullYear() + '-' +
      ('0' + (hoy.getMonth() + 1)).slice(-2) + '-' +
      ('0' + hoy.getDate()).slice(-2);

    eventos.forEach(function (evento) {
      // Un evento de varios dias pasa cuando pasa el ultimo.
      if ((evento.getAttribute('data-hasta') || evento.getAttribute('data-fecha')) < hoyIso) {
        evento.classList.add('evento--pasado');
        var marca = document.createElement('span');
        marca.className = 'evento__pasado';
        marca.textContent = 'Ya pasó';
        var titulo = evento.querySelector('.evento__titulo');
        if (titulo) titulo.appendChild(marca);
      }
    });

    /* En el celular, solo el mes de quien lee queda abierto: los demas se
       pliegan y se abren con un toque. Si ese mes no esta en la agenda, el
       proximo que si; si ya paso toda, el ultimo. En computadora, todos. */
    var grupos = document.querySelectorAll('.agenda__grupo[data-mes]');
    if (grupos.length > 1 && window.matchMedia('(max-width: 760px)').matches) {
      var mesHoy = hoyIso.slice(0, 7);
      var abierto = null;
      for (var g = 0; g < grupos.length && !abierto; g++) {
        if (grupos[g].getAttribute('data-mes') >= mesHoy) abierto = grupos[g];
      }
      if (!abierto) abierto = grupos[grupos.length - 1];
      for (var k = 0; k < grupos.length; k++) grupos[k].open = grupos[k] === abierto;
    }
  }

  /* --- Agenda en la portada: cinco dias con hoy al centro ---------
     Los eventos vienen como datos en la pagina; los dias se cuentan
     desde hoy, asi la franja sigue al dia sin volver a publicar. Si
     en esos cinco dias no hay nada, la franja se queda escondida.   */
  var semana = document.getElementById('semana');

  if (semana) {
    var datos = [];
    try { datos = JSON.parse(semana.querySelector('.semana__datos').textContent); } catch (e) {}
    var enlace = semana.querySelector('.semana__todo').getAttribute('href');
    var DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
    var iso = function (d) {
      return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    };
    var lista = semana.querySelector('.semana__dias');
    var base = new Date();
    var total = 0;

    for (var i = -2; i <= 2; i++) {
      var dia = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      var delDia = datos.filter(function (ev) {
        return ev.fecha <= iso(dia) && iso(dia) <= (ev.hasta || ev.fecha);
      });
      total += delDia.length;

      var li = document.createElement('li');
      li.className = 'semana__dia' + (i === 0 ? ' es-hoy' : '') + (i < 0 ? ' ya-paso' : '');
      if (i === 0) li.setAttribute('aria-current', 'date');

      var fecha = document.createElement('div');
      fecha.className = 'semana__fecha';
      var nombre = document.createElement('span');
      nombre.textContent = i === 0 ? 'Hoy' : DIAS[dia.getDay()];
      var numero = document.createElement('b');
      numero.textContent = dia.getDate();
      var mes = document.createElement('span');
      mes.textContent = MESES[dia.getMonth()];
      fecha.appendChild(nombre); fecha.appendChild(numero); fecha.appendChild(mes);
      li.appendChild(fecha);

      if (delDia.length) {
        delDia.forEach(function (ev) {
          var a = document.createElement('a');
          a.className = 'semana__evento';
          a.href = enlace;
          [['strong', ev.actividad], ['span', ev.hora], ['span', ev.lugar]].forEach(function (par) {
            if (!par[1]) return;
            var el = document.createElement(par[0]);
            el.textContent = par[1];
            a.appendChild(el);
          });
          li.appendChild(a);
        });
      } else {
        var vacio = document.createElement('p');
        vacio.className = 'semana__vacio';
        vacio.textContent = 'Sin actividades';
        li.appendChild(vacio);
      }
      lista.appendChild(li);
    }

    if (total) semana.hidden = false;
  }

  /* --- Laminas de una guia: pasar hacia adelante o hacia atras ----
     Sin JS se pasan igual con el dedo (scroll-snap). Aqui solo se agregan
     las flechas, el contador y las teclas de flecha.               */
  document.querySelectorAll('.laminas').forEach(function (carrusel) {
    var pista = carrusel.querySelector('.laminas__pista');
    var hojas = pista ? pista.querySelectorAll('.lamina') : [];
    var control = carrusel.querySelector('.laminas__control');
    if (hojas.length < 2 || !control) return;
    var cuenta = carrusel.querySelector('.laminas__cuenta');
    var botones = carrusel.querySelectorAll('.laminas__boton');
    var suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var actual = 0;

    function ancho() { return hojas[1].offsetLeft - hojas[0].offsetLeft || pista.clientWidth; }
    function pintar() {
      actual = Math.max(0, Math.min(hojas.length - 1, Math.round(pista.scrollLeft / ancho())));
      cuenta.textContent = (actual + 1) + ' de ' + hojas.length;
      botones[0].disabled = actual === 0;
      botones[1].disabled = actual === hojas.length - 1;
    }
    function ir(i) {
      i = Math.max(0, Math.min(hojas.length - 1, i));
      pista.scrollTo({ left: i * ancho(), behavior: suave ? 'smooth' : 'auto' });
    }

    control.hidden = false;
    botones.forEach(function (b) {
      b.addEventListener('click', function () { ir(actual + Number(b.getAttribute('data-paso'))); });
    });
    var pendiente = false;
    pista.addEventListener('scroll', function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () { pendiente = false; pintar(); });
    }, { passive: true });
    pista.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); }
    });
    pintar();
  });

  /* --- Aviso para instalar la app ---------------------------------
     Tres casos, y en ninguno el boton puede quedar sin hacer nada:
       - Chrome/Android avisa con beforeinstallprompt (lo guarda el <head>
         en window.diayInstalar): el boton abre la instalacion de Chrome,
         y si algo falla abre la guia paso a paso.
       - iPhone/iPad: Apple no deja instalar desde la pagina; el boton
         «Cómo» abre la guia de Compartir → Agregar a inicio.
       - El navegador de adentro de WhatsApp, Instagram, Facebook o TikTok
         no deja instalar: la guia explica abrirla en Chrome o Safari.
     Solo en celular, nunca dentro de la app ya instalada, y si se cierra
     no vuelve en 30 dias. ?instalar=1 lo fuerza para probar.          */
  var ua = navigator.userAgent;
  var enApp = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  var esIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var enAppAjena = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|TikTok|musical_ly|Twitter/i.test(ua);
  var esCelular = window.matchMedia('(pointer: coarse)').matches;
  var forzado = /[?&]instalar=1/.test(location.search);
  var cerradoHasta = 0;
  try { cerradoHasta = +localStorage.getItem('diay-instalar') || 0; } catch (e) {}
  var noVolver = function (dias) {
    try { localStorage.setItem('diay-instalar', Date.now() + dias * 864e5); } catch (e) {}
  };

  var svg = function (trazo) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + trazo + '</svg>';
  };
  var ICONOS = {
    menu: svg('<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>'),
    compartir: svg('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>'),
    agregar: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>'),
    listo: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    abrir: svg('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    copiar: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>')
  };
  var PASOS = {
    android: {
      titulo: 'Instalar en Android',
      pasos: [['menu', 'Tocá el menú <strong>⋮</strong> de Chrome, arriba a la derecha.'],
              ['agregar', 'Elegí <strong>«Instalar app»</strong> o <strong>«Agregar a pantalla principal»</strong>.'],
              ['listo', 'Confirmá. El ícono de ¡Diay! queda junto a tus apps.']]
    },
    ios: {
      titulo: 'Instalar en iPhone',
      pasos: [['compartir', 'Tocá el botón <strong>Compartir</strong>: el cuadrado con la flecha hacia arriba, abajo en Safari.'],
              ['agregar', 'Bajá y elegí <strong>«Agregar a inicio»</strong>.'],
              ['listo', 'Tocá <strong>«Agregar»</strong>. ¡Diay! queda en tu pantalla de inicio.']]
    },
    ajena: {
      titulo: 'Abrilo en tu navegador',
      pasos: [['abrir', 'Esta app abre las páginas en su propio navegador, y ahí no se puede instalar.'],
              ['copiar', 'Copiá el enlace y pegalo en <strong>Chrome</strong> o <strong>Safari</strong>.'],
              ['listo', 'Desde ahí, tocá <strong>«Instalar»</strong> en el aviso de abajo.']]
    }
  };

  var guia = function (tipo) {
    var datos = PASOS[tipo];
    var fondo = document.createElement('div');
    fondo.className = 'instalar-guia';
    var hoja = document.createElement('div');
    hoja.className = 'instalar-guia__hoja';
    hoja.setAttribute('role', 'dialog');
    hoja.setAttribute('aria-modal', 'true');
    hoja.setAttribute('aria-label', datos.titulo);
    var html = '<h2>' + datos.titulo + '</h2><ol>';
    datos.pasos.forEach(function (p) {
      html += '<li><span class="instalar-guia__icono">' + ICONOS[p[0]] + '</span><span>' + p[1] + '</span></li>';
    });
    html += '</ol>';
    hoja.innerHTML = html;
    if (tipo === 'ajena') {
      var copiar = document.createElement('button');
      copiar.type = 'button';
      copiar.className = 'instalar__si';
      copiar.textContent = 'Copiar el enlace';
      copiar.addEventListener('click', function () {
        var enlace = location.origin + location.pathname;
        var hecho = function () { copiar.textContent = '¡Copiado!'; };
        if (navigator.clipboard) navigator.clipboard.writeText(enlace).then(hecho, function () {});
        else hecho();
      });
      hoja.appendChild(copiar);
    }
    var listo = document.createElement('button');
    listo.type = 'button';
    listo.className = 'instalar-guia__cerrar';
    listo.textContent = 'Entendido';
    hoja.appendChild(listo);
    fondo.appendChild(hoja);
    var cerrar = function () { fondo.remove(); document.removeEventListener('keydown', alEscape); };
    var alEscape = function (e) { if (e.key === 'Escape') cerrar(); };
    listo.addEventListener('click', cerrar);
    fondo.addEventListener('click', function (e) { if (e.target === fondo) cerrar(); });
    document.addEventListener('keydown', alEscape);
    document.body.appendChild(fondo);
    listo.focus();
  };

  var instalar = function () {
    var evento = window.diayInstalar;
    if (!evento) { guia(esIOS ? 'ios' : 'android'); return; }
    window.diayInstalar = null;  // Chrome deja usarlo una sola vez
    var caja = document.querySelector('.instalar');
    try {
      Promise.resolve(evento.prompt()).then(function () {
        return evento.userChoice;
      }).then(function (eleccion) {
        if (caja) caja.remove();
        if (eleccion && eleccion.outcome === 'accepted') noVolver(3650);
      }).catch(function () { guia('android'); });
    } catch (e) {
      guia('android');
    }
  };

  // Un solo aviso: si ya esta, se actualiza (de «Cómo» a «Instalar» cuando Chrome avisa).
  var avisoInstalar = function () {
    var caja = document.querySelector('.instalar');
    if (!caja) {
      caja = document.createElement('div');
      caja.className = 'instalar';
      caja.setAttribute('role', 'dialog');
      caja.setAttribute('aria-label', 'Instalar ¡Diay! Santa Ana');
      document.body.appendChild(caja);
    }
    var tipo = window.diayInstalar ? 'chrome' : (enAppAjena ? 'ajena' : (esIOS ? 'ios' : 'android'));
    var textos = {
      chrome: 'Instalalo como app: abre al toque y se lee sin internet.',
      ios: 'Se instala desde Safari en dos toques.',
      ajena: 'Abrilo en Chrome o Safari para instalarlo.',
      android: 'Se instala desde el menú de Chrome.'
    };
    caja.innerHTML = '';
    var icono = document.createElement('img');
    icono.src = '/assets/icono-192.png';
    icono.alt = '';
    var p = document.createElement('p');
    var t = document.createElement('strong');
    t.textContent = 'Llevá ¡Diay! en tu celular';
    p.appendChild(t);
    p.appendChild(document.createTextNode(textos[tipo]));
    var si = document.createElement('button');
    si.type = 'button';
    si.className = 'instalar__si';
    si.textContent = tipo === 'chrome' ? 'Instalar' : 'Cómo';
    si.addEventListener('click', function () { tipo === 'chrome' ? instalar() : guia(tipo); });
    var no = document.createElement('button');
    no.type = 'button';
    no.className = 'instalar__no';
    no.setAttribute('aria-label', 'Cerrar');
    no.textContent = '×';
    no.addEventListener('click', function () { caja.remove(); noVolver(30); });
    caja.appendChild(icono);
    caja.appendChild(p);
    caja.appendChild(si);
    caja.appendChild(no);
  };

  if (!enApp && (forzado || (esCelular && Date.now() > cerradoHasta))) {
    if (window.diayInstalar) avisoInstalar();
    document.addEventListener('diay:instalable', avisoInstalar);
    if (esIOS || enAppAjena || forzado) setTimeout(avisoInstalar, forzado ? 300 : 4000);
  }
  window.addEventListener('appinstalled', function () {
    var caja = document.querySelector('.instalar');
    if (caja) caja.remove();
    noVolver(3650);
  });

  /* --- App en el celular (PWA) ----------------------------------
     El service worker deja instalar el boletin y leerlo sin conexion.
     Lo genera plantilla/generar.py; solo se registra servido por http(s). */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  /* --- Enlace de WhatsApp: se arma con la URL real de la pagina --- */
  var waLink = document.getElementById('btnWhatsApp');

  if (waLink) {
    var titulo = document.querySelector('.article-head h1');
    var texto = (titulo ? titulo.textContent.trim() + ' — ' : '') + enlaceCon('whatsapp');
    waLink.href = 'https://wa.me/?text=' + encodeURIComponent(texto);
  }
})();
