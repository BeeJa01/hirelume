
// ---- Config: the only block you edit when deploying ----
const API_BASE = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:8000"
  : "https://hirelume-api.onrender.com";

const ENDPOINTS = {
  auth: "/api/auth",
  jobs: "/api/jobs",
  applications: "/api/applications",
  cvs: "/api/cvs",
  analysis: "/api/analysis",
  pub: "/api/public",
  results: "/api/results",
  shortlist: "/api/shortlist"
};

const ROLE_HOME = {
  recruiter: "jobs.html",
  job_seeker: "job-seeker-home.html"
};


// ---- Loader: full-screen overlay + button spinner (shared by every page) ----
const hlLoader = (() => {
  let count = 0, showTimer = null, slowTimer = null, el = null, msgEl = null, lastMsg = "";

  const css =
    ".hl-spin{display:inline-block;width:1em;height:1em;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:hl-rot .7s linear infinite;vertical-align:-0.15em;margin-right:.5em;flex:none}" +
    ".hl-spin-lg{width:46px;height:46px;border-width:4px;margin:0;color:#2563eb;border-right-color:#dbeafe;vertical-align:baseline}" +
    ".hl-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(248,250,252,.82);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);animation:hl-fade .15s ease-out}" +
    ".hl-card{display:flex;flex-direction:column;align-items:center;gap:14px;max-width:280px;padding:26px 30px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,23,42,.12);text-align:center;font-family:Inter,ui-sans-serif,system-ui,sans-serif}" +
    ".hl-msg{font-size:14px;font-weight:600;color:#0f172a;line-height:1.4}" +
    ".hl-sub{font-size:12px;color:#64748b;min-height:16px}" +
    "@keyframes hl-rot{to{transform:rotate(360deg)}}" +
    "@keyframes hl-fade{from{opacity:0}to{opacity:1}}" +
    "@media (prefers-reduced-motion:reduce){.hl-spin{animation-duration:1.6s}.hl-overlay{animation:none}}";

  function injectCss() {
    if (document.getElementById("hl-loader-css")) return;
    const st = document.createElement("style");
    st.id = "hl-loader-css";
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }
  injectCss();

  function render(msg) {
    injectCss();
    if (el) return;
    el = document.createElement("div");
    el.className = "hl-overlay";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.innerHTML =
      '<div class="hl-card"><span class="hl-spin hl-spin-lg" aria-hidden="true"></span>' +
      '<p class="hl-msg"></p><p class="hl-sub"></p></div>';
    msgEl = el.querySelector(".hl-msg");
    msgEl.textContent = msg || lastMsg || "Please wait...";
    (document.body || document.documentElement).appendChild(el);
    slowTimer = setTimeout(() => {
      const sub = el && el.querySelector(".hl-sub");
      if (sub) sub.textContent = "Still working... this can take a few seconds.";
    }, 6000);
  }

  return {
    show(msg) {
      count++;
      if (msg) lastMsg = msg;
      if (el && msg && msgEl) msgEl.textContent = msg;
      if (count === 1) showTimer = setTimeout(() => render(msg), 150);
    },
    hide() {
      count = Math.max(0, count - 1);
      if (count) return;
      clearTimeout(showTimer);
      clearTimeout(slowTimer);
      if (el) { el.remove(); el = null; msgEl = null; }
      lastMsg = "";
    },
    // hlLoader.wrap(promise, "Loading...") keeps the overlay up until the promise settles
    wrap(promise, msg) {
      hlLoader.show(msg);
      return Promise.resolve(promise).finally(() => hlLoader.hide());
    },
    // Button spinner: setBusy(btn, true, "Logging in...") ... setBusy(btn, false)
    btn(btn, busy, text) {
      if (!btn) return;
      injectCss();
      if (busy) {
        if (btn.dataset.hlLabel === undefined) btn.dataset.hlLabel = btn.innerHTML;
        btn.disabled = true;
        btn.setAttribute("aria-busy", "true");
        btn.innerHTML = '<span class="hl-spin" aria-hidden="true"></span>';
        btn.appendChild(document.createTextNode(text || "Please wait..."));
      } else {
        if (btn.dataset.hlLabel !== undefined) {
          btn.innerHTML = btn.dataset.hlLabel;
          delete btn.dataset.hlLabel;
        }
        btn.removeAttribute("aria-busy");
        btn.disabled = false;
      }
    }
  };
})();

// Decide whether a request gets the full-screen overlay, and what it says.
function hlLoaderLabel(path, method) {
  method = (method || "GET").toUpperCase();
  if (/\/api\/events|\/analytics|\/engagement|\/check/.test(path)) return null; // background pings
  if (/\/auth\/login/.test(path)) return "Logging you in...";
  if (/\/auth\/register/.test(path)) return "Creating your account...";
  if (/\/auth\/forgot-password/.test(path)) return "Sending your reset link...";
  if (/\/auth\/reset-password/.test(path)) return "Resetting your password...";
  if (method === "GET") return null;
  if (/\/api\/analysis|\/api\/cvs|\/api\/flow2/.test(path)) return "Analysing your CV...";
  if (/\/applications\/link/.test(path)) return "Saving your result...";
  if (/\/applications/.test(path)) return "Submitting your application...";
  if (/\/api\/jobs/.test(path)) return "Saving...";
  return "Please wait...";
}

// fetch() with the loader attached
function hlFetch(url, init, force) {
  const path = String(url).replace(API_BASE, "");
  const label = force === false ? null : (force || hlLoaderLabel(path, init && init.method));
  if (!label) return fetch(url, init);
  hlLoader.show(label);
  return fetch(url, init).finally(() => hlLoader.hide());
}

// ---- Session ----
const session = {
  get token() {
    return localStorage.getItem("hl_token");
  },

  get user() {
    try {
      return JSON.parse(localStorage.getItem("hl_user"));
    } catch (e) {
      return null;
    }
  },

  save(d) {
    localStorage.setItem("hl_token", d.access_token);
    localStorage.setItem("hl_user", JSON.stringify(d.user));
  },

  clear() {
    localStorage.removeItem("hl_token");
    localStorage.removeItem("hl_user");
  }
};

function requireAuth(role) {
  if (
    !session.token ||
    (role && session.user && session.user.role !== role)
  ) {
    location.replace("login.html");
  }
}

function logout() {
  session.clear();
  location.href = "login.html";
}

document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href="/logout"]');

  if (a) {
    e.preventDefault();
    logout();
  }
});

// ---- Helpers ----
const applyLink = (token) =>
  location.origin + "/public-job-page?t=" + token;

const levelOf = (s) =>
  s >= 80 ? "Strong" : s >= 60 ? "Good" : "Fair";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : "";

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function errMsg(data, status) {
  const d = data && (data.detail || data.message || data.error);

  if (typeof d === "string") return d;

  if (Array.isArray(d)) {
    return d
      .map((x) => x.message || x.msg || JSON.stringify(x))
      .join(", ");
  }

  return "Something went wrong (" + status + ")";
}

// ---- Standard JSON API wrapper ----
async function api(path, opts = {}) {
  const headers = {};

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (opts.auth !== false && session.token) {
    headers.Authorization = "Bearer " + session.token;
  }

  let res;

  try {
    res = await hlFetch(API_BASE + path, {
      method: opts.method || "GET",
      headers,
      body:
        opts.body !== undefined
          ? JSON.stringify(opts.body)
          : undefined
    }, opts.loader);
  } catch (e) {
    throw new Error(
      "Can't reach the server. Check your connection and try again."
    );
  }

  const data = await res.json().catch(() => null);

  if (res.status === 401 && opts.auth !== false) {
    logout();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    throw new Error(errMsg(data, res.status));
  }

  return data;
}

