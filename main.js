(function () {
  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');
  var stored = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = stored || (prefersDark ? 'dark' : 'light');
  root.setAttribute('data-theme', theme);

  themeToggle.addEventListener('click', function () {
    theme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });
})();

(function () {
  var header = document.getElementById('site-header');
  var onScroll = function () {
    header.classList.toggle('scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

(function () {
  var navToggle = document.getElementById('nav-toggle');
  var navLinks = document.getElementById('nav-links');

  navToggle.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
  });

  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
    });
  });
})();

(function () {
  var sections = document.querySelectorAll('main section[id]');
  var links = document.querySelectorAll('.nav-links a');

  if (!('IntersectionObserver' in window) || !sections.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();

(function () {
  var revealEls = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !revealEls.length) return;

  var observer = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach(function (el) {
    observer.observe(el);
  });
})();

(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

(function () {
  var canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var hero = canvas.parentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var particles = [];
  var BLACKHOLE_BASE_R = 21;
  var BLACKHOLE_MAX_R = 140;
  var mouse = { x: null, y: null, radius: BLACKHOLE_BASE_R, consumed: 0 };
  var width, height, dpr;
  var MAX_PARTICLE_R = 4.5;
  var STAR_GRAVITY_RANGE = 150;
  var STAR_GRAVITY_STRENGTH = 0.018;

  function respawnParticle(p) {
    var edge = Math.floor(Math.random() * 4);
    if (edge === 0) { p.x = 0; p.y = Math.random() * height; }
    else if (edge === 1) { p.x = width; p.y = Math.random() * height; }
    else if (edge === 2) { p.x = Math.random() * width; p.y = 0; }
    else { p.x = Math.random() * width; p.y = height; }
    p.vx = (Math.random() - 0.5) * 0.35;
    p.vy = (Math.random() - 0.5) * 0.35;
    p.r = Math.random() * 1.8 + 0.6;
  }

  function getParticleColor() {
    var value = getComputedStyle(document.documentElement).getPropertyValue('--particle-color').trim();
    return value || '79, 70, 229';
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function initParticles() {
    var count = Math.min(90, Math.floor((width * height) / 14000));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.6
      });
    }
  }

  function step() {
    var color = getParticleColor();
    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      p.stretch = 0;

      if (mouse.x !== null) {
        var dx = mouse.x - p.x;
        var dy = mouse.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        if (dist < mouse.radius) {
          if (dist < 4) {
            respawnParticle(p);
            mouse.consumed++;
            mouse.radius = Math.min(
              BLACKHOLE_MAX_R,
              BLACKHOLE_BASE_R + Math.sqrt(mouse.consumed) * 9
            );
          } else {
            var t = 1 - dist / mouse.radius;
            var swirl = t * 1.8;
            var pull = Math.pow(t, 3) * 3.2;
            var nx = dx / dist;
            var ny = dy / dist;
            var tx = -ny;
            var ty = nx;
            p.x += nx * pull + tx * swirl;
            p.y += ny * pull + ty * swirl;
            p.stretch = t;
            p.dirx = nx;
            p.diry = ny;
          }
        }
      }

      if (p.stretch > 0.15) {
        var len = p.r * 2 + p.stretch * p.stretch * 26;
        var hx = p.dirx * len * 0.5;
        var hy = p.diry * len * 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x - hx, p.y - hy);
        ctx.lineTo(p.x + hx, p.y + hy);
        ctx.strokeStyle = 'rgba(' + color + ', ' + (0.75 - p.stretch * 0.25) + ')';
        ctx.lineWidth = Math.max(0.6, p.r * (1 - p.stretch * 0.5));
        ctx.lineCap = 'round';
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + color + ', 0.7)';
        ctx.fill();
      }
    }

    for (var a = 0; a < particles.length; a++) {
      for (var b = a + 1; b < particles.length; b++) {
        var pa = particles[a];
        var pb = particles[b];
        var ddx = pa.x - pb.x;
        var ddy = pa.y - pb.y;
        var d = Math.sqrt(ddx * ddx + ddy * ddy);

        if (d < STAR_GRAVITY_RANGE && d > 0.001) {
          var gDist = Math.max(d, 8);
          var gdirx = -ddx / d;
          var gdiry = -ddy / d;
          var forceOnA = (pb.r / gDist) * STAR_GRAVITY_STRENGTH;
          var forceOnB = (pa.r / gDist) * STAR_GRAVITY_STRENGTH;
          pa.x += gdirx * forceOnA;
          pa.y += gdiry * forceOnA;
          pb.x -= gdirx * forceOnB;
          pb.y -= gdiry * forceOnB;
        }

        if (d < pa.r + pb.r) {
          var winner = pa.r >= pb.r ? pa : pb;
          var loser = pa.r >= pb.r ? pb : pa;
          var absorbed = loser.r * 0.05;
          winner.r = Math.min(MAX_PARTICLE_R, winner.r + absorbed);
          loser.r -= absorbed;
          if (loser.r < 0.4) {
            respawnParticle(loser);
          }
        }

        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.strokeStyle = 'rgba(' + color + ', ' + (0.15 * (1 - d / 120)) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    if (mouse.x !== null) {
      var gradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, mouse.radius
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
      gradient.addColorStop(0.18, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(0.4, 'rgba(' + color + ', 0.22)');
      gradient.addColorStop(1, 'rgba(' + color + ', 0)');

      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, Math.max(4, mouse.radius * 0.1), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + color + ', 0.9)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if (!reduceMotion) requestAnimationFrame(step);
  }

  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  hero.addEventListener('mouseleave', function () {
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener('resize', resize);

  resize();
  step();
})();
