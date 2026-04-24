/**
 * LuckyNova — ln-app.js
 * Social Casino Platform · UK Market · 2026
 * Vanilla JS — no frameworks, no dependencies
 */

(function () {
  'use strict';

  /* ── AUTO YEAR ─────────────────────────────────────── */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ── HAMBURGER NAV ──────────────────────────────────── */
  var hamburger = document.querySelector('.ln-hamburger');
  var nav = document.querySelector('.ln-topbar__nav');

  if (hamburger && nav) {
    hamburger.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        nav.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on nav link click (mobile)
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── ACCORDION ──────────────────────────────────────── */
  document.querySelectorAll('.ln-accordion__trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var panel = this.nextElementSibling;
      var isExpanded = this.getAttribute('aria-expanded') === 'true';

      // Close all others in same accordion
      var accordion = this.closest('.ln-accordion');
      if (accordion) {
        accordion.querySelectorAll('.ln-accordion__trigger').forEach(function (t) {
          if (t !== trigger) {
            t.setAttribute('aria-expanded', 'false');
            var p = t.nextElementSibling;
            if (p) p.classList.remove('open');
          }
        });
      }

      this.setAttribute('aria-expanded', String(!isExpanded));
      if (panel) {
        panel.classList.toggle('open', !isExpanded);
      }
    });
  });

  /* ── NOVA SLOTS GAME ────────────────────────────────── */
  var slotsEl = document.getElementById('nova-slots');
  if (slotsEl) {
    var SYMBOLS = ['🪐', '🚀', '☄️', '🌟', '🌙', '💫'];
    var PAYTABLE = {
      '🪐🪐🪐': 100,
      '🚀🚀🚀': 80,
      '☄️☄️☄️': 60,
      '🌟🌟🌟': 40,
      '🌙🌙🌙': 25,
      '💫💫💫': 15,
    };
    var BET = 10;
    var START_BALANCE = 500;

    var balance = START_BALANCE;
    var spinning = false;

    var reelEls = slotsEl.querySelectorAll('.ln-slots__reel');
    var balanceEl = slotsEl.querySelector('#slots-balance');
    var messageEl = slotsEl.querySelector('#slots-message');
    var spinBtn = slotsEl.querySelector('#slots-spin');
    var resetBtn = slotsEl.querySelector('#slots-reset');

    function updateBalance() {
      if (balanceEl) balanceEl.textContent = balance;
      if (spinBtn) spinBtn.disabled = balance < BET || spinning;
      if (resetBtn) resetBtn.style.display = balance < BET ? 'inline-flex' : 'none';
    }

    function setMessage(msg, isWin) {
      if (messageEl) {
        messageEl.textContent = msg;
        messageEl.style.color = isWin ? 'var(--ln-gold)' : 'var(--ln-muted)';
      }
    }

    function randomSymbol() {
      return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    }

    function spin() {
      if (spinning || balance < BET) return;
      spinning = true;
      balance -= BET;
      updateBalance();
      setMessage('Spinning…', false);

      // Animate reels
      reelEls.forEach(function (r) { r.classList.add('ln-reel-spin'); });

      var result = [];
      var delays = [400, 600, 800];

      reelEls.forEach(function (reel, i) {
        setTimeout(function () {
          reel.classList.remove('ln-reel-spin');
          result[i] = randomSymbol();
          reel.textContent = result[i];

          if (i === 2) {
            // Evaluate
            setTimeout(function () {
              evaluateResult(result);
              spinning = false;
              updateBalance();
            }, 100);
          }
        }, delays[i]);
      });
    }

    function evaluateResult(result) {
      var key = result.join('');
      var winAmount = PAYTABLE[key] || 0;

      if (winAmount > 0) {
        balance += winAmount;
        setMessage('🎉 ' + result.join('') + ' — You win ' + winAmount + ' coins!', true);
        reelEls.forEach(function (r) { r.classList.add('ln-reel-win'); });
        setTimeout(function () { reelEls.forEach(function (r) { r.classList.remove('ln-reel-win'); }); }, 1500);
      } else {
        // Check pair
        var counts = {};
        result.forEach(function (s) { counts[s] = (counts[s] || 0) + 1; });
        var hasPair = Object.values(counts).some(function (c) { return c >= 2; });
        if (hasPair) {
          balance += 5;
          setMessage('👾 Pair! +5 coins', true);
        } else {
          setMessage('No match. Try again!', false);
        }
      }
    }

    if (spinBtn) spinBtn.addEventListener('click', spin);
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        balance = START_BALANCE;
        setMessage('Fresh start! Good luck! 🚀', true);
        updateBalance();
        reelEls.forEach(function (r) { r.textContent = '⭐'; });
      });
    }

    // Init reels
    reelEls.forEach(function (r) { r.textContent = '⭐'; });
    updateBalance();
  }

  /* ── STAR MATCH GAME ────────────────────────────────── */
  var matchEl = document.getElementById('star-match');
  if (matchEl) {
    var MATCH_SYMBOLS = ['🪐', '🚀', '☄️', '🌟', '🌙', '💫', '🛸', '🌌'];
    var grid = matchEl.querySelector('#match-grid');
    var movesEl = matchEl.querySelector('#match-moves');
    var pairsEl = matchEl.querySelector('#match-pairs');
    var matchMsg = matchEl.querySelector('#match-msg');
    var newGameBtn = matchEl.querySelector('#match-new');

    var flipped = [];
    var matched = 0;
    var moves = 0;
    var locked = false;
    var totalPairs = MATCH_SYMBOLS.length;

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function initGame() {
      flipped = [];
      matched = 0;
      moves = 0;
      locked = false;
      if (movesEl) movesEl.textContent = '0';
      if (pairsEl) pairsEl.textContent = '0/' + totalPairs;
      if (matchMsg) matchMsg.textContent = '';
      if (!grid) return;

      var cards = shuffle(MATCH_SYMBOLS.concat(MATCH_SYMBOLS));
      grid.innerHTML = '';
      cards.forEach(function (sym) {
        var card = document.createElement('div');
        card.className = 'ln-match__card';
        card.dataset.sym = sym;
        card.textContent = sym;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', 'Card (hidden)');

        card.addEventListener('click', function () { flipCard(this); });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard(this); }
        });
        grid.appendChild(card);
      });
    }

    function flipCard(card) {
      if (locked) return;
      if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
      if (flipped.length >= 2) return;

      card.classList.add('flipped');
      card.setAttribute('aria-label', card.dataset.sym);
      flipped.push(card);

      if (flipped.length === 2) {
        moves++;
        if (movesEl) movesEl.textContent = moves;
        locked = true;

        if (flipped[0].dataset.sym === flipped[1].dataset.sym) {
          // Match!
          flipped[0].classList.add('matched');
          flipped[1].classList.add('matched');
          flipped[0].classList.remove('flipped');
          flipped[1].classList.remove('flipped');
          flipped = [];
          matched++;
          if (pairsEl) pairsEl.textContent = matched + '/' + totalPairs;
          locked = false;

          if (matched === totalPairs) {
            if (matchMsg) matchMsg.textContent = '🎉 Brilliant! All pairs in ' + moves + ' moves!';
          } else {
            if (matchMsg) matchMsg.textContent = '✨ Match!';
            setTimeout(function () { if (matchMsg && matchMsg.textContent === '✨ Match!') matchMsg.textContent = ''; }, 900);
          }
        } else {
          if (matchMsg) matchMsg.textContent = 'Not a match…';
          setTimeout(function () {
            flipped[0].classList.remove('flipped');
            flipped[1].classList.remove('flipped');
            flipped[0].setAttribute('aria-label', 'Card (hidden)');
            flipped[1].setAttribute('aria-label', 'Card (hidden)');
            flipped = [];
            locked = false;
            if (matchMsg && matchMsg.textContent === 'Not a match…') matchMsg.textContent = '';
          }, 1000);
        }
      }
    }

    if (newGameBtn) newGameBtn.addEventListener('click', initGame);
    initGame();
  }

  /* ── SMOOTH SCROLL FOR ANCHOR LINKS ─────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