// ---- Multipart API wrapper ----
async function apiForm(path, formData) {
  let res;

  try {
    res = await hlFetch(API_BASE + path, {
      method: "POST",
      body: formData
    });
  } catch (e) {
    throw new Error(
      "Can't reach the server. Check your connection and try again."
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(errMsg(data, res.status));
  }

  return data;
}

// ---- Login / signup submit ----
async function submitAuth(form, path, body, redirectTo) {
  const err = form.querySelector("#form-error");
  const btn = form.querySelector("[type=submit]");

  err.classList.add("hidden");
  hlLoader.btn(btn, true, path === "/login" ? "Logging in..." : "Please wait...");

  try {
    const d = await api(ENDPOINTS.auth + path, {
      method: "POST",
      body,
      auth: false
    });

    if (redirectTo) {
      location.href = redirectTo;
      return;
    }

    session.save(d);
    location.href = ROLE_HOME[d.user.role] || "jobs.html";
  } catch (e) {
    err.textContent = e.message;
    err.classList.remove("hidden");
    hlLoader.btn(btn, false);
  }
}

// ---- Fill logged-in user details ----
document.addEventListener("DOMContentLoaded", () => {
  const u = session.user;
  if (!u) return;

  const name = u.name || u.email || "";
  const ini = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const map = {
    name,
    email: u.email || "",
    first: name.split(" ")[0],
    initials: ini,
    initial: ini[0] || ""
  };

  document.querySelectorAll("[data-user]").forEach((el) => {
    el.textContent = map[el.dataset.user] || "";
  });
});


// ---- Profile avatar (GET needs the auth header, so it is fetched as a blob) ----
const hlAvatar = {
  _url: null,

  async fetchUrl(force) {
    const u = session.user;
    if (!u || !u.avatar_url || !session.token) return null;
    if (hlAvatar._url && !force) return hlAvatar._url;
    try {
      const res = await fetch(API_BASE + u.avatar_url, {
        headers: { Authorization: "Bearer " + session.token }
      });
      if (!res.ok) return null;
      hlAvatar._url = URL.createObjectURL(await res.blob());
      return hlAvatar._url;
    } catch (e) {
      return null;
    }
  },

  // Put the photo on every [data-avatar] element. Initials stay as the fallback.
  async apply(force) {
    const els = document.querySelectorAll("[data-avatar]");
    if (!els.length) return;
    const url = await hlAvatar.fetchUrl(force);
    els.forEach((el) => {
      if (el.tagName === "IMG") {
        if (url) el.src = url; else el.removeAttribute("src");
        el.classList.toggle("hidden", !url && el.hasAttribute("data-avatar-hide"));
        return;
      }
      if (url) {
        el.style.backgroundImage = "url(" + url + ")";
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.style.color = "transparent";
      } else {
        el.style.backgroundImage = "";
        el.style.color = "";
      }
    });
  },

  async upload(file) {
    const fd = new FormData();
    fd.append("avatar", file);
    hlLoader.show("Uploading your photo...");
    let res;
    try {
      res = await fetch(API_BASE + "/api/users/me/avatar", {
        method: "POST",
        headers: { Authorization: "Bearer " + session.token },
        body: fd
      });
    } catch (e) {
      throw new Error("Can't reach the server. Check your connection and try again.");
    } finally {
      hlLoader.hide();
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const code = data && data.detail;
      throw new Error(
        {
          AVATAR_UNSUPPORTED_FORMAT: "Use a PNG, JPG or WebP image.",
          AVATAR_INVALID_CONTENT: "That file doesn't look like a real image.",
          AVATAR_EMPTY: "That file is empty.",
          AVATAR_REQUIRED: "Choose a photo first."
        }[code] || errMsg(data, res.status)
      );
    }
    session.save({ access_token: session.token, user: Object.assign({}, session.user, { avatar_url: data.avatar_url }) });
    hlAvatar._url = null;
    await hlAvatar.apply(true);
    return data;
  },

  async remove() {
    await api("/api/users/me/avatar", { method: "DELETE", loader: "Removing your photo..." });
    session.save({ access_token: session.token, user: Object.assign({}, session.user, { avatar_url: null }) });
    hlAvatar._url = null;
    await hlAvatar.apply(true);
  }
};

document.addEventListener("DOMContentLoaded", () => hlAvatar.apply());

// ---- Open an applicant's CV ----
async function openCV(applicationId) {
  const tab = window.open("", "_blank");

  if (!tab) {
    throw new Error("Allow pop-ups to open the CV");
  }

  try {
    const res = await fetch(
      API_BASE + ENDPOINTS.applications + "/" +
        encodeURIComponent(applicationId) + "/cv",
      {
        headers: {
          Authorization: "Bearer " + session.token
        }
      }
    );

    if (
      (res.headers.get("content-type") || "")
        .includes("application/json")
    ) {
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || data.detail || "Couldn't open the CV"
        );
      }

      if (data.blindMode && data.cv) {
        tab.document.title = "Blind CV";

        const pre = tab.document.createElement("pre");
        pre.style.cssText =
          "white-space:pre-wrap;font:14px/1.6 system-ui,sans-serif;" +
          "max-width:720px;margin:24px auto;padding:0 16px";

        pre.textContent = data.cv.text;
        tab.document.body.appendChild(pre);
        return;
      }

      throw new Error("Unexpected response from the server");
    }

    if (!res.ok) {
      throw new Error("Couldn't open the CV (" + res.status + ")");
    }

    tab.location.href = URL.createObjectURL(await res.blob());
  } catch (err) {
    tab.close();
    throw err;
  }
}

// =====================================================================
// ---- SHORTLIST API ----
// PATCH /api/shortlist/:applicationId/shortlist
// Requires a logged-in recruiter.
// =====================================================================

async function shortlistApplicant(applicationId) {
  if (!applicationId) {
    throw new Error("Application ID is required.");
  }

  if (!session.token) {
    location.replace("login.html");
    throw new Error("Please log in to shortlist an applicant.");
  }

  if (session.user && session.user.role !== "recruiter") {
    throw new Error("Only recruiters can shortlist applicants.");
  }

  return api(
    ENDPOINTS.shortlist + "/" +
      encodeURIComponent(applicationId) + "/shortlist",
    {
      method: "PATCH",
      auth: true
    }
  );
}

// Connect this function to a Shortlist button.
async function handleShortlist(applicationId, button) {
  if (!button) {
    throw new Error("Shortlist button was not found.");
  }

  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "Shortlisting...";

  try {
    const result = await shortlistApplicant(applicationId);

    button.textContent = "Shortlisted";

    if (typeof window.showToast === "function") {
      window.showToast(
        result.message || "Applicant shortlisted successfully."
      );
    } else {
      alert(
        result.message || "Applicant shortlisted successfully."
      );
    }

    return result;
  } catch (error) {
    button.textContent = originalText;

    if (typeof window.showToast === "function") {
      window.showToast(error.message);
    } else {
      alert(error.message);
    }

    throw error;
  } finally {
    if (button.textContent !== "Shortlisted") {
      button.disabled = false;
    }
  }
}

// =====================================================================
// ---- PUBLIC APPLICATION FLOW ----
// =====================================================================

