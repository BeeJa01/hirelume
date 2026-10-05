// ---- Config: the only block you edit when deploying ----
const API_BASE = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:8000"                       // your local backend port (check PORT in backend/src/config.js)
  : "https://hirelume-api.onrender.com";      // your deployed backend URL, no trailing slash
const ENDPOINTS = { auth: "/api/auth", jobs: "/api/jobs", applications: "/api/applications", cvs: "/api/cvs", analysis: "/api/analysis" };
const ROLE_HOME = { recruiter: "jobs.html", job_seeker: "landingpage.html" };

// ---- Session ----
const session = {
  get token() { return localStorage.getItem("hl_token"); },
  get user() { try { return JSON.parse(localStorage.getItem("hl_user")); } catch (e) { return null; } },
  save(d) { localStorage.setItem("hl_token", d.access_token); localStorage.setItem("hl_user", JSON.stringify(d.user)); },
  clear() { localStorage.removeItem("hl_token"); localStorage.removeItem("hl_user"); }
};
function requireAuth(role) {
  if (!session.token || (role && session.user && session.user.role !== role)) location.replace("login.html");
}
function logout() { session.clear(); location.href = "login.html"; }
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href="/logout"]');
  if (a) { e.preventDefault(); logout(); }
});

// ---- Helpers ----
const applyLink = (token) => location.origin + "/apply/" + token;
const levelOf = (s) => (s >= 80 ? "Strong" : s >= 60 ? "Good" : "Fair");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function errMsg(data, status) {
  const d = data && (data.detail || data.message || data.error);
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.message || x.msg || JSON.stringify(x)).join(", ");
  return "Something went wrong (" + status + ")";
}

// One wrapper for every JSON call. Throws Error(message) so pages can show it.
async function api(path, opts = {}) {
  const headers = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.auth !== false && session.token) headers.Authorization = "Bearer " + session.token;
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method: opts.method || "GET", headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
    });
  } catch (e) { throw new Error("Can't reach the server. Check your connection and try again."); }
  const data = await res.json().catch(() => null);
  if (res.status === 401 && opts.auth !== false) { logout(); throw new Error("Session expired"); }
  if (!res.ok) throw new Error(errMsg(data, res.status));
  return data;
}

// Login / signup submit (expects #form-error and a submit button inside the form)
async function submitAuth(form, path, body, redirectTo) {
  const err = form.querySelector("#form-error"), btn = form.querySelector("[type=submit]"), label = btn.textContent;
  err.classList.add("hidden"); btn.disabled = true; btn.textContent = "Please wait...";
  try {
    const d = await api(ENDPOINTS.auth + path, { method: "POST", body, auth: false });
    if (redirectTo) { location.href = redirectTo; return; }
    session.save(d);
    location.href = ROLE_HOME[d.user.role] || "jobs.html";
  } catch (e) {
    err.textContent = e.message; err.classList.remove("hidden");
    btn.disabled = false; btn.textContent = label;
  }
}

// Fill [data-user="name|first|initials|initial|email"] from the logged-in user
document.addEventListener("DOMContentLoaded", () => {
  const u = session.user; if (!u) return;
  const name = u.name || u.email || "", ini = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const map = { name, email: u.email || "", first: name.split(" ")[0], initials: ini, initial: ini[0] || "" };
  document.querySelectorAll("[data-user]").forEach((el) => { el.textContent = map[el.dataset.user] || ""; });
});

// ---- Open an applicant's CV (your original, unchanged) ----
async function openCV(applicationId) {
  const tab = window.open("", "_blank");
  if (!tab) throw new Error("Allow pop-ups to open the CV");
  try {
    const res = await fetch(API_BASE + ENDPOINTS.applications + "/" + applicationId + "/cv", {
      headers: { Authorization: "Bearer " + session.token }
    });
    if ((res.headers.get("content-type") || "").indexOf("application/json") !== -1) {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.detail || "Couldn't open the CV");
      if (data.blindMode && data.cv) {
        tab.document.title = "Blind CV";
        const pre = tab.document.createElement("pre");
        pre.style.cssText = "white-space:pre-wrap;font:14px/1.6 system-ui,sans-serif;max-width:720px;margin:24px auto;padding:0 16px";
        pre.textContent = data.cv.text;
        tab.document.body.appendChild(pre);
        return;
      }
      throw new Error("Unexpected response from the server");
    }
    if (!res.ok) throw new Error("Couldn't open the CV (" + res.status + ")");
    tab.location.href = URL.createObjectURL(await res.blob());
  } catch (err) {
    tab.close();
    throw err;
  }
}
