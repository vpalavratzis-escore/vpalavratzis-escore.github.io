(() => {
  const API = "https://api.escoreboards.eu/api/club-registry";
  const $ = s => document.querySelector(s);
  let key = "";
  let clubs = [];
  let kits = [];
  let staticCourts = [];

  const esc = s => String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  async function req(path, opt = {}) {
    const h = { "X-VoxCourt-Admin-Key": key, ...(opt.headers || {}) };
    if (!(opt.body instanceof FormData)) h["Content-Type"] = "application/json";
    const r = await fetch(API + path, { ...opt, headers: h, cache: "no-store" });
    let b = null;
    try { b = await r.json(); } catch {}
    if (!r.ok) {
      const detail = typeof b?.detail === "string" ? b.detail : b?.detail?.message;
      throw new Error(detail || `Request failed (${r.status})`);
    }
    return b;
  }

  function msg(t) {
    $("#loginMsg").textContent = t || "";
    $("#loginMsg").hidden = !t;
  }

  function allCourts() {
    const byKey = new Map();

    // Static/legacy courts already visible on the normal VoxCourt site.
    for (const row of staticCourts) byKey.set(row.courtKey, row);

    // Self-service portal courts override the same key with richer metadata.
    for (const club of clubs) {
      for (const court of club.courts || []) {
        byKey.set(court.courtKey, {
          courtKey: court.courtKey,
          label: `${club.name} · ${court.name} · ${club.cityName}`,
          club,
          court,
        });
      }
    }

    return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label));
  }

  async function loadStaticCourts() {
    try {
      const r = await fetch(
        "https://voxcourt.com/tennislive-match/config/clubs.json",
        { cache: "no-store" }
      );
      if (!r.ok) throw new Error(`Static registry failed (${r.status})`);
      const data = await r.json();
      const rows = [];
      for (const country of data.countries || []) {
        for (const city of country.cities || []) {
          for (const club of city.clubs || []) {
            for (const court of club.courts || []) {
              const courtKey = `${country.id}/${city.id}/${club.id}/${court.id}`;
              rows.push({
                courtKey,
                label: `${club.name} · ${court.name} · ${city.name}`,
                club: {
                  name: club.name,
                  cityName: city.name,
                  countryName: country.name,
                },
                court: { name: court.name, id: court.id },
              });
            }
          }
        }
      }
      staticCourts = rows;
    } catch (e) {
      console.warn("Could not load static court registry", e);
      staticCourts = [];
    }
  }

  function courtOptions(selected = "") {
    const options = ['<option value="">— Choose court —</option>'];
    for (const row of allCourts()) {
      const sel = row.courtKey === selected ? " selected" : "";
      options.push(`<option value="${esc(row.courtKey)}"${sel}>${esc(row.label)}</option>`);
    }
    return options.join("");
  }

  async function load() {
    const [clubBody, hardwareBody] = await Promise.all([
      req("/admin/clubs"),
      req("/admin/hardware/kits"),
      loadStaticCourts(),
    ]);
    clubs = clubBody.clubs || [];
    kits = hardwareBody.kits || [];
    $("#count").textContent = `${clubs.length} clubs`;
    $("#hardwareCount").textContent = `${kits.length} kits · ${kits.filter(k => k.assignedCourt).length} assigned`;
    renderHardware();
    renderClubs();
  }

  function renderHardware() {
    const host = $("#hardware");
    host.innerHTML = "";

    if (!kits.length) {
      host.innerHTML = '<div class="hardware-empty">No hardware kits yet. Create VC-KIT-001 above.</div>';
      return;
    }

    for (const kit of kits) {
      const el = document.createElement("article");
      el.className = "hardware-kit";
      const assignedKey = kit.assignedCourt?.courtKey || "";
      const assignedRow = allCourts().find(x => x.courtKey === assignedKey);
      const assignment = kit.assignedCourt
        ? (assignedRow?.label || `${kit.assignedCourt.clubName} · ${kit.assignedCourt.courtName}`)
        : "AVAILABLE / UNASSIGNED";
      const statusClass = kit.status === "active" ? "status-active" : "status-disabled";
      const caps = (kit.capabilities || []).map(v => `<span class="hardware-badge">${esc(v)}</span>`).join("");

      el.innerHTML = `
        <div class="hardware-kit__top">
          <div>
            <div class="title-row"><h3>${esc(kit.kitCode)}</h3><span class="status-pill ${statusClass}">${esc(kit.status)}</span></div>
            <div class="hardware-name">${esc(kit.name)}</div>
            <div class="hardware-assignment ${kit.assignedCourt ? "is-assigned" : ""}">${esc(assignment)}</div>
          </div>
          <div class="hardware-badges">${caps}</div>
        </div>

        <div class="hardware-grid">
          <label><span>Kit name</span><input data-kit-name value="${esc(kit.name)}"></label>
          <label><span>Camera A stream key</span><input data-cam1 value="${esc(kit.cam1StreamKey)}"></label>
          <label><span>Camera B stream key</span><input data-cam2 value="${esc(kit.cam2StreamKey)}"></label>
          <label><span>Status</span><select data-kit-status><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
        </div>

        <div class="hardware-assign-row">
          <label class="hardware-court-select"><span>Assign / move this kit to</span><select data-court>${courtOptions(assignedKey)}</select></label>
          <button class="save" data-assign>${kit.assignedCourt ? "MOVE KIT" : "ASSIGN KIT"}</button>
          <button class="open-account" data-unassign ${kit.assignedCourt ? "" : "disabled"}>Unassign</button>
        </div>

        <div class="actions hardware-actions">
          <button class="open-account" data-save-kit>Save kit settings</button>
          ${kit.assignedCourt?.viewerUrl ? `<a class="map-link" href="${esc(kit.assignedCourt.viewerUrl)}" target="_blank" rel="noopener">Open assigned court</a>` : ""}
          <a class="map-link" href="${esc(kit.qrUrl)}" target="_blank" rel="noopener">Kit QR</a>
        </div>
        <div class="msg" data-kit-msg hidden></div>
      `;

      el.querySelector("[data-kit-status]").value = kit.status;
      el.querySelector("[data-save-kit]").onclick = () => saveKit(kit, el);
      el.querySelector("[data-assign]").onclick = () => assignKit(kit, el);
      el.querySelector("[data-unassign]").onclick = () => unassignKit(kit, el);
      host.appendChild(el);
    }
  }

  async function createKit() {
    const m = $("#hardwareCreateMsg");
    try {
      m.hidden = true;
      const capabilities = [...$("#newCapabilities").querySelectorAll('input[type="checkbox"]:checked')].map(x => x.value);
      await req("/admin/hardware/kits", {
        method: "POST",
        body: JSON.stringify({
          kitCode: $("#newKitCode").value.trim(),
          name: $("#newKitName").value.trim(),
          slot: 1,
          cam1StreamKey: $("#newCam1").value.trim(),
          cam2StreamKey: $("#newCam2").value.trim(),
          capabilities,
          notes: "",
        }),
      });
      m.textContent = "Hardware kit created.";
      m.hidden = false;
      await load();
    } catch (e) {
      m.textContent = e.message;
      m.hidden = false;
    }
  }

  async function saveKit(kit, el) {
    const m = el.querySelector("[data-kit-msg]");
    try {
      m.hidden = true;
      await req(`/admin/hardware/kit/${kit.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: el.querySelector("[data-kit-name]").value.trim(),
          status: el.querySelector("[data-kit-status]").value,
          cam1StreamKey: el.querySelector("[data-cam1]").value.trim(),
          cam2StreamKey: el.querySelector("[data-cam2]").value.trim(),
        }),
      });
      m.textContent = "Kit settings saved.";
      m.hidden = false;
      await load();
    } catch (e) {
      m.textContent = e.message;
      m.hidden = false;
    }
  }

  async function assignKit(kit, el) {
    const m = el.querySelector("[data-kit-msg]");
    const target = el.querySelector("[data-court]").value;
    if (!target) {
      m.textContent = "Choose a target court first.";
      m.hidden = false;
      return;
    }
    if (kit.assignedCourt?.courtKey && kit.assignedCourt.courtKey !== target) {
      const targetRow = allCourts().find(x => x.courtKey === target);
      const ok = confirm(
        `${kit.kitCode} is currently assigned to ${allCourts().find(x => x.courtKey === kit.assignedCourt.courtKey)?.label || `${kit.assignedCourt.clubName} / ${kit.assignedCourt.courtName}`}.\n\n` +
        `Move it exclusively to ${targetRow?.club.name || target} / ${targetRow?.court.name || "court"}?\n\n` +
        `The old court will immediately lose this hardware assignment.`
      );
      if (!ok) return;
    }
    try {
      m.hidden = true;
      await req(`/admin/hardware/kit/${kit.id}/assign`, {
        method: "POST",
        body: JSON.stringify({ courtKey: target }),
      });
      await load();
    } catch (e) {
      m.textContent = e.message;
      m.hidden = false;
    }
  }

  async function unassignKit(kit, el) {
    if (!kit.assignedCourt) return;
    if (!confirm(`Unassign ${kit.kitCode} from ${kit.assignedCourt.clubName} / ${kit.assignedCourt.courtName}?`)) return;
    const m = el.querySelector("[data-kit-msg]");
    try {
      m.hidden = true;
      await req(`/admin/hardware/kit/${kit.id}/unassign`, { method: "POST", body: "{}" });
      await load();
    } catch (e) {
      m.textContent = e.message;
      m.hidden = false;
    }
  }

  function renderClubs() {
    const host = $("#clubs");
    host.innerHTML = "";
    for (const c of clubs) {
      const el = document.createElement("article");
      el.className = "club";
      const statusClass = c.status === "active" ? "status-active" : c.status === "suspended" ? "status-suspended" : "status-disabled";
      el.innerHTML = `
        <div class="club-head">
          <div>
            <div class="title-row"><h3>${esc(c.name)}</h3><span class="status-pill ${statusClass}">${esc(c.status)}</span></div>
            <div class="meta">${esc(c.countryName)} · ${esc(c.cityName)} · ${esc(c.publicPath)} · DB #${c.dbId}</div>
          </div>
          ${c.logo ? `<img class="club-logo" src="${esc(c.logo)}" alt="">` : ""}
        </div>
        <div class="grid">
          <label><span>Club name</span><input data-name value="${esc(c.name)}"></label>
          <label><span>Address</span><input data-address value="${esc(c.address)}"></label>
          <label><span>Account status</span><select data-status><option value="active">Active</option><option value="suspended">Suspended / billing lock</option><option value="disabled">Disabled</option></select></label>
        </div>
        <div class="admin-logo-row"><input data-logo type="file" accept="image/png,image/jpeg,image/webp"><button data-upload-logo>Replace logo</button>${c.mapsUrl ? `<a class="map-link" href="${esc(c.mapsUrl)}" target="_blank" rel="noopener">Open Google Maps</a>` : ""}</div>
        <div class="court-list"></div>
        <div class="actions">
          <button class="save" data-save>Save club</button>
          <button class="open-account" data-open>Open as club</button>
          <button class="disable" data-suspend>${c.status === "suspended" ? "Re-enable" : "Suspend service"}</button>
          <button class="danger" data-delete>Delete permanently</button>
        </div>
        <div class="msg" data-msg hidden></div>`;
      el.querySelector("[data-status]").value = c.status;
      const ch = el.querySelector(".court-list");
      for (const court of c.courts) {
        const row = document.createElement("div");
        row.className = "court";
        row.dataset.court = court.id;
        const hw = court.hardware?.kitCode ? `<span class="court-hardware">${esc(court.hardware.kitCode)}</span>` : '<span class="court-hardware empty">No kit</span>';
        row.innerHTML = `<strong>${esc(court.id)}</strong><input value="${esc(court.name)}"><select data-sport><option value="tennis">Tennis</option><option value="padel">Padel</option><option value="pickleball">Pickleball</option></select><select data-cstatus><option value="active">Active</option><option value="disabled">Disabled</option></select>${hw}`;
        row.querySelector("[data-sport]").value = court.sport;
        row.querySelector("[data-cstatus]").value = court.status || "active";
        row.querySelector("input").addEventListener("change", () => saveCourt(c.dbId, row));
        row.querySelector("[data-sport]").addEventListener("change", () => saveCourt(c.dbId, row));
        row.querySelector("[data-cstatus]").addEventListener("change", () => saveCourt(c.dbId, row));
        ch.appendChild(row);
      }
      el.querySelector("[data-save]").onclick = () => saveClub(c.dbId, el);
      el.querySelector("[data-open]").onclick = () => openAsClub(c.dbId, el);
      el.querySelector("[data-suspend]").onclick = () => quickSuspend(c, el);
      el.querySelector("[data-upload-logo]").onclick = () => uploadLogo(c.dbId, el);
      el.querySelector("[data-delete]").onclick = () => delClub(c, el);
      host.appendChild(el);
    }
  }

  async function saveCourt(id, row) {
    await req(`/admin/club/${id}/court`, {
      method: "PATCH",
      body: JSON.stringify({
        courtId: row.dataset.court,
        name: row.querySelector("input").value.trim(),
        sport: row.querySelector("[data-sport]").value,
        status: row.querySelector("[data-cstatus]").value,
      }),
    });
    await load();
  }

  async function saveClub(id, el) {
    const m = el.querySelector("[data-msg]");
    try {
      m.hidden = true;
      await req(`/admin/club/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: el.querySelector("[data-name]").value.trim(),
          address: el.querySelector("[data-address]").value.trim(),
          status: el.querySelector("[data-status]").value,
        }),
      });
      m.textContent = "Saved.";
      m.hidden = false;
      await load();
    } catch (e) { m.textContent = e.message; m.hidden = false; }
  }

  async function quickSuspend(c, el) {
    const m = el.querySelector("[data-msg]");
    try {
      const next = c.status === "suspended" ? "active" : "suspended";
      await req(`/admin/club/${c.dbId}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      await load();
    } catch (e) { m.textContent = e.message; m.hidden = false; }
  }

  async function uploadLogo(id, el) {
    const m = el.querySelector("[data-msg]");
    const file = el.querySelector("[data-logo]").files?.[0];
    if (!file) { m.textContent = "Choose a logo file first."; m.hidden = false; return; }
    try {
      const fd = new FormData();
      fd.append("logo", file);
      await req(`/admin/club/${id}/logo`, { method: "POST", body: fd });
      await load();
    } catch (e) { m.textContent = e.message; m.hidden = false; }
  }

  async function openAsClub(id, el) {
    const m = el.querySelector("[data-msg]");
    try {
      const b = await req(`/admin/club/${id}/session`, { method: "POST" });
      window.open(`https://voxcourt.com/members/manage.html?adminSession=${encodeURIComponent(b.adminSession)}`, "_blank", "noopener");
    } catch (e) { m.textContent = e.message; m.hidden = false; }
  }

  async function delClub(c, el) {
    if (prompt(`Type DELETE to permanently remove ${c.name}`) !== "DELETE") return;
    const m = el.querySelector("[data-msg]");
    try {
      await req(`/admin/club/${c.dbId}/delete`, { method: "POST", body: JSON.stringify({ confirm: "DELETE" }) });
      alert("Club deleted. Full VoxCourt data purge has been queued.");
      await load();
    } catch (e) { m.textContent = e.message; m.hidden = false; }
  }

  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    key = $("#adminKey").value.trim();
    try {
      await load();
      $("#login").hidden = true;
      $("#console").hidden = false;
    } catch (err) { msg(err.message); }
  });

  $("#refresh").onclick = () => load();
  $("#createKit").onclick = () => createKit();
})();