const applyFlow = {
  paths: {
    job: (t) =>
      ENDPOINTS.pub + "/jobs/" + encodeURIComponent(t),

    apply: (t) =>
      ENDPOINTS.pub + "/jobs/" + encodeURIComponent(t) +
      "/applications",

    result: (r) =>
      ENDPOINTS.results + "/" + encodeURIComponent(r)
  },

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
    CV_TOO_LARGE: "Your CV is over 5 MB. Please upload a smaller file.",
    UNEXPECTED_FILE: "Something was wrong with the file you attached. Please try again.",
    RATE_LIMIT_EXCEEDED: "Too many attempts. Please wait a few minutes and try again.",
    INTERNAL_SERVER_ERROR: "The server had a problem. Please try again in a moment.",
    ACCOUNT_ALREADY_EXISTS: "An account with this email already exists. Please log in to see your result.",
    INVALID_CREDENTIALS: "Wrong email or password.",
    APPLICATION_ALREADY_LINKED: "This application is already linked to another account.",
    APPLICATION_EMAIL_MISMATCH: "Please use the same email address you applied with."
  },

  qs(k) {
    return new URLSearchParams(location.search).get(k) || "";
  },

  jobToken() {
    const t =
      applyFlow.qs("t") ||
      sessionStorage.getItem("hl_job_token") ||
      "";

    if (t) sessionStorage.setItem("hl_job_token", t);
    return t;
  },

  resultToken() {
    const t =
      applyFlow.qs("r") ||
      applyFlow.qs("result") ||
      sessionStorage.getItem("hl_result_token") ||
      "";

    if (t) sessionStorage.setItem("hl_result_token", t);
    return t;
  },

  page(name) {
    return /\.html$/.test(location.pathname) ||
      location.protocol === "file:"
      ? name
      : name.replace(/\.html$/, "");
  },

  link(page, withResult) {
    const p = new URLSearchParams();
    const t = applyFlow.jobToken();
    const r = withResult ? applyFlow.resultToken() : "";

    if (t) p.set("t", t);
    if (r) p.set("r", r);

    const s = p.toString();

    return applyFlow.page(page) + (s ? "?" + s : "");
  },

  safeNext() {
    const n = applyFlow.qs("next");

    return /^[A-Za-z0-9_\-]+(\.html)?(\?[A-Za-z0-9_\-=&%.]*)?$/.test(n)
      ? n
      : "";
  },

  async login(form, body, next) {
    const err = form.querySelector("#form-error");
    const btn = form.querySelector("[type=submit]");

    err.classList.add("hidden");
    hlLoader.btn(btn, true, "Logging in...");

    try {
      const d = await api(ENDPOINTS.auth + "/login", {
        method: "POST",
        body,
        auth: false
      });

      session.save(d);

      const r = new URLSearchParams(
        (next || "").split("?")[1] || ""
      ).get("r");

      if (r && d.user.role === "job_seeker") {
        try {
          await api(ENDPOINTS.applications + "/link", {
            method: "POST",
            body: { result_token: r }
          });
        } catch (e) {
          // The result page handles unsuccessful linking.
        }
      }

      location.href = next;
    } catch (e) {
      err.textContent = applyFlow.CODES[e.message] || e.message;
      err.classList.remove("hidden");
      hlLoader.btn(btn, false);
    }
  },

  async req(path, opts = {}) {
    const useAuth = !!(opts.auth && session.token);

    const go = (withAuth) =>
      hlFetch(API_BASE + path, {
        method: opts.method || "GET",
        headers: withAuth
          ? { Authorization: "Bearer " + session.token }
          : {},
        body: opts.form
      }, opts.loader);

    let res;

    try {
      res = await go(useAuth);

      if (res.status === 401 && useAuth) {
        res = await go(false);
      }
    } catch (e) {
      const er = new Error(
        "Can't reach the server. Check your connection and try again."
      );
      er.network = true;
      throw er;
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const det =
        data && typeof data.detail === "string"
          ? data.detail
          : "";

      let message =
        applyFlow.CODES[det] || errMsg(data, res.status);

      if (
        det === "VALIDATION_ERROR" &&
        data.errors &&
        data.errors.length
      ) {
        const f = String(
          (data.errors[0].loc || []).slice(-1)[0] || ""
        );

        message =
          "Please check your " +
          ({
            name: "name",
            email: "email address",
            phone: "phone number"
          }[f] || f || "details") +
          ".";
      }

      const er = new Error(message);
      er.status = res.status;
      er.code =
        det ||
        (data &&
          (data.code ||
            data.error_code ||
            (typeof data.error === "string" ? data.error : ""))) ||
        "";
      er.data = data;

      throw er;
    }

    return data;
  },

  txt(x) {
    if (x == null) return "";

    if (typeof x === "object") {
      return String(
        x.text ||
        x.title ||
        x.name ||
        x.skill ||
        x.requirement ||
        x.gap ||
        x.description ||
        x.question ||
        x.label ||
        ""
      ).trim();
    }

    return String(x).trim();
  },

  flag(x) {
    if (!x || typeof x !== "object") return null;

    const v =
      x.required !== undefined && x.required !== null
        ? x.required
        : x.is_required;

    if (v !== undefined && v !== null) return !!v;

    const lvl = String(
      x.requirement_type ||
      x.type ||
      x.importance ||
      x.priority ||
      x.level ||
      x.kind ||
      x.category ||
      ""
    ).toLowerCase();

    if (!lvl) return null;

    return !/nice|optional|preferred|bonus/.test(lvl);
  },

  pretty(s) {
    s = String(s || "").replace(/[_-]+/g, " ").trim();

    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  },

  normReqs(j) {
    const out = [];

    const push = (x, req) => {
      const text = applyFlow.txt(x);
      if (!text) return;

      const f = req !== undefined ? req : applyFlow.flag(x);
      out.push({ text, required: f !== false });
    };

    const src = j.requirements || j.skills || [];

    if (Array.isArray(src)) {
      src.forEach((x) => push(x));
    } else if (src && typeof src === "object") {
      Object.keys(src).forEach((k) =>
        (Array.isArray(src[k]) ? src[k] : []).forEach((x) =>
          push(
            x,
            !/nice|optional|preferred|bonus/i.test(k)
          )
        )
      );
    }

    (Array.isArray(j.required_skills) ? j.required_skills : [])
      .forEach((x) => push(x, true));

    (
      Array.isArray(j.nice_to_have_skills)
        ? j.nice_to_have_skills
        : Array.isArray(j.nice_to_have)
          ? j.nice_to_have
          : []
    ).forEach((x) => push(x, false));

    return out;
  },

  normJob(raw) {
    const j = (raw && (raw.job || raw.data)) || raw || {};
    const status = String(j.status || "").toLowerCase();

    const closed =
      j.is_open === false ||
      j.open === false ||
      j.accepting_applications === false ||
      ["closed", "archived", "expired", "filled", "inactive"]
        .includes(status);

    const reqs = applyFlow.normReqs(j);
    const consent =
      j.consent && typeof j.consent === "object"
        ? j.consent
        : {};

    return {
      title: applyFlow.txt(j.title || j.job_title || j.name),
      company: applyFlow.txt(
        j.company || j.company_name || j.organization || j.employer
      ),
      location: applyFlow.txt(j.location),
      type: applyFlow.txt(
        j.job_type || j.employment_type || j.type
      ),
      posted:
        j.posted_at ||
        j.published_at ||
        j.created_at ||
        j.createdAt ||
        "",
      description: applyFlow.txt(
        j.description || j.about || j.summary
      ),
      duties: (
        Array.isArray(j.responsibilities)
          ? j.responsibilities
          : Array.isArray(j.duties)
            ? j.duties
            : []
      ).map((x) => applyFlow.txt(x)).filter(Boolean),
      reqs,
      requiredCount: reqs.filter((r) => r.required).length,
      niceCount: reqs.filter((r) => !r.required).length,
      consentText: applyFlow.txt(j.consent_text || consent.text),
      consentVersion: applyFlow.txt(
        j.consent_version || consent.version
      ),
      closed
    };
  },

  async getJob(token) {
    return applyFlow.normJob(
      await applyFlow.req(applyFlow.paths.job(token))
    );
  },

  isClosedError(e) {
    return !!e && (
      e.status === 410 ||
      e.code === "JOB_CLOSED" ||
      /closed|no longer|expired|not accepting/i.test(
        (e.code || "") + " " + (e.message || "")
      )
    );
  },

  async submit(token, f) {
    if (!f.consentVersion) {
      throw new Error("Please reload the page and try again.");
    }

    const fd = new FormData();
    fd.append("name", f.name);
    fd.append("email", f.email);
    fd.append("phone", f.phone);
    fd.append("cv", f.file);
    fd.append("consent", "true");
    fd.append("consent_version", f.consentVersion);
    fd.append("feedback_opt_in", f.feedbackOptIn ? "true" : "false");

    const d = await applyFlow.req(
      applyFlow.paths.apply(token),
      { method: "POST", form: fd }
    );

    const rt =
      d &&
      (
        d.result_token ||
        d.resultToken ||
        (d.data && (d.data.result_token || d.data.resultToken))
      );

    if (!rt) {
      throw new Error(
        "Your application was sent, but we did not get a reference back. Please contact the recruiter."
      );
    }

    sessionStorage.setItem("hl_result_token", rt);
    return rt;
  },

  applyError(e) {
    if (e.network) return e.message;

    if (e.status === 429) {
      return "Too many attempts. Please wait a few minutes and try again.";
    }

    if (
      e.status === 413 ||
      /too large|file size|5 ?mb/i.test(e.message || "")
    ) {
      return "Your CV is over 5 MB. Please upload a smaller file.";
    }

    if (/^[A-Z_]{4,}$/.test(e.message || "")) {
      return "Something went wrong. Please try again.";
    }

    return e.message;
  },

  normResult(raw) {
    const r = (raw && raw.data) || raw || {};

    const list = (v) => Array.isArray(v) ? v : v ? [v] : [];
    const strs = (v) =>
      list(v).map((x) => applyFlow.txt(x)).filter(Boolean);

    let score = r.score;
    score =
      score == null || isNaN(Number(score))
        ? null
        : Math.round(Number(score));

    const st = String(r.analysis_status || "").toLowerCase();

    const state =
      /complet/.test(st)
        ? "completed"
        : /fail|error|unavailable/.test(st)
          ? "failed"
          : "pending";

    const level =
      applyFlow.pretty(applyFlow.txt(r.match_level)) ||
      (score != null ? levelOf(score) : "");

    return {
      state,
      score,
      level,
      applicationId: r.application_id ? String(r.application_id) : "",
      feedbackEnabled: !!r.feedback_enabled,
      feedbackAvailable: !!r.feedback_available,
      reason: applyFlow.txt(r.reason),
      skills: strs(r.skills),
      experience: strs(r.experience),
      tips: strs(r.guidance),
      questions: strs(r.questions).map((text) => ({ text, group: "" })),
      jobTitle: "",
      company: "",
      submittedAt: ""
    };
  },

  async getResult(token) {
    return applyFlow.normResult(
      await applyFlow.req(applyFlow.paths.result(token), {
        auth: true
      })
    );
  },

  poll(token, onState) {
    let stopped = false;
    let n = 0;
    let timer = null;

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

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }
};

// =====================================================================
// ---- JOB SEEKER STANDALONE FLOW ----
// =====================================================================

