/* js/app.js v2.0.1 (Last Rev: 2026-11-26) */
/* Page wiring: checks the pasted text on every change and draws one card per certificate. Every value goes in
   through textContent (certificate fields are attacker-chosen; tests/site.test.js fails on innerHTML). */
(function () {
  const $ = id => document.getElementById(id);
  const input = $("input"), results = $("results"), empty = $("empty");

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function card(title, badges) {
    const c = el("article", "card result");
    const head = el("div", "card-head");
    head.append(el("h3", "", title));
    const tags = el("div", "badges");
    badges.forEach(([cls, text]) => tags.append(el("span", `badge ${cls}`, text)));
    head.append(tags);
    c.append(head);
    return c;
  }

  function render() {
    const { secrets, certs } = Checker.check(input.value, new Date());
    results.replaceChildren();
    if (!secrets.length && !certs.length) {
      empty.textContent = input.value.trim() ? "No certificate or key blocks found in the pasted text." : "Paste a certificate to see what it is.";
      results.append(empty);
      return;
    }
    if (secrets.length) {
      const c = card("Private key Material Found", [["bad", `${secrets.length} not Read`]]);
      c.append(el("p", "", `This text holds ${secrets.join(", ")} block${secrets.length > 1 ? "s" : ""}. ` +
        "They are flagged here and never read or shown. Treat the file it came from as a secret."));
      results.append(c);
    }
    certs.forEach(cert => {
      if (cert.error) {
        const c = card(cert.title, [["bad", "Unreadable"]]);
        c.append(el("p", "", cert.error));
        results.append(c);
        return;
      }
      const c = card(cert.title, [[cert.isCA ? "ca" : "leaf", cert.isCA ? "CA Certificate" : "Leaf Certificate"],
        [cert.status.level, cert.status.label]]);
      const table = el("table", "kv");
      const body = el("tbody");
      cert.rows.forEach(([label, value]) => {
        const tr = el("tr");
        tr.append(el("th", "", label), el("td", "", value));
        tr.lastChild.setAttribute("translate", "no");
        body.append(tr);
      });
      table.append(body);
      c.append(table);
      results.append(c);
    });
  }

  input.addEventListener("input", render);
  $("clear").addEventListener("click", () => { input.value = ""; render(); input.focus(); });
  if (input.value) render(); // text kept by the browser on back/forward

  /* Footer: version, and build time from the page's Last-Modified (the Worker sets it to the deploy time). */
  const buildInfo = $("build-info");
  buildInfo.textContent = `Version ${Checker.VERSION}`;
  fetch(location.pathname, { method: "HEAD", cache: "no-store" })
    .then(res => res.headers.get("Last-Modified"))
    .then(h => {
      const d = h && new Date(h);
      if (!d || isNaN(d)) return;
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short",
      }).formatToParts(d).map(x => [x.type, x.value]));
      buildInfo.textContent += `, built ${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} ${p.timeZoneName}`;
    })
    .catch(() => {});
})();
