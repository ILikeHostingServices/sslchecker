/* tests/load.js v1.0.0 (Last Rev: 2026-11-26) */
/* Test loader: runs the page's scripts in Node the way the browser does (plain scripts sharing one global
   scope), in load order. jsrsasign declares its classes with top-level var, so it runs through vm, not require.
   Usage: const Checker = require("./load"); */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

globalThis.window = globalThis;
["js/vendor/jsrsasign-all-min.js", "js/version.js", "js/checker.js"].forEach(f => {
  const file = path.join(__dirname, "..", f);
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
});

module.exports = globalThis.Checker;