const seekerFlow = {
  paths: {
    create: "/api/flow2/analyses",
    confirm: (id) =>
      "/api/flow2/analyses/" + encodeURIComponent(id) + "/confirm",
    cv: (id) =>
      "/api/flow2/analyses/" + encodeURIComponent(id) + "/cv",
    one: (id) =>
      "/api/flow2/analyses/" + encodeURIComponent(id),
    retry: (id) =>
      "/api/flow2/analyses/" + encodeURIComponent(id) + "/retry"
  },

  _key() {
    return "hl_flow2_" +
      (
        (session.user &&
          (session.user.id || session.user._id || session.user.email)) ||
        "me"
      );
  },

  _saved() {
    try {
      return JSON.parse(localStorage.getItem(seekerFlow._key())) || [];
    } catch (e) {
      return [];
    }
  },

  _remember(id, limit) {
    const l = seekerFlow._saved().filter((x) => x.id !== id);

    l.unshift({
      id,
      at: new Date().toISOString(),
      limit: limit || 5
    });

    localStorage.setItem(
      seekerFlow._key(),
      JSON.stringify(l.slice(0, 50))
    );
  },

  _draft: null,

  CODES: {
    DAILY_LIMIT_REACHED: "You have used all your analyses for today. The limit resets at midnight.",
    JOB_TEXT_REQUIRED: "Add the job first.",
    JOB_TEXT_TOO_SHORT: "That job text is too short. Paste the full job post for a better match.",
    JOB_IMAGES_REQUIRED: "Upload at least one screenshot of the job.",
    JOB_IMAGE_UNSUPPORTED: "Screenshots must be JPG or PNG.",
    JOB_IMAGE_TOO_LARGE: "Each screenshot must be 5 MB or less.",
    SCREENSHOT_TOO_LARGE: "Each screenshot must be 5 MB or less.",
    JOB_TEXT_NOT_READABLE: "We could not read the text in your screenshots.",
    JOB_LINK_INVALID: "That does not look like a valid link.",
    JOB_LINK_NOT_READABLE: "We could not read that link.",
    CV_NOT_READABLE: "We could not read that CV. Please upload a different file.",
    ANALYSIS_NOT_FOUND: "We could not find this analysis.",
    FLOW2_DAILY_LIMIT_REACHED: "You have used all your analyses for today. Try again tomorrow.",
    FLOW2_ANALYSIS_NOT_FOUND: "We could not find this analysis.",
    FLOW2_ALREADY_CONFIRMED: "This analysis was already started.",
    FLOW2_NOT_AWAITING_CV: "This analysis cannot take a CV right now.",
    FLOW2_NOT_RETRYABLE: "This analysis cannot be retried.",
    JOB_SOURCE_CONFLICT: "Use only one job source: text, link or screenshots.",
    JOB_CONTEXT_REQUIRED: "Add the job first.",
    JOB_LINK_UNREADABLE: "We could not read that link. Paste the job text instead.",
    SCREENSHOT_TEXT_UNREADABLE: "We could not read the text in your screenshots.",
    SCREENSHOT_INVALID_CONTENT: "Screenshots must be real JPG, PNG or WebP images.",
    CV_UNREADABLE: "We could not read that CV. Please upload a different PDF or Word file.",
    CV_UNSUPPORTED_FORMAT: "Upload your CV as a PDF or Word (.docx) file.",
    CV_INVALID_CONTENT: "That file does not look like a real PDF or Word document.",
    CV_REQUIRED: "Upload your CV.",
    ANALYSIS_FAILED: "We could not finish this analysis. Please try again."
  },

  url(page, params) {
    const q = params ? new URLSearchParams(params).toString() : "";
    return applyFlow.page(page) + (q ? "?" + q : "");
  },

  id() {
    return new URLSearchParams(location.search).get("id") || "";
  },

  guard(page) {
    const ok =
      session.token &&
      (!session.user || session.user.role === "job_seeker");

    if (!ok) {
      location.replace(
        applyFlow.page("login.html") +
        "?next=" +
        encodeURIComponent(page + location.search)
      );
    }

    return !!ok;
  },

  async req(path, opts = {}) {
    const headers = {
      Authorization: "Bearer " + session.token
    };

    let body;

    if (opts.form) {
      body = opts.form;
    } else if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }

    let res;

    try {
      res = await hlFetch(API_BASE + path, {
        method: opts.method || "GET",
        headers,
        body
      }, opts.loader);
    } catch (e) {
      const er = new Error(
        "Can't reach the server. Check your connection and try again."
      );
      er.network = true;
      throw er;
    }

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      session.clear();

      location.replace(
        applyFlow.page("login.html") +
        "?next=" +
        encodeURIComponent(
          (location.pathname.split("/").pop() || "job-seeker-home") +
          location.search
        )
      );

      throw new Error("Session expired");
    }

    if (!res.ok) {
      const det =
        data && typeof data.detail === "string"
          ? data.detail
          : "";

      let message =
        seekerFlow.CODES[det] ||
        applyFlow.CODES[det] ||
        errMsg(data, res.status);

      if (det === "VALIDATION_ERROR") {
        message = "Please check the details you entered and try again.";
      }

      if (/^[A-Z_]{4,}$/.test(message)) {
        message = "Something went wrong. Please try again.";
      }

      const er = new Error(message);
      er.status = res.status;
      er.code = det;
      er.data = data;

      throw er;
    }

    return data;
  },

  T(x) {
    return x == null
      ? ""
      : String(
          typeof x === "object"
            ? (x.text || x.title || x.name || "")
            : x
        ).trim();
  },

  strs(v) {
    return (Array.isArray(v) ? v : [])
      .map((x) => seekerFlow.T(x))
      .filter(Boolean);
  },

  titleFrom(t) {
    t = String(t || "").trim().split("\n")[0].trim();

    return t.length > 70
      ? t.slice(0, 70).trim() + "..."
      : t;
  },

  levelLabel(k) {
    k = String(k || "").toLowerCase();

    return /strong/.test(k)
      ? "Strong"
      : /good|moderate/.test(k)
        ? "Good"
        : /partial|weak|fair|low/.test(k)
          ? "Partial"
          : "";
  },

  levelClass(l) {
    return l === "Strong"
      ? "text-ok"
      : l === "Good"
        ? "text-brand"
        : "text-rose-500";
  },

  groupKey(g) {
    g = String(g || "").toLowerCase();

    return /about|role/.test(g)
      ? "about"
      : /experience/.test(g)
        ? "experience"
        : /gap/.test(g)
          ? "gaps"
          : "other";
  },

  norm(a) {
    a = a || {};

    const T = seekerFlow.T;
    const st = String(a.status || "").toLowerCase();

    let score = a.score;
    score =
      score == null || isNaN(Number(score))
        ? null
        : Math.round(Number(score));

    return {
      id: String(a.id || ""),
      state: /complet/.test(st)
        ? "completed"
        : /fail|error/.test(st)
          ? "failed"
          : "pending",
      step: Number(a.step) || 0,
      jobTitle: T(a.job_title) || seekerFlow.titleFrom(a.job_text),
      company: T(a.company),
      source: String(a.source || a.source_type || "text"),
      createdAt: a.created_at || "",
      score,
      level:
        seekerFlow.levelLabel(a.match_level) ||
        (
          score == null
            ? ""
            : score >= 75
              ? "Strong"
              : score >= 60
                ? "Good"
                : "Partial"
        ),
      reason: T(a.reason),

      requirements: (
        Array.isArray(a.requirements) ? a.requirements : []
      ).map((x) => {
        const r = String((x && x.result) || "").toLowerCase();

        return {
          text: T(x),
          required:
            String((x && x.type) || "required").toLowerCase() !==
            "nice_to_have",
          result: /^met$/.test(r)
            ? "met"
            : /partl|partial/.test(r)
              ? "partly"
              : "missing",
          evidence: T(x && x.evidence)
        };
      }).filter((x) => x.text),

      matched: seekerFlow.strs(a.matched_skills || a.skills),
      missing: seekerFlow.strs(a.missing_skills || a.gaps),
      tips: seekerFlow.strs(a.tips || a.guidance),

      steps: (
        Array.isArray(a.next_steps) ? a.next_steps : []
      ).map((x) => ({
        title: T(
          x && typeof x === "object" ? (x.title || x.text) : x
        ),
        detail: x && typeof x === "object" ? T(x.detail) : ""
      })).filter((x) => x.title),

      questions: (
        Array.isArray(a.questions) ? a.questions : []
      ).map((x) => ({
        group: seekerFlow.groupKey(x && x.group),
        text: T(
          x && typeof x === "object"
            ? (x.text || x.question)
            : x
        )
      })).filter((x) => x.text)
    };
  },

  normQuota(q) {
    q = q || {};

    const limit = Number(q.limit) || 5;
    const used = Math.max(0, Number(q.used) || 0);

    return {
      limit,
      used,
      remaining:
        q.remaining != null
          ? Math.max(0, Number(q.remaining))
          : Math.max(0, limit - used)
    };
  },

  async list(n) {
    const saved = seekerFlow._saved();
    const limit = (saved[0] && saved[0].limit) || 5;
    const today = new Date().toISOString().slice(0, 10);

    const used = saved.filter(
      (x) => String(x.at).slice(0, 10) === today
    ).length;

    const rows = await Promise.all(
      saved.slice(0, n || 20).map(
        (x) => seekerFlow.get(x.id).catch(() => null)
      )
    );

    return {
      quota: seekerFlow.normQuota({ limit, used }),
      analyses: rows.filter(Boolean)
    };
  },

  async get(id) {
    return seekerFlow.norm(
      await seekerFlow.req(seekerFlow.paths.one(id))
    );
  },

  async retry(id) {
    return seekerFlow.req(seekerFlow.paths.retry(id), {
      method: "POST",
      loader: "Retrying your analysis..."
    });
  },

  async _draftFrom(src) {
    const fd = new FormData();

    if (src.jobText) fd.append("job_text", src.jobText);
    if (src.jobLink) fd.append("job_link", src.jobLink);

    (src.screenshots || []).forEach(
      (f) => fd.append("screenshots", f)
    );

    const d = await seekerFlow.req(
      seekerFlow.paths.create,
      { method: "POST", form: fd, loader: src.label || "Reading the job..." }
    );

    if (!d || !d.id) {
      throw new Error("The server did not return an analysis ID.");
    }

    return d;
  },

  async create(f) {
    let id;

    if (seekerFlow._draft && f.source !== "text") {
      id = String(seekerFlow._draft.id);
    } else {
      id = String(
        (await seekerFlow._draftFrom({ jobText: f.jobText })).id
      );
    }

    seekerFlow._draft = null;

    await seekerFlow.req(seekerFlow.paths.confirm(id), {
      method: "POST",
      body: { job_text: f.jobText },
      loader: "Preparing your analysis..."
    });

    const fd = new FormData();
    fd.append("cv", f.cv);

    const r = await seekerFlow.req(
      seekerFlow.paths.cv(id),
      { method: "POST", form: fd, loader: "Analysing your CV... this can take a moment" }
    );

    seekerFlow._remember(id, r && r.daily_limit);

    return { id: String((r && r.id) || id) };
  },

  async readScreenshots(files) {
    const d = await seekerFlow._draftFrom({
      screenshots: Array.from(files),
      label: "Reading your screenshots..."
    });

    seekerFlow._draft = d;
    return String(d.job_text || "").trim();
  },

  async readLink(url) {
    const d = await seekerFlow._draftFrom({ jobLink: url, label: "Reading the job link..." });

    seekerFlow._draft = d;
    return String(d.job_text || "").trim();
  },

  async checkCv() {
    return null;
  },

  vote(name, helpful, analysisId) {
    return api("/api/events", {
      method: "POST",
      body: {
        name,
        properties: {
          helpful,
          analysis_id: analysisId
        }
      }
    }).catch(() => {});
  },

  words(t) {
    t = String(t || "").trim();
    return t ? t.split(/\s+/).length : 0;
  },

  size(b) {
    return b >= 1048576
      ? (b / 1048576).toFixed(1) + " MB"
      : Math.max(1, Math.round(b / 1024)) + " KB";
  },

  rowsHtml(list) {
    const head =
      '<div class="hidden grid-cols-[1fr_150px_120px_100px] gap-4 border-b border-line pb-2 text-xs font-medium text-mute sm:grid">' +
      "<span>Job</span><span>Match</span><span>Date</span><span></span></div>";

    return head + list.map((a) => {
      const done = a.state === "completed";

      const href = done
        ? seekerFlow.url("analysis-result.html", { id: a.id })
        : seekerFlow.url("analysing.html", { id: a.id });

      const match = done
        ? '<strong class="font-display text-lg">' +
          esc(a.score == null ? "\u2013" : a.score) +
          '</strong> <span class="ml-1 text-xs font-semibold ' +
          seekerFlow.levelClass(a.level) +
          '">' + esc(a.level) + "</span>"
        : a.state === "failed"
          ? '<span class="text-xs font-semibold text-rose-500">Failed</span>'
          : '<span class="text-xs font-semibold text-mute">Analysing...</span>';

      const cta = done
        ? "View result"
        : a.state === "failed"
          ? "Try again"
          : "Open";

      return (
        '<a href="' + href +
        '" class="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-line py-4 last:border-0 hover:bg-slate-50 sm:grid-cols-[1fr_150px_120px_100px]">' +
        '<span class="min-w-0"><span class="block truncate font-medium">' +
        esc(a.jobTitle || "Untitled job") +
        '</span><span class="block truncate text-xs text-mute">' +
        esc(a.company) +
        "</span></span><span>" + match +
        '</span><span class="hidden text-sm text-mute sm:block">' +
        esc(fmtDate(a.createdAt)) +
        '</span><span class="justify-self-end text-sm font-semibold text-brand">' +
        cta + "</span></a>"
      );
    }).join("");
  }
};
const API_BASE = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:8000"
  : "https://hirelume-api.onrender.com";

