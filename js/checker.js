/* js/checker.js v2.0.1 (Last Rev: 2026-11-26) */
/* Certificate logic, no DOM: finds PEM blocks in pasted text and describes each certificate with jsrsasign
   (js/vendor/jsrsasign-all-min.js, which defines the X509, KJUR, and zulutodate globals). Private keys and
   OpenVPN static keys are counted by their BEGIN line only; their contents are never parsed or returned.
   Every value returned is plain text: js/app.js must render it with textContent, never as HTML, because
   certificate fields are chosen by whoever made the certificate. */
window.Checker = window.Checker || {};

(function () {
  const CERT_RE = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
  // Any "... PRIVATE KEY" label (PKCS#8, RSA, EC, DSA, ENCRYPTED, OPENSSH) and OpenVPN tls-auth / tls-crypt keys.
  const SECRET_RE = /-----BEGIN ((?:[A-Z0-9]+ )*PRIVATE KEY|OpenVPN Static key V1)-----/g;
  const DAY = 86400000;
  const SOON_DAYS = 30;
  const CURVES = { secp256r1: "P-256", secp384r1: "P-384", secp521r1: "P-521" };

  // Hex string to "AB:CD:..." in upper case.
  const colons = hex => hex.toUpperCase().replace(/(..)(?!$)/g, "$1:");

  // "2029-02-28 05:54 UTC"
  const utc = d => d.toISOString().slice(0, 16).replace("T", " ") + " UTC";

  function sans(x) {
    const ext = x.getExtSubjectAltName();
    if (!ext || !ext.array) return "";
    return ext.array.map(n => {
      const [type, value] = Object.entries(n)[0];
      const text = typeof value === "string" ? value : (value && (value.str || value.hex)) || "";
      return type === "dns" ? text : `${type.toUpperCase()}: ${text}`;
    }).join(", ");
  }

  function keyText(x) {
    const k = x.getPublicKey();
    if (k.type === "RSA" && k.n) return `RSA ${k.n.bitLength()} bits`;
    if (k.type === "EC") return `EC ${CURVES[k.curveName] || k.curveName}`;
    return k.type || "Unknown";
  }

  // Signature check that never throws: unsupported algorithms count as "not confirmed".
  function signedBy(cert, issuer) {
    try { return cert.verifySignature(issuer.getPublicKey()) === true; } catch (e) { return false; }
  }

  function validity(x, now) {
    const from = zulutodate(x.getNotBefore()), until = zulutodate(x.getNotAfter());
    if (now < from) return { level: "bad", label: "Not Valid yet", text: `Not valid yet: starts in ${Math.ceil((from - now) / DAY)} days`, from, until };
    if (now > until) return { level: "bad", label: "Expired", text: `Expired ${Math.floor((now - until) / DAY)} days ago`, from, until };
    const left = Math.floor((until - now) / DAY);
    return { level: left < SOON_DAYS ? "warn" : "ok", label: left < SOON_DAYS ? "Expires Soon" : "Valid", text: `Valid, ${left} days left`, from, until };
  }

  // Which pasted certificate signed this one: itself, another block, or none found.
  function issuedBy(i, parsed) {
    const me = parsed[i];
    const issuer = me.x.getIssuerString();
    if (issuer === me.x.getSubjectString()) {
      return signedBy(me.x, me.x) ? "Itself (self-signed root)" : "Itself by name, but its signature does not check out";
    }
    const match = parsed.findIndex((p, j) => j !== i && p.x && p.x.getSubjectString() === issuer && signedBy(me.x, p.x));
    return match >= 0 ? `Certificate ${match + 1} (signature checks out)` : "Not in the pasted text";
  }

  /* Returns { secrets: ["PRIVATE KEY", ...], certs: [{ title, isCA, status, rows: [[label, value], ...] } or
     { title, error }] }. "now" is a Date (passed in so tests do not depend on the clock). */
  Checker.check = function (text, now) {
    const secrets = [...String(text).matchAll(SECRET_RE)].map(m => m[1]);
    const parsed = (String(text).match(CERT_RE) || []).map(pem => {
      try {
        const x = new X509();
        x.readCertPEM(pem);
        x.getSubjectString(); // throws here when the block is not a certificate
        return { x };
      } catch (e) {
        return { error: "Could not read this block as a certificate. Check that it was copied whole." };
      }
    });

    const certs = parsed.map((p, i) => {
      if (p.error) return { title: `Certificate ${i + 1}`, error: p.error };
      const x = p.x;
      const bc = x.getExtBasicConstraints();
      const isCA = !!(bc && bc.cA);
      const v = validity(x, now);
      const ku = x.getExtKeyUsage(), eku = x.getExtExtKeyUsage();
      const rows = [
        ["Subject", x.getSubjectString()],
        ["Issuer", x.getIssuerString()],
        ["Issued by", issuedBy(i, parsed)],
        ["Valid From", utc(v.from)],
        ["Valid Until", utc(v.until)],
        ["Status", v.text],
        ["Names (SAN)", sans(x)],
        ["Public key", keyText(x)],
        ["Signature", x.getSignatureAlgorithmName()],
        ["Key Usage", ku && ku.names ? ku.names.join(", ") : ""],
        ["Extended key Usage", eku && eku.array ? eku.array.join(", ") : ""],
        ["Serial", colons(x.getSerialNumberHex())],
        ["SHA-256 Fingerprint", colons(KJUR.crypto.Util.hashHex(x.hex, "sha256"))],
        ["SHA-1 Thumbprint", colons(KJUR.crypto.Util.hashHex(x.hex, "sha1"))],
      ].filter(r => r[1]);
      const cn = (x.getSubjectString().match(/\/CN=([^/]*)/) || [])[1];
      return { title: `Certificate ${i + 1}${cn ? `: ${cn}` : ""}`, isCA, status: v, rows };
    });

    return { secrets, certs };
  };
})();
