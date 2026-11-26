/* worker/index.js v1.0.0 (Last Rev: 2026-11-26) */
/* Worker entry point, modeled on the IT Reference Calculator's. Serves the static site from the ASSETS binding and:
   - 301-redirects any hostname other than PRIMARY_HOST (set in wrangler.jsonc) to it, keeping path and query, so
     sslchecker.syshost.app moves to sslchecker.ilhs.app;
   - 301-redirects the retired /local copy of the page (version 1) to the page itself;
   - adds a Last-Modified header from the deployed version's upload time (static assets carry none, so the
     footer's build time would be blank);
   - sends the security headers. The page loads nothing from other sites and makes no network calls except a
     HEAD request to itself for the build time, so everything is 'self' and connect-src allows no other host;
   - on staging (NOINDEX = "1"), sends noindex and a disallow-all robots.txt (Cloudflare Access is what actually
     keeps staging private). */
const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "font-src 'self'",
    "img-src 'self'",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const primary = (env.PRIMARY_HOST || "").trim().toLowerCase();
    if (primary && url.hostname !== primary && !url.hostname.endsWith(".workers.dev")) {
      url.protocol = "https:";
      url.hostname = primary;
      url.port = "";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/local" || url.pathname.startsWith("/local/")) {
      return Response.redirect(new URL("/", url).toString(), 301);
    }

    const noindex = env.NOINDEX === "1";
    if (noindex && url.pathname === "/robots.txt") {
      return finish(new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } }), env, noindex);
    }

    return finish(await env.ASSETS.fetch(request), env, noindex);
  },
};

// Copy a response and add the security headers, noindex on staging, and Last-Modified.
function finish(asset, env, noindex) {
  const response = new Response(asset.body, asset);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
  if (noindex) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  const deployed = env.CF_VERSION_METADATA && Date.parse(env.CF_VERSION_METADATA.timestamp);
  if (deployed && !response.headers.has("Last-Modified")) response.headers.set("Last-Modified", new Date(deployed).toUTCString());
  return response;
}