const ENDPOINTS = {
  auth: "/api/auth",
  jobs: "/api/jobs",
  applications: "/api/applications",
  cvs: "/api/cvs",
  analysis: "/api/analysis",
  pub: "/api/public",
  results: "/api/results",
  shortlist: "/api/shortlist"
};

const ROLE_HOME = {
  recruiter: "jobs.html",
  job_seeker: "job-seeker-home.html"
};

// ---- Session ----
const session = {
  get token() {
    return localStorage.getItem("hl_token");
  },

  get user() {
    try {
      return JSON.parse(localStorage.getItem("hl_user"));
    } catch (e) {
      return null;
    }
  },

  save(d) {
    localStorage.setItem("hl_token", d.access_token);
    localStorage.setItem("hl_user", JSON.stringify(d.user));
  },

  clear() {
    localStorage.removeItem("hl_token");
    localStorage.removeItem("hl_user");
  }
};

function requireAuth(role) {
  if (
    !session.token ||
    (role && session.user && session.user.role !== role)
  ) {
    location.replace("login.html");
  }
}

function logout() {
  session.clear();
  location.href = "login.html";
}

document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href="/logout"]');

  if (a) {
    e.preventDefault();
    logout();
  }
});

// ---- Helpers ----
const applyLink = (token) =>
  location.origin + "/public-job-page?t=" + token;

const levelOf = (s) =>
  s >= 80 ? "Strong" : s >= 60 ? "Good" : "Fair";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : "";

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function errMsg(data, status) {
  const d = data && (data.detail || data.message || data.error);

  if (typeof d === "string") return d;

  if (Array.isArray(d)) {
    return d
      .map((x) => x.message || x.msg || JSON.stringify(x))
      .join(", ");
  }

  return "Something went wrong (" + status + ")";
}

// ---- Standard JSON API wrapper ----
async function api(path, opts = {}) {
  const headers = {};

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (opts.auth !== false && session.token) {
    headers.Authorization = "Bearer " + session.token;
  }

  let res;

  try {
    res = await fetch(API_BASE + path, {
      method: opts.method || "GET",
      headers,
      body:
        opts.body !== undefined
          ? JSON.stringify(opts.body)
          : undefined
    });
  } catch (e) {
    throw new Error(
      "Can't reach the server. Check your connection and try again."
    );
  }

  const data = await res.json().catch(() => null);

  if (res.status === 401 && opts.auth !== false) {
    logout();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    throw new Error(errMsg(data, res.status));
  }

  return data;
}

// ---- Multipart API wrapper ----
async function apiForm(path, formData) {
  let res;

  try {
    res = await fetch(API_BASE + path, {
      method: "POST",
      body: formData
    });
  } catch (e) {
    throw new Error(
      "Can't reach the server. Check your connection and try again."
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(errMsg(data, res.status));
  }

  return data;
}

// ---- Login / signup submit ----
async function submitAuth(form, path, body, redirectTo) {
  const err = form.querySelector("#form-error");
  const btn = form.querySelector("[type=submit]");
  const label = btn.textContent;

  err.classList.add("hidden");
  btn.disabled = true;
  btn.textContent = "Please wait...";

  try {
    const d = await api(ENDPOINTS.auth + path, {
      method: "POST",
      body,
      auth: false
    });

    if (redirectTo) {
      location.href = redirectTo;
      return;
    }

    session.save(d);
    location.href = ROLE_HOME[d.user.role] || "jobs.html";
  } catch (e) {
    err.textContent = e.message;
    err.classList.remove("hidden");
    btn.disabled = false;
    btn.textContent = label;
  }
}

// ---- Fill logged-in user details ----
document.addEventListener("DOMContentLoaded", () => {
  const u = session.user;
  if (!u) return;

  const name = u.name || u.email || "";
  const ini = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const map = {
    name,
    email: u.email || "",
    first: name.split(" ")[0],
    initials: ini,
    initial: ini[0] || ""
  };

  document.querySelectorAll("[data-user]").forEach((el) => {
    el.textContent = map[el.dataset.user] || "";
  });
});

// ---- Open an applicant's CV ----
async function openCV(applicationId) {
  const tab = window.open("", "_blank");

  if (!tab) {
    throw new Error("Allow pop-ups to open the CV");
  }

  try {
    const res = await fetch(
      API_BASE + ENDPOINTS.applications + "/" +
        encodeURIComponent(applicationId) + "/cv",
      {
        headers: {
          Authorization: "Bearer " + session.token
        }
      }
    );

    if (
      (res.headers.get("content-type") || "")
        .includes("application/json")
    ) {
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || data.detail || "Couldn't open the CV"
        );
      }

      if (data.blindMode && data.cv) {
        tab.document.title = "Blind CV";

        const pre = tab.document.createElement("pre");
        pre.style.cssText =
          "white-space:pre-wrap;font:14px/1.6 system-ui,sans-serif;" +
          "max-width:720px;margin:24px auto;padding:0 16px";

        pre.textContent = data.cv.text;
        tab.document.body.appendChild(pre);
        return;
      }

      throw new Error("Unexpected response from the server");
    }

    if (!res.ok) {
      throw new Error("Couldn't open the CV (" + res.status + ")");
    }

    tab.location.href = URL.createObjectURL(await res.blob());
  } catch (err) {
    tab.close();
    throw err;
  }
}

