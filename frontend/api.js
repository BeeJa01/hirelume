// ---- Config: the only block you edit when deploying ----
const API_BASE = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:8000"                       // your local backend port (check PORT in backend/src/config.js)
  : "http://hirelume.victorvakes.workers.dev";      // your deployed backend URL, no trailing slash
const ENDPOINTS = { auth: "/api/auth", jobs: "/api/jobs", applications: "/api/applications", cvs: "/api/cvs", analysis: "/api/analysis", pub: "/api/public", results: "/api/results" };
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
const applyLink = (token) => location.origin + "/apply?t=" + token;
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

// Multipart POST (apply form with CV)
async function apiForm(path, formData) {
  let res;
  try { res = await fetch(API_BASE + path, { method: "POST", body: formData }); }
  catch (e) { throw new Error("Can't reach the server. Check your connection and try again."); }
  const data = await res.json().catch(() => null);
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

// =====================================================================
// ---- PUBLIC APPLICATION FLOW (new applicant pages) ----
// Everything ABOVE this line is unchanged (older pages depend on it).
// Everything below is new and lives under one name, `applyFlow`, so it
// cannot clash with anything in the older pages.
// Used by: public-job-page, application-form, application-received,
//          application-result, interview-questions-application.
// Route paths: change only the `paths` block if the backend differs.
// =====================================================================
const applyFlow = {
  paths: {
    job:    (t) => ENDPOINTS.pub + "/jobs/" + encodeURIComponent(t),                    // GET
    apply:  (t) => ENDPOINTS.pub + "/jobs/" + encodeURIComponent(t) + "/applications",  // POST multipart
    result: (r) => ENDPOINTS.results + "/" + encodeURIComponent(r)                      // GET
  },

  // Backend error codes (the backend sends { detail: "CODE" }) -> friendly messages
  CODES: {
    JOB_NOT_FOUND: "We could not find this job. The link may be wrong.",
    JOB_CLOSED: "This job is no longer accepting applications.",
    CONSENT_REQUIRED: "Please tick the consent box.",
    CONSENT_VERSION_MISMATCH: "The consent text was updated. Please reload the page and try again.",
    DUPLICATE_APPLICATION: "You have already applied for this job with this email.",
    CV_REQUIRED: "Please upload your CV.",
    CV_UNSUPPORTED_FORMAT: "Your CV must be a PDF or DOCX file.",
    CV_EMPTY: "That CV file is empty.",
    CV_INVALID_CONTENT: "We could not read that CV. Please upload a real PDF or DOCX file, not a renamed one.",
    INVALID_RESULT_TOKEN: "We could not find this result.",
    APPLICATION_ALREADY_LINKED: "This application is already linked to another account.",
    APPLICATION_EMAIL_MISMATCH: "Please use the same email address you applied with."
  },

  // ---- tokens carried from page to page (?t=job token, ?r=result token) ----
  qs(k) { return new URLSearchParams(location.search).get(k) || ""; },
  jobToken() {
    const t = applyFlow.qs("t") || sessionStorage.getItem("hl_job_token") || "";
    if (t) sessionStorage.setItem("hl_job_token", t);
    return t;
  },
  resultToken() {
    const t = applyFlow.qs("r") || applyFlow.qs("result") || sessionStorage.getItem("hl_result_token") || "";
    if (t) sessionStorage.setItem("hl_result_token", t);
    return t;
  },
  // Build a link to another page, carrying the tokens along
  link(page, withResult) {
    const p = new URLSearchParams(), t = applyFlow.jobToken(), r = withResult ? applyFlow.resultToken() : "";
    if (t) p.set("t", t);
    if (r) p.set("r", r);
    const s = p.toString();
    return page + (s ? "?" + s : "");
  },

  // ---- request helper: like api() but keeps status/code on the error and never logs the user out ----
  async req(path, opts = {}) {
    const useAuth = !!(opts.auth && session.token);
    const go = (withAuth) => fetch(API_BASE + path, { method: opts.method || "GET", headers: withAuth ? { Authorization: "Bearer " + session.token } : {}, body: opts.form });
    let res;
    // A stale login token must not break a public page: if the server answers 401, retry once without it
    try { res = await go(useAuth); if (res.status === 401 && useAuth) res = await go(false); }
    catch (e) { const er = new Error("Can't reach the server. Check your connection and try again."); er.network = true; throw er; }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const det = data && typeof data.detail === "string" ? data.detail : "";
      const er = new Error(applyFlow.CODES[det] || errMsg(data, res.status));
      er.status = res.status;
      er.code = det || (data && (data.code || data.error_code || (typeof data.error === "string" ? data.error : ""))) || "";
      er.data = data;
      throw er;
    }
    return data;
  },

  // ---- small normalisers (so pages don't care about exact field names) ----
  txt(x) {
    if (x == null) return "";
    if (typeof x === "object") return String(x.text || x.title || x.name || x.skill || x.requirement || x.gap || x.description || x.question || x.label || "").trim();
    return String(x).trim();
  },
  // true = Required, false = Nice-to-have, null = unknown
  flag(x) {
    if (!x || typeof x !== "object") return null;
    const v = x.required !== undefined && x.required !== null ? x.required : x.is_required;
    if (v !== undefined && v !== null) return !!v;
    const lvl = String(x.requirement_type || x.type || x.importance || x.priority || x.level || x.kind || x.category || "").toLowerCase();
    if (!lvl) return null;
    return !/nice|optional|preferred|bonus/.test(lvl);
  },
  pretty(s) {
    s = String(s || "").replace(/[_-]+/g, " ").trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  },

  // ---- 1) Public job: GET /api/public/jobs/:token ----
  normReqs(j) {
    const out = [];
    const push = (x, req) => {
      const text = applyFlow.txt(x); if (!text) return;
      const f = req !== undefined ? req : applyFlow.flag(x);
      out.push({ text, required: f !== false });
    };
    const src = j.requirements || j.skills || [];
    if (Array.isArray(src)) src.forEach((x) => push(x));
    else if (src && typeof src === "object") {
      Object.keys(src).forEach((k) => (Array.isArray(src[k]) ? src[k] : []).forEach((x) => push(x, !/nice|optional|preferred|bonus/i.test(k))));
    }
    (Array.isArray(j.required_skills) ? j.required_skills : []).forEach((x) => push(x, true));
    (Array.isArray(j.nice_to_have_skills) ? j.nice_to_have_skills : Array.isArray(j.nice_to_have) ? j.nice_to_have : []).forEach((x) => push(x, false));
    return out;
  },
  normJob(raw) {
    const j = (raw && (raw.job || raw.data)) || raw || {};
    const status = String(j.status || "").toLowerCase();
    const closed = j.is_open === false || j.open === false || j.accepting_applications === false ||
      ["closed", "archived", "expired", "filled", "inactive"].includes(status);
    const reqs = applyFlow.normReqs(j);
    const consent = j.consent && typeof j.consent === "object" ? j.consent : {};
    return {
      title: applyFlow.txt(j.title || j.job_title || j.name),
      company: applyFlow.txt(j.company || j.company_name || j.organization || j.employer),
      location: applyFlow.txt(j.location),
      type: applyFlow.txt(j.job_type || j.employment_type || j.type),
      posted: j.posted_at || j.published_at || j.created_at || j.createdAt || "",
      description: applyFlow.txt(j.description || j.about || j.summary),
      duties: (Array.isArray(j.responsibilities) ? j.responsibilities : Array.isArray(j.duties) ? j.duties : []).map((x) => applyFlow.txt(x)).filter(Boolean),
      reqs,
      requiredCount: reqs.filter((r) => r.required).length,
      niceCount: reqs.filter((r) => !r.required).length,
      consentText: applyFlow.txt(j.consent_text || consent.text),
      consentVersion: applyFlow.txt(j.consent_version || consent.version),
      closed
    };
  },
  async getJob(token) { return applyFlow.normJob(await applyFlow.req(applyFlow.paths.job(token))); },
  isClosedError(e) { return !!e && (e.status === 410 || e.code === "JOB_CLOSED" || /closed|no longer|expired|not accepting/i.test((e.code || "") + " " + (e.message || ""))); },

  // ---- 2) Submit: POST /api/public/jobs/:token/applications (multipart) ----
  // f = { name, email, phone, file, consentVersion, feedbackOptIn }  -> returns the result token
  async submit(token, f) {
    if (!f.consentVersion) throw new Error("Please reload the page and try again.");
    const fd = new FormData();
    fd.append("name", f.name);
    fd.append("email", f.email);
    fd.append("phone", f.phone);
    fd.append("cv", f.file);
    fd.append("consent", "true");
    fd.append("consent_version", f.consentVersion);
    fd.append("feedback_opt_in", f.feedbackOptIn ? "true" : "false");
    const d = await applyFlow.req(applyFlow.paths.apply(token), { method: "POST", form: fd });
    const rt = d && (d.result_token || d.resultToken || (d.data && (d.data.result_token || d.data.resultToken)));
    if (!rt) throw new Error("Your application was sent, but we did not get a reference back. Please contact the recruiter.");
    sessionStorage.setItem("hl_result_token", rt);
    return rt;
  },
  // Friendly message for a failed submit
  applyError(e) {
    if (e.network) return e.message;
    if (e.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
    if (e.status === 413 || /too large|file size|5 ?mb/i.test(e.message || "")) return "Your CV is over 5 MB. Please upload a smaller file.";
    if (/^[A-Z_]{4,}$/.test(e.message || "")) return "Something went wrong. Please try again.";
    return e.message;
  },

  // ---- 3) Result: GET /api/results/:token ----
  // Backend (cvController.getResult + services/analysis) sends:
  //   analysis_status, application_id, feedback_enabled, feedback_opt_in, feedback_available, questions[] (strings)
  //   and only when feedback_available: score, match_level (strong|moderate|weak), reason, skills[], experience[], guidance[] (strings)
  normResult(raw) {
    const r = (raw && raw.data) || raw || {};
    const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    const strs = (v) => list(v).map((x) => applyFlow.txt(x)).filter(Boolean);
    let score = r.score;
    score = score == null || isNaN(Number(score)) ? null : Math.round(Number(score));
    const st = String(r.analysis_status || "").toLowerCase();
    const state = /complet/.test(st) ? "completed" : /fail|error|unavailable/.test(st) ? "failed" : "pending";
    const level = applyFlow.pretty(applyFlow.txt(r.match_level)) || (score != null ? levelOf(score) : "");
    return {
      state, score, level,
      applicationId: r.application_id ? String(r.application_id) : "",
      feedbackEnabled: !!r.feedback_enabled,
      feedbackAvailable: !!r.feedback_available,
      reason: applyFlow.txt(r.reason),
      skills: strs(r.skills),
      experience: strs(r.experience),
      tips: strs(r.guidance),
      questions: strs(r.questions).map((text) => ({ text, group: "" })),
      // not sent by the backend; pages hide them when empty
      jobTitle: "", company: "", submittedAt: ""
    };
  },
  async getResult(token) { return applyFlow.normResult(await applyFlow.req(applyFlow.paths.result(token), { auth: true })); },

  // Poll the result until analysis is completed. onState(result, error) runs on every poll.
  // Every 3s for the first minute, then every 15s (backend retries failed analyses in the background).
  // Returns a stop() function.
  poll(token, onState) {
    let stopped = false, n = 0, timer = null;
    const tick = async () => {
      if (stopped) return;
      try {
        const r = await applyFlow.getResult(token);
        if (stopped) return;
        onState(r, null);
        if (r.state === "completed") return;
      } catch (e) {
        if (stopped) return;
        onState(null, e);
        if (e.status === 404 || e.status === 403) return;
      }
      n++;
      timer = setTimeout(tick, n < 20 ? 3000 : 15000);
    };
    tick();
    return () => { stopped = true; clearTimeout(timer); };
  }
};
