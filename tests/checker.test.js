/* tests/checker.test.js v1.0.0 (Last Rev: 2026-11-26) */
/* Certificate logic (js/checker.js) against the example certificates in tests/fixtures, made with OpenSSL:
   ca.pem (EC P-256 root, CA:TRUE), leaf.pem (RSA 2048, signed by ca.pem, three SANs), and xss.pem (self-signed,
   subject holds an HTML tag, valid for one day only). Expected values come from "openssl x509 -noout". */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const Checker = require("./load");

const pem = f => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8");
const NOW = new Date("2026-12-01T00:00:00Z");
const row = (cert, label) => (cert.rows.find(r => r[0] === label) || [])[1];

test("a pasted .ovpn-style bundle is split into labeled certificates, CA and leaf told apart", () => {
  const ovpn = `client\nremote vpn.example.com 1194\n<ca>\n${pem("ca.pem")}</ca>\n<cert>\n${pem("leaf.pem")}</cert>\n`;
  const { secrets, certs } = Checker.check(ovpn, NOW);
  assert.deepEqual(secrets, []);
  assert.equal(certs.length, 2);
  const [ca, leaf] = certs;

  assert.equal(ca.title, "Certificate 1: Northwind Example Root CA");
  assert.equal(ca.isCA, true);
  assert.equal(row(ca, "Issued By"), "Itself (self-signed root)");
  assert.equal(row(ca, "Public Key"), "EC P-256");
  assert.equal(row(ca, "SHA-256 Fingerprint"), "AB:5A:DB:0E:0E:92:70:65:F1:0B:24:CE:B3:76:7C:7F:3D:F8:5F:E3:7D:72:46:E6:59:3A:64:AC:CF:B8:D9:D5");
  assert.equal(row(ca, "Key Usage"), "keyCertSign, cRLSign");

  assert.equal(leaf.title, "Certificate 2: vpn.example.com");
  assert.equal(leaf.isCA, false);
  assert.equal(row(leaf, "Subject"), "/C=US/O=Northwind Traders/CN=vpn.example.com");
  assert.equal(row(leaf, "Issued By"), "Certificate 1 (signature checks out)");
  assert.equal(row(leaf, "Names (SAN)"), "vpn.example.com, www.example.com, IP: 192.0.2.10");
  assert.equal(row(leaf, "Public Key"), "RSA 2048 bits");
  assert.equal(row(leaf, "Serial"), "0E:B6:A7:D3:80:8F:23:ED:1C:ED:EE:25:85:96:E5:60:56:E1:30:94");
  assert.equal(row(leaf, "SHA-256 Fingerprint"), "78:CC:3C:31:59:45:10:2F:7C:43:D9:DF:77:0D:46:7C:CC:B2:24:78:09:6E:8E:48:27:08:6E:4A:9F:25:97:EC");
  assert.equal(row(leaf, "Valid From"), "2026-11-26 05:54 UTC");
  assert.equal(row(leaf, "Valid Until"), "2029-02-28 05:54 UTC");
  assert.equal(row(leaf, "Extended Key Usage"), "serverAuth, clientAuth");
  assert.equal(leaf.status.label, "Valid");
  assert.match(row(leaf, "Status"), /^Valid, 820 days left$/);
});

test("a certificate whose issuer was not pasted says so", () => {
  const { certs } = Checker.check(pem("leaf.pem"), NOW);
  assert.equal(row(certs[0], "Issued By"), "Not in the pasted text");
});

test("validity status: expired, expiring soon, and not valid yet", () => {
  const xss = pem("xss.pem"); // valid 2026-11-26 05:54 to 2026-11-27 05:54 UTC
  assert.equal(Checker.check(xss, NOW).certs[0].status.label, "Expired");
  assert.equal(Checker.check(xss, new Date("2026-11-26T12:00:00Z")).certs[0].status.label, "Expires Soon");
  const early = Checker.check(xss, new Date("2026-01-01T00:00:00Z")).certs[0];
  assert.equal(early.status.label, "Not Valid Yet");
  assert.equal(early.status.level, "bad");
});

test("hostile certificate fields come back as plain text for textContent, unchanged", () => {
  const { certs } = Checker.check(pem("xss.pem"), NOW);
  assert.equal(row(certs[0], "Subject"), "/CN=<img src=x onerror=alert(1)>");
});

test("private keys and OpenVPN static keys are counted, never parsed or returned", () => {
  const body = "MIIBVQIBADANBgkqhkiG9w0BAQEFAASCAT8wggE7AgEAAkEAexample";
  const text = [
    `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`,
    `-----BEGIN ENCRYPTED PRIVATE KEY-----\n${body}\n-----END ENCRYPTED PRIVATE KEY-----`,
    `-----BEGIN OPENSSH PRIVATE KEY-----\n${body}\n-----END OPENSSH PRIVATE KEY-----`,
    `-----BEGIN OpenVPN Static key V1-----\n0123abcd\n-----END OpenVPN Static key V1-----`,
  ].join("\n");
  const result = Checker.check(text, NOW);
  assert.deepEqual(result.secrets, ["PRIVATE KEY", "ENCRYPTED PRIVATE KEY", "OPENSSH PRIVATE KEY", "OpenVPN Static key V1"]);
  assert.equal(result.certs.length, 0);
  assert.doesNotMatch(JSON.stringify(result), /example|0123abcd/);
});

test("a damaged block gives a plain message and does not stop the others", () => {
  const broken = "-----BEGIN CERTIFICATE-----\nnot base64 at all\n-----END CERTIFICATE-----";
  const { certs } = Checker.check(`${broken}\n${pem("ca.pem")}`, NOW);
  assert.equal(certs.length, 2);
  assert.match(certs[0].error, /Could not read this block/);
  assert.equal(certs[1].isCA, true);
});

test("text with no PEM blocks returns nothing", () => {
  assert.deepEqual(Checker.check("hello", NOW), { secrets: [], certs: [] });
  assert.deepEqual(Checker.check("", NOW), { secrets: [], certs: [] });
});