// =====================================================================
// ---- SHORTLIST API ----
// PATCH /api/shortlist/:applicationId/shortlist
// Requires a logged-in recruiter.
// =====================================================================

async function shortlistApplicant(applicationId) {
  if (!applicationId) {
    throw new Error("Application ID is required.");
  }

  if (!session.token) {
    location.replace("login.html");
    throw new Error("Please log in to shortlist an applicant.");
  }

  if (session.user && session.user.role !== "recruiter") {
    throw new Error("Only recruiters can shortlist applicants.");
  }

  return api(
    ENDPOINTS.shortlist + "/" +
      encodeURIComponent(applicationId) + "/shortlist",
    {
      method: "PATCH",
      auth: true
    }
  );
}

// Connect this function to a Shortlist button.
async function handleShortlist(applicationId, button) {
  if (!button) {
    throw new Error("Shortlist button was not found.");
  }

  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "Shortlisting...";

  try {
    const result = await shortlistApplicant(applicationId);

    button.textContent = "Shortlisted";

    if (typeof window.showToast === "function") {
      window.showToast(
        result.message || "Applicant shortlisted successfully."
      );
    } else {
      alert(
        result.message || "Applicant shortlisted successfully."
      );
    }

    return result;
  } catch (error) {
    button.textContent = originalText;

    if (typeof window.showToast === "function") {
      window.showToast(error.message);
    } else {
      alert(error.message);
    }

    throw error;
  } finally {
    if (button.textContent !== "Shortlisted") {
      button.disabled = false;
    }
  }
}

// =====================================================================
// ---- PUBLIC APPLICATION FLOW ----
// =====================================================================

const applyFlow = {
  paths: {
    job: (t) =>
      ENDPOINTS.pub + "/jobs/" + encodeURIComponent(t),

    apply: (t) =>
      ENDPOINTS.pub + "/jobs/" + encodeURIComponent(t) +
      "/applications",

    result: (r) =>
      ENDPOINTS.results + "/" + encodeURIComponent(r)
  },

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
    CV_TOO_LARGE: "Your CV is over 5 MB. Please upload a smaller file.",
    UNEXPECTED_FILE: "Something was wrong with the file you attached. Please try again.",
    RATE_LIMIT_EXCEEDED: "Too many attempts. Please wait a few minutes and try again.",
    INTERNAL_SERVER_ERROR: "The server had a problem. Please try again in a moment.",
    ACCOUNT_ALREADY_EXISTS: "An account with this email already exists. Please log in to see your result.",
    INVALID_CREDENTIALS: "Wrong email or password.",
    APPLICATION_ALREADY_LINKED: "This application is already linked to another account.",
    APPLICATION_EMAIL_MISMATCH: "Please use the same email address you applied with."
  },

  qs(k) {
    return new URLSearchParams(location.search).get(k) || "";
  },

  jobToken() {
    const t =
      applyFlow.qs("t") ||
      sessionStorage.getItem("hl_job_token") ||
      "";

    if (t) sessionStorage.setItem("hl_job_token", t);
    return t;
  },

  resultToken() {
    const t =
      applyFlow.qs("r") ||
      applyFlow.qs("result") ||
      sessionStorage.getItem("hl_result_token") ||
      "";

    if (t) sessionStorage.setItem("hl_result_token", t);
    return t;
  },

  page(name) {
    return /\.html$/.test(location.pathname) ||
      location.protocol === "file:"
      ? name
      : name.replace(/\.html$/, "");
  },

  link(page, withResult) {
    const p = new URLSearchParams();
    const t = applyFlow.jobToken();
    const r = withResult ? applyFlow.resultToken() : "";

    if (t) p.set("t", t);
    if (r) p.set("r", r);

    const s = p.toString();

    return applyFlow.page(page) + (s ? "?" + s : "");
  },

  safeNext() {
    const n = applyFlow.qs("next");

    return /^[A-Za-z0-9_\-]+(\.html)?(\?[A-Za-z0-9_\-=&%.]*)?$/.test(n)
      ? n
      : "";
  },

  async login(form, body, next) {
    const err = form.querySelector("#form-error");
    const btn = form.querySelector("[type=submit]");
    const label = btn.textContent;

    err.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Please wait...";

    try {
      const d = await api(ENDPOINTS.auth + "/login", {
        method: "POST",
        body,
        auth: false
      });

      session.save(d);

      const r = new URLSearchParams(
        (next || "").split("?")[1] || ""
      ).get("r");

      if (r && d.user.role === "job_seeker") {
        try {
          await api(ENDPOINTS.applications + "/link", {
            method: "POST",
            body: { result_token: r }
          });
        } catch (e) {
          // The result page handles unsuccessful linking.
        }
      }

      location.href = next;
    } catch (e) {
      err.textContent = applyFlow.CODES[e.message] || e.message;
      err.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = label;
    }
  },

  async req(path, opts = {}) {
    const useAuth = !!(opts.auth && session.token);

    const go = (withAuth) =>
      fetch(API_BASE + path, {
        method: opts.method || "GET",
        headers: withAuth
          ? { Authorization: "Bearer " + session.token }
          : {},
        body: opts.form
      });

    let res;

    try {
      res = await go(useAuth);

      if (res.status === 401 && useAuth) {
        res = await go(false);
      }
    } catch (e) {
      const er = new Error(
        "Can't reach the server. Check your connection and try again."
      );
      er.network = true;
      throw er;
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const det =
        data && typeof data.detail === "string"
          ? data.detail
          : "";

      let message =
        applyFlow.CODES[det] || errMsg(data, res.status);

      if (
        det === "VALIDATION_ERROR" &&
        data.errors &&
        data.errors.length
      ) {
        const f = String(
          (data.errors[0].loc || []).slice(-1)[0] || ""
        );

        message =
          "Please check your " +
          ({
            name: "name",
            email: "email address",
            phone: "phone number"
          }[f] || f || "details") +
          ".";
      }

      const er = new Error(message);
      er.status = res.status;
      er.code =
        det ||
        (data &&
          (data.code ||
            data.error_code ||
            (typeof data.error === "string" ? data.error : ""))) ||
        "";
      er.data = data;

      throw er;
    }

    return data;
  },

  txt(x) {
    if (x == null) return "";

    if (typeof x === "object") {
      return String(
        x.text ||
        x.title ||
        x.name ||
        x.skill ||
        x.requirement ||
        x.gap ||
        x.description ||
        x.question ||
        x.label ||
        ""
      ).trim();
    }

    return String(x).trim();
  },

  flag(x) {
    if (!x || typeof x !== "object") return null;

    const v =
      x.required !== undefined && x.required !== null
        ? x.required
        : x.is_required;

    if (v !== undefined && v !== null) return !!v;

    const lvl = String(
      x.requirement_type ||
      x.type ||
      x.importance ||
      x.priority ||
      x.level ||
      x.kind ||
      x.category ||
      ""
    ).toLowerCase();

    if (!lvl) return null;

    return !/nice|optional|preferred|bonus/.test(lvl);
  },

  pretty(s) {
    s = String(s || "").replace(/[_-]+/g, " ").trim();

    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  },

  normReqs(j) {
    const out = [];

    const push = (x, req) => {
      const text = applyFlow.txt(x);
      if (!text) return;

      const f = req !== undefined ? req : applyFlow.flag(x);
      out.push({ text, required: f !== false });
    };

    const src = j.requirements || j.skills || [];

    if (Array.isArray(src)) {
      src.forEach((x) => push(x));
    } else if (src && typeof src === "object") {
      Object.keys(src).forEach((k) =>
        (Array.isArray(src[k]) ? src[k] : []).forEach((x) =>
          push(
            x,
            !/nice|optional|preferred|bonus/i.test(k)
          )
        )
      );
    }

    (Array.isArray(j.required_skills) ? j.required_skills : [])
      .forEach((x) => push(x, true));

    (
      Array.isArray(j.nice_to_have_skills)
        ? j.nice_to_have_skills
        : Array.isArray(j.nice_to_have)
          ? j.nice_to_have
          : []
    ).forEach((x) => push(x, false));

    return out;
  },

  normJob(raw) {
    const j = (raw && (raw.job || raw.data)) || raw || {};
    const status = String(j.status || "").toLowerCase();

    const closed =
      j.is_open === false ||
      j.open === false ||
      j.accepting_applications === false ||
      ["closed", "archived", "expired", "filled", "inactive"]
        .includes(status);

    const reqs = applyFlow.normReqs(j);
    const consent =
      j.consent && typeof j.consent === "object"
        ? j.consent
        : {};

    return {
      title: applyFlow.txt(j.title || j.job_title || j.name),
      company: applyFlow.txt(
        j.company || j.company_name || j.organization || j.employer
      ),
      location: applyFlow.txt(j.location),
      type: applyFlow.txt(
        j.job_type || j.employment_type || j.type
      ),
      posted:
        j.posted_at ||
        j.published_at ||
        j.created_at ||
        j.createdAt ||
        "",
      description: applyFlow.txt(
        j.description || j.about || j.summary
      ),
      duties: (
        Array.isArray(j.responsibilities)
          ? j.responsibilities
          : Array.isArray(j.duties)
            ? j.duties
            : []
      ).map((x) => applyFlow.txt(x)).filter(Boolean),
      reqs,
      requiredCount: reqs.filter((r) => r.required).length,
      niceCount: reqs.filter((r) => !r.required).length,
      consentText: applyFlow.txt(j.consent_text || consent.text),
      consentVersion: applyFlow.txt(
        j.consent_version || consent.version
      ),
      closed
    };
  },

  async getJob(token) {
    return applyFlow.normJob(
      await applyFlow.req(applyFlow.paths.job(token))
    );
  },

  isClosedError(e) {
    return !!e && (
      e.status === 410 ||
      e.code === "JOB_CLOSED" ||
      /closed|no longer|expired|not accepting/i.test(
        (e.code || "") + " " + (e.message || "")
      )
    );
  },

  async submit(token, f) {
    if (!f.consentVersion) {
      throw new Error("Please reload the page and try again.");
    }

    const fd = new FormData();
    fd.append("name", f.name);
    fd.append("email", f.email);
    fd.append("phone", f.phone);
    fd.append("cv", f.file);
    fd.append("consent", "true");
    fd.append("consent_version", f.consentVersion);
    fd.append("feedback_opt_in", f.feedbackOptIn ? "true" : "false");

    const d = await applyFlow.req(
      applyFlow.paths.apply(token),
      { method: "POST", form: fd }
    );

    const rt =
      d &&
      (
        d.result_token ||
        d.resultToken ||
        (d.data && (d.data.result_token || d.data.resultToken))
      );

    if (!rt) {
      throw new Error(
        "Your application was sent, but we did not get a reference back. Please contact the recruiter."
      );
    }

    sessionStorage.setItem("hl_result_token", rt);
    return rt;
  },

  applyError(e) {
    if (e.network) return e.message;

    if (e.status === 429) {
      return "Too many attempts. Please wait a few minutes and try again.";
    }

    if (
      e.status === 413 ||
      /too large|file size|5 ?mb/i.test(e.message || "")
    ) {
      return "Your CV is over 5 MB. Please upload a smaller file.";
    }

    if (/^[A-Z_]{4,}$/.test(e.message || "")) {
      return "Something went wrong. Please try again.";
    }

    return e.message;
  },

  normResult(raw) {
    const r = (raw && raw.data) || raw || {};

    const list = (v) => Array.isArray(v) ? v : v ? [v] : [];
    const strs = (v) =>
      list(v).map((x) => applyFlow.txt(x)).filter(Boolean);

    let score = r.score;
    score =
      score == null || isNaN(Number(score))
        ? null
        : Math.round(Number(score));

    const st = String(r.analysis_status || "").toLowerCase();

    const state =
      /complet/.test(st)
        ? "completed"
        : /fail|error|unavailable/.test(st)
          ? "failed"
          : "pending";

    const level =
      applyFlow.pretty(applyFlow.txt(r.match_level)) ||
      (score != null ? levelOf(score) : "");

    return {
      state,
      score,
      level,
      applicationId: r.application_id ? String(r.application_id) : "",
      feedbackEnabled: !!r.feedback_enabled,
      feedbackAvailable: !!r.feedback_available,
      reason: applyFlow.txt(r.reason),
      skills: strs(r.skills),
      experience: strs(r.experience),
      tips: strs(r.guidance),
      questions: strs(r.questions).map((text) => ({ text, group: "" })),
      jobTitle: "",
      company: "",
      submittedAt: ""
    };
  },

  async getResult(token) {
    return applyFlow.normResult(
      await applyFlow.req(applyFlow.paths.result(token), {
        auth: true
      })
    );
  },

  poll(token, onState) {
    let stopped = false;
    let n = 0;
    let timer = null;

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

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }
};

