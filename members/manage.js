(() => {
  const API = "https://api.escoreboards.eu/api/club-registry";
  const $ = s => document.querySelector(s);
  const qs = new URLSearchParams(location.search);
  let clubKey = "";
  let adminSession = qs.get("adminSession") || "";
  let club = null;
  let adminMode = Boolean(adminSession);

  const msg = (el, text, cls = "") => {
    el.textContent = text || "";
    el.hidden = !text;
    el.className = `message${cls ? ` ${cls}` : ""}`;
  };

  const esc = s => String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  async function req(path, opt = {}) {
    const headers = { ...(opt.headers || {}) };
    if (!(opt.body instanceof FormData)) headers["Content-Type"] = "application/json";
    const r = await fetch(API + path, { ...opt, headers });
    let b = null;
    try { b = await r.json(); } catch {}
    if (!r.ok) throw new Error(b?.detail || `Request failed (${r.status})`);
    return b;
  }

  function authHeaders() {
    return adminMode
      ? { "X-VoxCourt-Admin-Session": adminSession }
      : { "X-Club-Key": clubKey };
  }

  function paths() {
    return adminMode
      ? { get: "/admin/session/club", club: "/admin/session/club", court: "/admin/session/court", logo: "/admin/session/logo", del: "/admin/session/delete" }
      : { get: "/member/club", club: "/member/club", court: "/member/court", logo: "/member/logo", del: "/member/delete" };
  }

  function setWritableState() {
    const locked = !adminMode && club.status !== "active";
    $("#lockedNote").hidden = !locked;
    if (locked) {
      $("#lockedNote").textContent = `This club account is ${club.status}. Club changes are locked by VoxCourt. Please contact support.`;
    }
    for (const el of [$("#editName"), $("#editAddress"), $("#editLogo"), $("#saveClub")]) {
      if (el) el.disabled = locked;
    }
    document.querySelectorAll("#courtEditor input,#courtEditor select").forEach(el => { el.disabled = locked; });
  }

  function render() {
    $("#clubHeading").textContent = club.name;
    $("#clubPath").textContent = club.publicPath;
    $("#editName").value = club.name || "";
    $("#editAddress").value = club.address || "";
    $("#deletePhrase").textContent = adminMode ? "DELETE" : `DELETE ${club.name}`;

    const status = $("#accountStatus");
    status.textContent = club.status || "active";
    status.className = `account-status ${club.status || "active"}`;

    const logo = $("#currentLogo");
    if (club.logo) { logo.src = club.logo; logo.hidden = false; }
    else { logo.hidden = true; logo.removeAttribute("src"); }

    $("#adminModeBanner").hidden = !adminMode;
    $("#adminStatusField").hidden = !adminMode;
    if (adminMode) $("#editStatus").value = club.status || "active";

    const host = $("#courtEditor");
    host.innerHTML = "";
    for (const c of club.courts) {
      const row = document.createElement("div");
      row.className = "court-row";
      row.dataset.id = c.id;
      row.innerHTML = `
        <div class="court-index">${esc(c.id.replace("court-", ""))}</div>
        <input value="${esc(c.name)}">
        <select data-sport>
          <option value="tennis">Tennis</option>
          <option value="padel">Padel</option>
          <option value="pickleball">Pickleball</option>
        </select>
        ${adminMode ? `<select data-status><option value="active">Active</option><option value="disabled">Disabled</option></select>` : ""}
      `;
      row.querySelector("[data-sport]").value = c.sport;
      if (adminMode) row.querySelector("[data-status]").value = c.status || "active";
      row.querySelector("input").addEventListener("change", () => saveCourt(row));
      row.querySelector("[data-sport]").addEventListener("change", () => saveCourt(row));
      row.querySelector("[data-status]")?.addEventListener("change", () => saveCourt(row));
      host.appendChild(row);
    }
    setWritableState();
  }

  async function reload() {
    const p = paths();
    let b;
    if (adminMode) {
      b = await req(p.get, { method: "GET", headers: authHeaders() });
    } else {
      b = await req(p.get, { method: "POST", body: JSON.stringify({ clubKey }) });
    }
    club = b.club;
    render();
  }

  async function saveCourt(row) {
    try {
      msg($("#courtMsg"), "");
      const body = {
        courtId: row.dataset.id,
        name: row.querySelector("input").value.trim(),
        sport: row.querySelector("[data-sport]").value,
      };
      if (adminMode) body.status = row.querySelector("[data-status]").value;
      await req(paths().court, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) });
      msg($("#courtMsg"), "Court saved.", "info");
    } catch (e) { msg($("#courtMsg"), e.message); }
  }

  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    msg($("#loginMsg"), "");
    clubKey = $("#clubKeyInput").value.trim();
    adminMode = false;
    adminSession = "";
    try {
      await reload();
      $("#loginCard").hidden = true;
      $("#manageCard").hidden = false;
    } catch (err) { msg($("#loginMsg"), err.message); }
  });

  $("#saveClub").addEventListener("click", async () => {
    try {
      msg($("#saveMsg"), "");
      const body = { name: $("#editName").value.trim(), address: $("#editAddress").value.trim() };
      if (adminMode) body.status = $("#editStatus").value;
      await req(paths().club, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) });
      const f = $("#editLogo").files?.[0];
      if (f) {
        const fd = new FormData(); fd.append("logo", f);
        await req(paths().logo, { method: "POST", headers: authHeaders(), body: fd });
        $("#editLogo").value = "";
      }
      await reload();
      msg($("#saveMsg"), "Saved.", "info");
    } catch (e) { msg($("#saveMsg"), e.message); }
  });

  $("#deleteClub").addEventListener("click", async () => {
    if (!club) return;
    try {
      msg($("#deleteMsg"), "");
      const confirm = $("#deleteConfirm").value;
      await req(paths().del, { method: "POST", headers: authHeaders(), body: JSON.stringify({ confirm }) });
      alert("Club account deleted. VoxCourt data purge has been scheduled.");
      location.href = "./";
    } catch (e) { msg($("#deleteMsg"), e.message); }
  });

  if (adminMode) {
    $("#loginCard").hidden = true;
    $("#manageCard").hidden = false;
    reload().catch(err => {
      $("#manageCard").hidden = true;
      $("#loginCard").hidden = false;
      msg($("#loginMsg"), `Admin session failed: ${err.message}`);
    });
  }
})();
