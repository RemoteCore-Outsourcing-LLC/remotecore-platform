/* RemoteCore demo. Front end only. Jobs and people below are sample data;
   in the real build they come from the database. */
(function () {
  var root = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mode = function () { return root.getAttribute('data-mode'); };

  /* ---------- sample data ---------- */
  var CATS = ['All', 'Admin', 'Customer service', 'Bookkeeping', 'Sales', 'Marketing', 'Tech'];
  var JOBS = [
    { id: 'j1', title: 'Executive Assistant', co: 'US law office', cat: 'Admin', type: 'Full time', loc: 'Fully remote', lim: false, lo: 1000, hi: 1400, exp: 'Mid', hours: '9am to 5pm US Eastern', pc: '8 GB memory, 25 Mbps internet, webcam', due: 'Dec 5, 2026', skills: 'calendar inbox travel legal', desc: 'Manage two partners\' calendars, inboxes and travel. Prepare documents and follow up with clients.' },
    { id: 'j2', title: 'Customer Support Specialist', co: 'US online store', cat: 'Customer service', type: 'Full time', loc: 'Fully remote', lim: false, lo: 900, hi: 1200, exp: 'Entry', hours: 'Any 8 hours, weekends in rotation', pc: '8 GB memory, 20 Mbps internet, headset', due: 'Dec 1, 2026', skills: 'email chat shopify zendesk ecommerce retail', desc: 'Answer customer emails and chats about orders, returns and shipping.' },
    { id: 'j3', title: 'Bookkeeper, QuickBooks', co: 'US accounting firm', cat: 'Bookkeeping', type: 'Part time', loc: 'Remote, US time zones', lim: true, lo: 1100, hi: 1500, exp: 'Mid', hours: '4 hours a day, US Central', pc: '16 GB memory, 50 Mbps internet, two screens', due: 'Nov 30, 2026', skills: 'quickbooks reconciliation accounting finance payroll', desc: 'Monthly books for small business clients: bank reconciliation, invoices and reports.' },
    { id: 'j4', title: 'Sales Development Representative', co: 'US software company', cat: 'Sales', type: 'Full time', loc: 'Remote, Latin America only', lim: true, lo: 1300, hi: 1800, exp: 'Mid', hours: '9am to 6pm US Pacific', pc: '8 GB memory, 50 Mbps internet, headset, webcam', due: 'Dec 12, 2026', skills: 'cold call outbound crm hubspot saas technology', desc: 'Call and email new leads, qualify them and book meetings for the sales team.' },
    { id: 'j5', title: 'Social Media Manager', co: 'UK fitness brand', cat: 'Marketing', type: 'Contract', loc: 'Fully remote', lim: false, lo: 800, hi: 1300, exp: 'Mid', hours: 'Flexible, one weekly call UK time', pc: '16 GB memory, 25 Mbps internet', due: 'Dec 8, 2026', skills: 'instagram tiktok content canva wellness', desc: 'Plan, write and schedule posts on three channels. Report results each month.' },
    { id: 'j6', title: 'Front End Developer, React', co: 'US health startup', cat: 'Tech', type: 'Full time', loc: 'Fully remote', lim: false, lo: 2000, hi: 2500, exp: 'Senior', hours: '4 hours overlap with US Eastern', pc: '16 GB memory, 50 Mbps internet', due: 'Dec 15, 2026', skills: 'react typescript javascript web healthcare software', desc: 'Build and maintain the patient web app with a small product team.' },
    { id: 'j7', title: 'Virtual Receptionist', co: 'US dental clinic', cat: 'Customer service', type: 'Part time', loc: 'Remote, US time zones', lim: true, lo: 600, hi: 900, exp: 'Entry', hours: '8am to 12pm US Mountain', pc: '8 GB memory, 25 Mbps internet, headset', due: 'Nov 28, 2026', skills: 'phone scheduling appointments healthcare medical', desc: 'Answer calls, book appointments and confirm visits for a three chair clinic.' },
    { id: 'j8', title: 'Data Entry Assistant', co: 'Canadian logistics company', cat: 'Admin', type: 'Freelance', loc: 'Fully remote', lim: false, lo: 500, hi: 800, exp: 'Entry', hours: 'Flexible', pc: '8 GB memory, 10 Mbps internet', due: 'Dec 3, 2026', skills: 'excel spreadsheet typing shipping', desc: 'Enter shipment records into the tracking system and check them for errors.' },
    { id: 'j9', title: 'Accounts Payable Clerk', co: 'US construction company', cat: 'Bookkeeping', type: 'Full time', loc: 'Fully remote', lim: false, lo: 1000, hi: 1300, exp: 'Entry', hours: '8am to 5pm US Central', pc: '8 GB memory, 25 Mbps internet', due: 'Dec 10, 2026', skills: 'invoices accounting finance vendors', desc: 'Process supplier invoices, match them to purchase orders and prepare weekly payments.' },
    { id: 'j10', title: 'IT Help Desk Technician', co: 'US property manager', cat: 'Tech', type: 'Contract', loc: 'Remote, US time zones', lim: true, lo: 1200, hi: 1600, exp: 'Mid', hours: '9am to 5pm US Eastern', pc: '16 GB memory, 50 Mbps internet, headset', due: 'Dec 6, 2026', skills: 'support windows microsoft 365 tickets real estate', desc: 'Solve staff computer and account problems by chat, phone and remote session.' }
  ];
  var PEOPLE = [
    { id: 'p1', n: 'Amara O.', role: 'Executive Assistant', cat: 'Admin', country: 'Nigeria', pay: 1200, exp: 'Mid', yrs: 6, avail: 'Full time', eng: 'Fluent', skills: 'Calendar management, travel booking, Google Workspace', setup: 'Fiber, 210 Mbps, webcam and microphone' },
    { id: 'p2', n: 'Marco D.', role: 'Customer Support Specialist', cat: 'Customer service', country: 'Philippines', pay: 950, exp: 'Mid', yrs: 4, avail: 'Full time', eng: 'Fluent', skills: 'Zendesk, Shopify, live chat', setup: 'Fiber, 150 Mbps, headset and webcam' },
    { id: 'p3', n: 'Lucía R.', role: 'Bookkeeper', cat: 'Bookkeeping', country: 'Colombia', pay: 1300, exp: 'Senior', yrs: 9, avail: 'Part time', eng: 'Advanced', skills: 'QuickBooks, Xero, bank reconciliation', setup: 'Fiber, 300 Mbps, two screens' },
    { id: 'p4', n: 'Kevin M.', role: 'Sales Development Representative', cat: 'Sales', country: 'Kenya', pay: 1100, exp: 'Mid', yrs: 3, avail: 'Full time', eng: 'Fluent', skills: 'Outbound calls, HubSpot, lead research', setup: 'Fiber, 100 Mbps, headset and webcam' },
    { id: 'p5', n: 'Priya S.', role: 'Front End Developer', cat: 'Tech', country: 'India', pay: 2200, exp: 'Senior', yrs: 8, avail: 'Full time', eng: 'Advanced', skills: 'React, TypeScript, testing', setup: 'Fiber, 200 Mbps, 32 GB memory' },
    { id: 'p6', n: 'Daniela V.', role: 'Social Media Manager', cat: 'Marketing', country: 'Mexico', pay: 1000, exp: 'Mid', yrs: 5, avail: 'Contract', eng: 'Advanced', skills: 'Instagram, TikTok, Canva, reporting', setup: 'Cable, 120 Mbps, webcam' },
    { id: 'p7', n: 'Thabo N.', role: 'IT Help Desk Technician', cat: 'Tech', country: 'South Africa', pay: 1400, exp: 'Mid', yrs: 5, avail: 'Full time', eng: 'Fluent', skills: 'Windows, Microsoft 365, remote support', setup: 'Fiber, 250 Mbps, headset' },
    { id: 'p8', n: 'Bruna C.', role: 'Virtual Receptionist', cat: 'Customer service', country: 'Brazil', pay: 800, exp: 'Entry', yrs: 2, avail: 'Part time', eng: 'Advanced', skills: 'Phone, scheduling, patient intake', setup: 'Fiber, 180 Mbps, headset' }
  ];
  var DIALS = [['Philippines', '+63', 'PHP'], ['Colombia', '+57', 'COP'], ['Nigeria', '+234', 'NGN'], ['Kenya', '+254', 'KES'], ['India', '+91', 'INR'], ['Mexico', '+52', 'MXN'], ['South Africa', '+27', 'ZAR'], ['Brazil', '+55', 'BRL'], ['United States', '+1', 'USD']];

  /* ---------- waveforms ---------- */
  $$('[data-wave]').forEach(function (w) {
    var n = +w.getAttribute('data-wave'), h = '';
    for (var i = 0; i < n; i++) h += '<i style="--h:' + Math.round(28 + 72 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6 + 1))) + '"></i>';
    w.innerHTML = h;
  });

  /* ---------- search ---------- */
  var st = { cat: 'All', open: null, applied: {}, saved: {}, short: {} };
  var q = $('#q'), selA = $('#selA'), selB = $('#selB'), pay = $('#pay'), exp = $('#exp'), list = $('#list');
  function opts(sel, arr) { sel.innerHTML = arr.map(function (o, i) { return '<option value="' + (i ? o : '') + '">' + o + '</option>'; }).join(''); }
  function money(n) { return n.toLocaleString('en-US'); }
  function remeasure() { requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); }); }

  function setupFilters() {
    var hire = mode() === 'hire';
    $('#cats').innerHTML = CATS.map(function (c) { return '<button type="button" aria-pressed="' + (c === st.cat) + '">' + c + '</button>'; }).join('');
    $('#selALabel').textContent = hire ? 'Availability' : 'Job type';
    opts(selA, hire ? ['Any', 'Full time', 'Part time', 'Contract'] : ['Any', 'Full time', 'Part time', 'Contract', 'Freelance']);
    $('#selBLabel').textContent = hire ? 'Country' : 'Location';
    opts(selB, hire ? ['Any'].concat(PEOPLE.map(function (p) { return p.country; }).sort()) : ['Any', 'Fully remote', 'Location restricted']);
    $('#payLabel').textContent = hire ? 'Maximum expected pay' : 'Minimum pay';
    pay.value = hire ? 2500 : 0;
    q.placeholder = hire ? 'Try React or Kenya' : 'Try bookkeeper or healthcare';
    st.open = null;
  }

  function render() {
    var hire = mode() === 'hire', term = q.value.trim().toLowerCase(), p = +pay.value, html = '', n = 0, total;
    $('#payOut').textContent = hire ? (p >= 2500 ? 'Any amount' : 'Up to USD ' + money(p) + ' a month') : (p ? 'USD ' + money(p) + ' a month or more' : 'Any amount');
    if (hire) {
      total = PEOPLE.length;
      PEOPLE.forEach(function (x) {
        if (st.cat !== 'All' && x.cat !== st.cat) return;
        if (selA.value && x.avail !== selA.value) return;
        if (selB.value && x.country !== selB.value) return;
        if (p < 2500 && x.pay > p) return;
        if (exp.value && x.exp !== exp.value) return;
        if (term && (x.role + ' ' + x.skills + ' ' + x.country + ' ' + x.cat).toLowerCase().indexOf(term) < 0) return;
        n++;
        var ini = x.n.split(' ').map(function (s) { return s[0]; }).join('');
        html += '<li class="row' + (st.open === x.id ? ' is-open' : '') + '"><button type="button" class="row__top" data-open="' + x.id + '" aria-expanded="' + (st.open === x.id) + '">' +
          '<span class="row__ico">' + ini + '</span><span><span class="row__title">' + x.role + (st.short[x.id] ? ' <span class="tag tag--acc">Shortlisted</span>' : '') + '</span><span class="row__meta">' + x.n + ' · ' + x.country + ' · ' + x.yrs + ' years · ' + x.avail + '</span></span>' +
          '<span class="row__pay">USD ' + money(x.pay) + '<span>expected a month</span></span></button>' +
          '<div class="row__more"><dl><dt>Skills</dt><dd>' + x.skills + '</dd><dt>English</dt><dd>' + x.eng + '</dd><dt>Computer and internet</dt><dd>' + x.setup + '</dd></dl>' +
          '<p>The full profile, CV and voice introduction open after your employer account is approved.</p>' +
          '<div class="row__act" style="margin-top:14px"><button type="button" class="btn btn--sm ' + (st.short[x.id] ? 'btn--ghost' : 'btn--main') + '" data-short="' + x.id + '">' + (st.short[x.id] ? 'Remove from shortlist' : 'Shortlist') + '</button></div></div></li>';
      });
    } else {
      total = JOBS.length;
      JOBS.forEach(function (x) {
        if (st.cat !== 'All' && x.cat !== st.cat) return;
        if (selA.value && x.type !== selA.value) return;
        if (selB.value === 'Fully remote' && x.lim) return;
        if (selB.value === 'Location restricted' && !x.lim) return;
        if (p && x.hi < p) return;
        if (exp.value && x.exp !== exp.value) return;
        if (term && (x.title + ' ' + x.co + ' ' + x.skills + ' ' + x.cat + ' ' + x.type).toLowerCase().indexOf(term) < 0) return;
        n++;
        var a = st.applied[x.id];
        html += '<li class="row' + (st.open === x.id ? ' is-open' : '') + '"><button type="button" class="row__top" data-open="' + x.id + '" aria-expanded="' + (st.open === x.id) + '">' +
          '<span class="row__ico">' + x.cat.slice(0, 2).toUpperCase() + '</span><span><span class="row__title">' + x.title + ' <span class="tag' + (x.lim ? '' : ' tag--acc') + '">' + x.loc + '</span></span><span class="row__meta">' + x.co + ' · ' + x.type + ' · ' + x.exp + ' level</span></span>' +
          '<span class="row__pay">USD ' + money(x.lo) + ' to ' + money(x.hi) + '<span>a month</span></span></button>' +
          '<div class="row__more"><p>' + x.desc + '</p><dl><dt>Working hours</dt><dd>' + x.hours + '</dd><dt>Computer needed</dt><dd>' + x.pc + '</dd><dt>Apply by</dt><dd>' + x.due + '</dd></dl>' +
          '<div class="row__act">' + (a ? '<span class="done">Application received on ' + a + '. Status: Application Received.</span>' : '<button type="button" class="btn btn--sm btn--main" data-apply="' + x.id + '">Apply with your profile</button>') +
          '<button type="button" class="btn btn--sm btn--ghost" data-save="' + x.id + '">' + (st.saved[x.id] ? 'Saved' : 'Save job') + '</button></div></div></li>';
      });
    }
    list.innerHTML = html || '<li class="empty">Nothing matches these filters yet. Try a wider search.</li>';
    $('#count').innerHTML = '<b>' + n + '</b> of ' + total + (hire ? ' sample profiles' : ' sample roles');
    var k = Object.keys(hire ? st.short : st.applied).length, t = $('#tally');
    t.hidden = !k; t.textContent = hire ? 'Shortlist: ' + k : 'Applications: ' + k;
    remeasure();
  }

  $('#cats').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; st.cat = b.textContent; $$('button', this).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); render(); });
  [q, selA, selB, pay, exp].forEach(function (el) { el.addEventListener('input', render); });
  list.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (d.open) st.open = st.open === d.open ? null : d.open;
    if (d.apply) st.applied[d.apply] = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    if (d.save) st.saved[d.save] = !st.saved[d.save];
    if (d.short) { if (st.short[d.short]) delete st.short[d.short]; else st.short[d.short] = 1; }
    render();
  });

  /* ---------- the switch ---------- */
  function setMode(m, quiet) {
    root.setAttribute('data-mode', m);
    $$('[data-mode-btn]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode-btn') === m); });
    st.cat = 'All'; q.value = ''; exp.value = '';
    setupFilters(); render();
    if (!quiet) { try { history.replaceState(null, '', (m === 'work' ? '?view=jobseekers' : location.pathname) + location.hash); } catch (e) {} }
  }
  $$('[data-mode-btn]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode-btn')); }); });
  $$('[data-go]').forEach(function (a) { a.addEventListener('click', function () { setMode(a.getAttribute('data-go')); }); });
  setMode(mode(), true);

  /* ---------- hero depth: scroll and pointer move the planes ---------- */
  var scene = $('#scene'), hero = $('#hero');
  if (scene && !reduce) {
    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    function tick() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      scene.style.setProperty('--px', cx.toFixed(4)); scene.style.setProperty('--py', cy.toFixed(4));
      scene.style.setProperty('--sy', (Math.min(scrollY, hero.offsetHeight) * 0.6).toFixed(1));
      if (scrollY < hero.offsetHeight) requestAnimationFrame(tick); else running = false;
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }
    addEventListener('scroll', kick, { passive: true });
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      hero.addEventListener('pointermove', function (e) { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; kick(); });
      hero.addEventListener('pointerleave', function () { tx = ty = 0; kick(); });
    }
    kick();
  }

  /* ---------- the peak: one file fills in from the act's --sc-p ---------- */
  var act = $('#file'), doc = $('#doc');
  if (act && doc) {
    var caps = $$('.cap', act), blks = $$('.blk', doc), bars = $$('#docWave i'), steps = $$('#track li'), line = $('#track .track__line i');
    var T = [0.08, 0.24, 0.40, 0.56, 0.72], last = -1;
    function paint() {
      var p = parseFloat(act.style.getPropertyValue('--sc-p')) || 0;
      if (Math.abs(p - last) > 0.0005) {
        last = p;
        var ph = 0; T.forEach(function (t) { if (p >= t) ph++; });
        caps.forEach(function (c, i) { c.classList.toggle('is-on', i === ph); });
        blks.forEach(function (b, i) { b.classList.toggle('is-on', ph > i); b.classList.toggle('is-cur', ph === i + 1 || (ph === 0 && i === 0)); });
        var lit = Math.round(Math.max(0, Math.min(1, (p - 0.24) / 0.13)) * bars.length);
        bars.forEach(function (b, i) { b.classList.toggle('lit', i < lit); });
        var idx = p < 0.72 ? -1 : Math.min(4, Math.floor((p - 0.72) / 0.05));
        steps.forEach(function (s, i) { s.classList.toggle('is-on', i <= idx); });
        line.style.setProperty('--f', Math.max(0, idx) / 4);
        doc.classList.toggle('is-sel', idx === 4);
      }
      requestAnimationFrame(paint);
    }
    requestAnimationFrame(paint);
  }

  /* ---------- close: forms answer in place ---------- */
  var country = $('#country'), cur = $('#cur');
  country.innerHTML = DIALS.map(function (d) { return '<option>' + d[0] + '</option>'; }).join('');
  function dial() { var d = DIALS[country.selectedIndex]; $('#dial').textContent = d[1]; cur.innerHTML = '<option>USD</option>' + (d[2] !== 'USD' ? '<option>' + d[2] + '</option>' : ''); }
  country.addEventListener('change', dial); dial();
  $$('#panel form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = $$('[required]', f).filter(function (i) { return !i.value.trim() || (i.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value)); });
      if (bad.length) { $('.err', f).textContent = 'Please fill in every field, with a real email address.'; bad[0].focus(); return; }
      var hire = f.id === 'formHire';
      f.outerHTML = '<div class="thanks" data-for="' + (hire ? 'hire' : 'work') + '" tabindex="-1"><h3>' + (hire ? 'Request received.' : 'Profile started.') + '</h3><p>' +
        (hire ? 'On the live site this creates your employer account, emails you a confirmation and alerts the RemoteCore team.' : 'On the live site this creates your account and emails you a confirmation.') +
        '</p><p>This demo sends nothing and saves nothing.</p></div>';
      remeasure();
    });
  });

  /* ---------- login dialog ---------- */
  var dlg = $('#login');
  $('#loginBtn').addEventListener('click', function () { if (dlg.showModal) dlg.showModal(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  ScrollCraft.mount(document.body);
})();
