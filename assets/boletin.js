/* ============================================================
   ¡Diay! Santa Ana — comportamiento comun a todas las paginas.
   Todo es opcional: si el JS no carga, la pagina se lee igual.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;

  /* --- Modo oscuro ------------------------------------------------ */
  var toggle = document.getElementById('themeToggle');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var actual = root.dataset.theme ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
     WhatsApp es como circula de verdad un boletin comunal aqui.     */
  var btnCompartir = document.getElementById('btnCompartir');

  if (btnCompartir) {
    if (navigator.share) {
      btnCompartir.addEventListener('click', function () {
        navigator.share({
          title: document.title,
          url: location.href
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
        navigator.clipboard.writeText(location.href).then(listo, function () {});
      } else {
        var campo = document.createElement('input');
        campo.value = location.href;
        document.body.appendChild(campo);
        campo.select();
        try { document.execCommand('copy'); listo(); } catch (e) {}
        document.body.removeChild(campo);
      }
    });
  }

  /* --- Enlace de WhatsApp: se arma con la URL real de la pagina --- */
  var waLink = document.getElementById('btnWhatsApp');

  if (waLink) {
    var titulo = document.querySelector('.article-head h1');
    var texto = (titulo ? titulo.textContent.trim() + ' — ' : '') + location.href;
    waLink.href = 'https://wa.me/?text=' + encodeURIComponent(texto);
  }
})();