// =====================================================================
// ---- JOB SEEKER STANDALONE FLOW ----
// =====================================================================

const seekerFlow = {
  paths: {
    create: "/api/flow2/analyses",
    confirm: (id) =>
      "/api/flow2/analyses/" + encodeURIComponent(id) + "/confirm",
    cv: (id) =>
      "/api/flow2/analyses/" + encodeURIComponent(id) + "/cv",
    one: (id) =>
      "/api/flow2/analyses/" + encodeURIComponent(id),
    retry: (id) =>
      "/api/flow2/analyses/" + encodeURIComponent(id) + "/retry"
  },

  _key() {
    return "hl_flow2_" +
      (
        (session.user &&
          (session.user.id || session.user._id || session.user.email)) ||
        "me"
      );
  },

  _saved() {
    try {
      return JSON.parse(localStorage.getItem(seekerFlow._key())) || [];
    } catch (e) {
      return [];
    }
  },

  _remember(id, limit) {
    const l = seekerFlow._saved().filter((x) => x.id !== id);

    l.unshift({
      id,
      at: new Date().toISOString(),
      limit: limit || 5
    });

    localStorage.setItem(
      seekerFlow._key(),
      JSON.stringify(l.slice(0, 50))
    );
  },

  _draft: null,

  CODES: {
    DAILY_LIMIT_REACHED: "You have used all your analyses for today. The limit resets at midnight.",
    JOB_TEXT_REQUIRED: "Add the job first.",
    JOB_TEXT_TOO_SHORT: "That job text is too short. Paste the full job post for a better match.",
    JOB_IMAGES_REQUIRED: "Upload at least one screenshot of the job.",
    JOB_IMAGE_UNSUPPORTED: "Screenshots must be JPG or PNG.",
    JOB_IMAGE_TOO_LARGE: "Each screenshot must be 5 MB or less.",
    SCREENSHOT_TOO_LARGE: "Each screenshot must be 5 MB or less.",
    JOB_TEXT_NOT_READABLE: "We could not read the text in your screenshots.",
    JOB_LINK_INVALID: "That does not look like a valid link.",
    JOB_LINK_NOT_READABLE: "We could not read that link.",
    CV_NOT_READABLE: "We could not read that CV. Please upload a different file.",
    ANALYSIS_NOT_FOUND: "We could not find this analysis.",
    FLOW2_DAILY_LIMIT_REACHED: "You have used all your analyses for today. Try again tomorrow.",
    FLOW2_ANALYSIS_NOT_FOUND: "We could not find this analysis.",
    FLOW2_ALREADY_CONFIRMED: "This analysis was already started.",
    FLOW2_NOT_AWAITING_CV: "This analysis cannot take a CV right now.",
    FLOW2_NOT_RETRYABLE: "This analysis cannot be retried.",
    JOB_SOURCE_CONFLICT: "Use only one job source: text, link or screenshots.",
    JOB_CONTEXT_REQUIRED: "Add the job first.",
    JOB_LINK_UNREADABLE: "We could not read that link. Paste the job text instead.",
    SCREENSHOT_TEXT_UNREADABLE: "We could not read the text in your screenshots.",
    SCREENSHOT_INVALID_CONTENT: "Screenshots must be real JPG, PNG or WebP images.",
    CV_UNREADABLE: "We could not read that CV. Please upload a different PDF or Word file.",
    CV_UNSUPPORTED_FORMAT: "Upload your CV as a PDF or Word (.docx) file.",
    CV_INVALID_CONTENT: "That file does not look like a real PDF or Word document.",
    CV_REQUIRED: "Upload your CV.",
    ANALYSIS_FAILED: "We could not finish this analysis. Please try again."
  },

  url(page, params) {
    const q = params ? new URLSearchParams(params).toString() : "";
    return applyFlow.page(page) + (q ? "?" + q : "");
  },

  id() {
    return new URLSearchParams(location.search).get("id") || "";
  },

  guard(page) {
    const ok =
      session.token &&
      (!session.user || session.user.role === "job_seeker");

    if (!ok) {
      location.replace(
        applyFlow.page("login.html") +
        "?next=" +
        encodeURIComponent(page + location.search)
      );
    }

    return !!ok;
  },

  async req(path, opts = {}) {
    const headers = {
      Authorization: "Bearer " + session.token
    };

    let body;

    if (opts.form) {
      body = opts.form;
    } else if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }

    let res;

    try {
      res = await fetch(API_BASE + path, {
        method: opts.method || "GET",
        headers,
        body
      });
    } catch (e) {
      const er = new Error(
        "Can't reach the server. Check your connection and try again."
      );
      er.network = true;
      throw er;
    }

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      session.clear();

      location.replace(
        applyFlow.page("login.html") +
        "?next=" +
        encodeURIComponent(
          (location.pathname.split("/").pop() || "job-seeker-home") +
          location.search
        )
      );

      throw new Error("Session expired");
    }

    if (!res.ok) {
      const det =
        data && typeof data.detail === "string"
          ? data.detail
          : "";

      let message =
        seekerFlow.CODES[det] ||
        applyFlow.CODES[det] ||
        errMsg(data, res.status);

      if (det === "VALIDATION_ERROR") {
        message = "Please check the details you entered and try again.";
      }

      if (/^[A-Z_]{4,}$/.test(message)) {
        message = "Something went wrong. Please try again.";
      }

      const er = new Error(message);
      er.status = res.status;
      er.code = det;
      er.data = data;

      throw er;
    }

    return data;
  },

  T(x) {
    return x == null
      ? ""
      : String(
          typeof x === "object"
            ? (x.text || x.title || x.name || "")
            : x
        ).trim();
  },

  strs(v) {
    return (Array.isArray(v) ? v : [])
      .map((x) => seekerFlow.T(x))
      .filter(Boolean);
  },

  titleFrom(t) {
    t = String(t || "").trim().split("\n")[0].trim();

    return t.length > 70
      ? t.slice(0, 70).trim() + "..."
      : t;
  },

  levelLabel(k) {
    k = String(k || "").toLowerCase();

    return /strong/.test(k)
      ? "Strong"
      : /good|moderate/.test(k)
        ? "Good"
        : /partial|weak|fair|low/.test(k)
          ? "Partial"
          : "";
  },

  levelClass(l) {
    return l === "Strong"
      ? "text-ok"
      : l === "Good"
        ? "text-brand"
        : "text-rose-500";
  },

  groupKey(g) {
    g = String(g || "").toLowerCase();

    return /about|role/.test(g)
      ? "about"
      : /experience/.test(g)
        ? "experience"
        : /gap/.test(g)
          ? "gaps"
          : "other";
  },

  norm(a) {
    a = a || {};

    const T = seekerFlow.T;
    const st = String(a.status || "").toLowerCase();

    let score = a.score;
    score =
      score == null || isNaN(Number(score))
        ? null
        : Math.round(Number(score));

    return {
      id: String(a.id || ""),
      state: /complet/.test(st)
        ? "completed"
        : /fail|error/.test(st)
          ? "failed"
          : "pending",
      step: Number(a.step) || 0,
      jobTitle: T(a.job_title) || seekerFlow.titleFrom(a.job_text),
      company: T(a.company),
      source: String(a.source || a.source_type || "text"),
      createdAt: a.created_at || "",
      score,
      level:
        seekerFlow.levelLabel(a.match_level) ||
        (
          score == null
            ? ""
            : score >= 75
              ? "Strong"
              : score >= 60
                ? "Good"
                : "Partial"
        ),
      reason: T(a.reason),

      requirements: (
        Array.isArray(a.requirements) ? a.requirements : []
      ).map((x) => {
        const r = String((x && x.result) || "").toLowerCase();

        return {
          text: T(x),
          required:
            String((x && x.type) || "required").toLowerCase() !==
            "nice_to_have",
          result: /^met$/.test(r)
            ? "met"
            : /partl|partial/.test(r)
              ? "partly"
              : "missing",
          evidence: T(x && x.evidence)
        };
      }).filter((x) => x.text),

      matched: seekerFlow.strs(a.matched_skills || a.skills),
      missing: seekerFlow.strs(a.missing_skills || a.gaps),
      tips: seekerFlow.strs(a.tips || a.guidance),

      steps: (
        Array.isArray(a.next_steps) ? a.next_steps : []
      ).map((x) => ({
        title: T(
          x && typeof x === "object" ? (x.title || x.text) : x
        ),
        detail: x && typeof x === "object" ? T(x.detail) : ""
      })).filter((x) => x.title),

      questions: (
        Array.isArray(a.questions) ? a.questions : []
      ).map((x) => ({
        group: seekerFlow.groupKey(x && x.group),
        text: T(
          x && typeof x === "object"
            ? (x.text || x.question)
            : x
        )
      })).filter((x) => x.text)
    };
  },

  normQuota(q) {
    q = q || {};

    const limit = Number(q.limit) || 5;
    const used = Math.max(0, Number(q.used) || 0);

    return {
      limit,
      used,
      remaining:
        q.remaining != null
          ? Math.max(0, Number(q.remaining))
          : Math.max(0, limit - used)
    };
  },

  async list(n) {
    const saved = seekerFlow._saved();
    const limit = (saved[0] && saved[0].limit) || 5;
    const today = new Date().toISOString().slice(0, 10);

    const used = saved.filter(
      (x) => String(x.at).slice(0, 10) === today
    ).length;

    const rows = await Promise.all(
      saved.slice(0, n || 20).map(
        (x) => seekerFlow.get(x.id).catch(() => null)
      )
    );

    return {
      quota: seekerFlow.normQuota({ limit, used }),
      analyses: rows.filter(Boolean)
    };
  },

  async get(id) {
    return seekerFlow.norm(
      await seekerFlow.req(seekerFlow.paths.one(id))
    );
  },

  async retry(id) {
    return seekerFlow.req(seekerFlow.paths.retry(id), {
      method: "POST"
    });
  },

  async _draftFrom(src) {
    const fd = new FormData();

    if (src.jobText) fd.append("job_text", src.jobText);
    if (src.jobLink) fd.append("job_link", src.jobLink);

    (src.screenshots || []).forEach(
      (f) => fd.append("screenshots", f)
    );

    const d = await seekerFlow.req(
      seekerFlow.paths.create,
      { method: "POST", form: fd }
    );

    if (!d || !d.id) {
      throw new Error("The server did not return an analysis ID.");
    }

    return d;
  },

  async create(f) {
    let id;

    if (seekerFlow._draft && f.source !== "text") {
      id = String(seekerFlow._draft.id);
    } else {
      id = String(
        (await seekerFlow._draftFrom({ jobText: f.jobText })).id
      );
    }

    seekerFlow._draft = null;

    await seekerFlow.req(seekerFlow.paths.confirm(id), {
      method: "POST",
      body: { job_text: f.jobText }
    });

    const fd = new FormData();
    fd.append("cv", f.cv);

    const r = await seekerFlow.req(
      seekerFlow.paths.cv(id),
      { method: "POST", form: fd }
    );

    seekerFlow._remember(id, r && r.daily_limit);

    return { id: String((r && r.id) || id) };
  },

  async readScreenshots(files) {
    const d = await seekerFlow._draftFrom({
      screenshots: Array.from(files)
    });

    seekerFlow._draft = d;
    return String(d.job_text || "").trim();
  },

  async readLink(url) {
    const d = await seekerFlow._draftFrom({ jobLink: url });

    seekerFlow._draft = d;
    return String(d.job_text || "").trim();
  },

  async checkCv() {
    return null;
  },

  vote(name, helpful, analysisId) {
    return api("/api/events", {
      method: "POST",
      body: {
        name,
        properties: {
          helpful,
          analysis_id: analysisId
        }
      }
    }).catch(() => {});
  },

  words(t) {
    t = String(t || "").trim();
    return t ? t.split(/\s+/).length : 0;
  },

  size(b) {
    return b >= 1048576
      ? (b / 1048576).toFixed(1) + " MB"
      : Math.max(1, Math.round(b / 1024)) + " KB";
  },

  rowsHtml(list) {
    const head =
      '<div class="hidden grid-cols-[1fr_150px_120px_100px] gap-4 border-b border-line pb-2 text-xs font-medium text-mute sm:grid">' +
      "<span>Job</span><span>Match</span><span>Date</span><span></span></div>";

    return head + list.map((a) => {
      const done = a.state === "completed";

      const href = done
        ? seekerFlow.url("analysis-result.html", { id: a.id })
        : seekerFlow.url("analysing.html", { id: a.id });

      const match = done
        ? '<strong class="font-display text-lg">' +
          esc(a.score == null ? "\u2013" : a.score) +
          '</strong> <span class="ml-1 text-xs font-semibold ' +
          seekerFlow.levelClass(a.level) +
          '">' + esc(a.level) + "</span>"
        : a.state === "failed"
          ? '<span class="text-xs font-semibold text-rose-500">Failed</span>'
          : '<span class="text-xs font-semibold text-mute">Analysing...</span>';

      const cta = done
        ? "View result"
        : a.state === "failed"
          ? "Try again"
          : "Open";

      return (
        '<a href="' + href +
        '" class="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-line py-4 last:border-0 hover:bg-slate-50 sm:grid-cols-[1fr_150px_120px_100px]">' +
        '<span class="min-w-0"><span class="block truncate font-medium">' +
        esc(a.jobTitle || "Untitled job") +
        '</span><span class="block truncate text-xs text-mute">' +
        esc(a.company) +
        "</span></span><span>" + match +
        '</span><span class="hidden text-sm text-mute sm:block">' +
        esc(fmtDate(a.createdAt)) +
        '</span><span class="justify-self-end text-sm font-semibold text-brand">' +
        cta + "</span></a>"
      );
    }).join("");
  }
};
