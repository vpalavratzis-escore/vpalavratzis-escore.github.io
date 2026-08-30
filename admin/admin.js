(() => {
  const API = "https://api.escoreboards.eu/api/club-registry";
  const $ = s => document.querySelector(s);
  let key = "";
  let clubs = [];
  let kits = [];
  let nodes = [];
  let staticCourts = [];
  const pairCodes = new Map();

  const ROLE_LABELS = {
    cam1: "Camera A",
    cam2: "Camera B",
    boya: "BOYA / Voice",
    radar: "Radar",
    led: "LED scoreboard",
    replay: "Replay service",
  };

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

  function fmtTime(ms) {
    const value = Number(ms || 0);
    if (!value) return "Never";
    return new Date(value).toLocaleString();
  }

  function allCourts() {
    const byKey = new Map();
    for (const row of staticCourts) byKey.set(row.courtKey, row);
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

  function allDevices() {
    const list = [];
    for (const node of nodes) {
      for (const device of node.devices || []) {
        list.push({ ...device, node });
      }
    }
    return list;
  }

  function compatible(role, device) {
    const kind = String(device?.kind || "").toLowerCase();
    const hints = Array.isArray(device?.metadata?.roleHints)
      ? device.metadata.roleHints.map(x => String(x).toLowerCase())
      : [];
    if (hints.includes(role)) return true;
    if (role === "cam1" || role === "cam2") return kind === "camera";
    if (role === "boya") return ["audio", "usb", "microphone"].includes(kind);
    if (role === "radar") return ["serial", "usb", "radar"].includes(kind);
    if (role === "led") return ["led", "network", "usb", "other"].includes(kind);
    if (role === "replay") return ["service", "replay"].includes(kind);
    return true;
  }

  function deviceOptions(role, currentDeviceId = 0) {
    const devices = allDevices();
    const preferred = devices.filter(d => compatible(role, d));
    const pool = preferred.length ? preferred : devices;
    const options = ['<option value="">— Choose detected device —</option>'];
    for (const d of pool) {
      const current = Number(d.id) === Number(currentDeviceId);
      const usedElsewhere = d.assignment && !current;
      const disabled = usedElsewhere ? " disabled" : "";
      const selected = current ? " selected" : "";
      const status = d.online ? "ONLINE" : "OFFLINE";
      const stream = d.metadata?.streamKey ? ` · ${d.metadata.streamKey}` : "";
      const assigned = usedElsewhere ? ` · USED ${d.assignment.kitCode}/${d.assignment.role}` : "";
      options.push(
        `<option value="${d.id}"${selected}${disabled}>${esc(d.node.nodeCode)} · ${esc(d.name)} · ${esc(status + stream + assigned)}</option>`
      );
    }
    return options.join("");
  }

  async function load() {
    const [clubBody, hardwareBody, nodeBody] = await Promise.all([
      req("/admin/clubs"),
      req("/admin/hardware/kits"),
      req("/admin/hardware/nodes"),
      loadStaticCourts(),
    ]);
    clubs = clubBody.clubs || [];
    kits = hardwareBody.kits || [];
    nodes = nodeBody.nodes || [];
    $("#count").textContent = `${clubs.length} clubs`;
    $("#hardwareCount").textContent = `${kits.length} kits · ${kits.filter(k => k.assignedCourt).length} assigned`;
    $("#nodeCount").textContent = `${nodes.length} PCs · ${nodes.filter(n => n.online).length} online`;
    renderNodes();
    renderHardware();
    renderClubs();
  }

  function renderNodes() {
    const host = $("#nodes");
    host.innerHTML = "";
    if (!nodes.length) {
      host.innerHTML = '<div class="hardware-empty">No Court / Venue PC registered yet. Create VC-NODE-001 above.</div>';
      return;
    }

    for (const node of nodes) {
      const el = document.createElement("article");
      el.className = "hardware-node";
      const liveClass = node.online ? "is-online" : "is-offline";
      const pair = pairCodes.get(node.id);
      const devices = node.devices || [];
      const deviceRows = devices.length
        ? devices.map(d => {
            const ass = d.assignment
              ? `<span class="device-assignment">${esc(d.assignment.kitCode)} · ${esc(ROLE_LABELS[d.assignment.role] || d.assignment.role)}</span>`
              : '<span class="device-assignment empty">Available</span>';
            const stream = d.metadata?.streamKey
              ? `<span class="device-stream">${esc(d.metadata.streamKey)}</span>`
              : "";
            return `<div class="device-row">
              <span class="device-state ${d.online ? "online" : "offline"}"></span>
              <div class="device-main"><strong>${esc(d.name)}</strong><small>${esc(d.kind)} · ${esc(d.transport || "local")} · ${esc(d.deviceKey)}</small></div>
              ${stream}${ass}
            </div>`;
          }).join("")
        : '<div class="device-empty">No devices reported yet. Pair the agent and wait for the first scan.</div>';

      el.innerHTML = `
        <div class="hardware-node__top">
          <div>
            <div class="title-row"><h3>${esc(node.nodeCode)}</h3><span class="node-live ${liveClass}">${node.online ? "ONLINE" : node.paired ? "OFFLINE" : "NOT PAIRED"}</span></div>
            <div class="hardware-name">${esc(node.name)}</div>
            <div class="node-meta">${esc(node.hostname || "No hostname yet")} · Agent ${esc(node.agentVersion || "—")} · Last seen ${esc(fmtTime(node.lastSeenAt))}</div>
          </div>
          <div class="hardware-badges"><span class="hardware-badge">${devices.length} devices</span></div>
        </div>
        <div class="hardware-grid node-settings">
          <label><span>PC / Node name</span><input data-node-name value="${esc(node.name)}"></label>
          <label><span>Status</span><select data-node-status><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
        </div>
        <div class="actions">
          <button class="open-account" data-save-node>Save node</button>
          <button class="save" data-pair-code>${node.paired ? "ROTATE / RE-PAIR PC" : "GENERATE PAIRING CODE"}</button>
        </div>
        ${pair ? `<div class="pair-code-box"><span>PAIRING CODE · valid 15 min</span><strong>${esc(pair.pairingCode)}</strong><small>Run this code on the Court / Venue PC. It is one-time use.</small></div>` : ""}
        <div class="device-list">${deviceRows}</div>
        <div class="msg" data-node-msg hidden></div>
      `;
      el.querySelector("[data-node-status]").value = node.status;
      el.querySelector("[data-save-node]").onclick = () => saveNode(node, el);
      el.querySelector("[data-pair-code]").onclick = () => generatePairCode(node, el);
      host.appendChild(el);
    }
  }

  async function createNode() {
    const m = $("#nodeCreateMsg");
    try {
      m.hidden = true;
      await req("/admin/hardware/nodes", {
        method: "POST",
        body: JSON.stringify({
          nodeCode: $("#newNodeCode").value.trim(),
          name: $("#newNodeName").value.trim(),
        }),
      });
      m.textContent = "Hardware PC registered. Generate a pairing code next.";
      m.hidden = false;
      await load();
    } catch (e) {
      m.textContent = e.message;
      m.hidden = false;
    }
  }

  async function saveNode(node, el) {
    const m = el.querySelector("[data-node-msg]");
    try {
      m.hidden = true;
      await req(`/admin/hardware/node/${node.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: el.querySelector("[data-node-name]").value.trim(),
          status: el.querySelector("[data-node-status]").value,
        }),
      });
      await load();
    } catch (e) {
      m.textContent = e.message;
      m.hidden = false;
    }
  }

  async function generatePairCode(node, el) {
    const m = el.querySelector("[data-node-msg]");
    if (node.paired && !confirm(`Re-pair ${node.nodeCode}? The next successful pairing will rotate its hardware token.`)) return;
    try {
      m.hidden = true;
      const b = await req(`/admin/hardware/node/${node.id}/pair-code`, {
        method: "POST",
        body: "{}",
      });
      pairCodes.set(node.id, b);
      renderNodes();
    } catch (e) {
      m.textContent = e.message;
      m.hidden = false;
    }
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
      const roles = kit.deviceRoles || {};
      const roleCards = Object.keys(ROLE_LABELS).map(role => {
        const current = roles[role] || null;
        const d = current?.device;
        const currentText = d
          ? `${d.name} · ${current.node?.nodeCode || ""}`
          : (role === "cam1" && kit.cam1StreamKey)
            ? `Manual stream · ${kit.cam1StreamKey}`
            : (role === "cam2" && kit.cam2StreamKey)
              ? `Manual stream · ${kit.cam2StreamKey}`
              : "Not paired";
        const stateClass = current?.online ? "online" : current ? "offline" : "empty";
        return `<div class="kit-role-card" data-role="${role}">
          <div class="kit-role-head"><strong>${esc(ROLE_LABELS[role])}</strong><span class="role-state ${stateClass}">${current?.online ? "ONLINE" : current ? "OFFLINE" : "—"}</span></div>
          <div class="kit-role-current">${esc(currentText)}</div>
          <select data-device-select>${deviceOptions(role, d?.id || 0)}</select>
          <div class="kit-role-actions">
            <button class="save" data-pair-device>${current ? "REPLACE" : "PAIR DEVICE"}</button>
            <button class="open-account" data-unpair-device ${current ? "" : "disabled"}>Unpair</button>
          </div>
        </div>`;
      }).join("");

      el.innerHTML = `
        <div class="hardware-kit__top">
          <div>
            <div class="title-row"><h3>${esc(kit.kitCode)}</h3><span class="status-pill ${statusClass}">${esc(kit.status)}</span></div>
            <div class="hardware-name">${esc(kit.name)}</div>
            <div class="hardware-assignment ${kit.assignedCourt ? "is-assigned" : ""}">${esc(assignment)}</div>
            <div class="kit-readiness">Devices: ${kit.onlineDeviceCount || 0} online · ${kit.pairedDeviceCount || 0} paired</div>
          </div>
          <div class="hardware-badges">${caps}</div>
        </div>

        <details class="device-wizard" open>
          <summary>DEVICE PAIRING WIZARD</summary>
          <div class="wizard-flow"><span>1 · Detect on PC</span><b>→</b><span>2 · Pair role</span><b>→</b><span>3 · Assign kit to court</span><b>→</b><span>4 · Lock / operate</span></div>
          <div class="kit-role-grid">${roleCards}</div>
          <div class="wizard-note">Camera credentials and local IPs stay on the Court / Venue PC. The cloud receives only safe identity/status metadata and stream keys.</div>
        </details>

        <details class="advanced-kit-settings">
          <summary>Advanced kit settings</summary>
          <div class="hardware-grid">
            <label><span>Kit name</span><input data-kit-name value="${esc(kit.name)}"></label>
            <label><span>Camera A stream key</span><input data-cam1 value="${esc(kit.cam1StreamKey)}"></label>
            <label><span>Camera B stream key</span><input data-cam2 value="${esc(kit.cam2StreamKey)}"></label>
            <label><span>Status</span><select data-kit-status><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
          </div>
          <div class="actions"><button class="open-account" data-save-kit>Save advanced settings</button></div>
        </details>

        <div class="hardware-assign-row">
          <label class="hardware-court-select"><span>Assign / move this complete kit to</span><select data-court>${courtOptions(assignedKey)}</select></label>
          <button class="save" data-assign>${kit.assignedCourt ? "MOVE KIT" : "ASSIGN KIT"}</button>
          <button class="open-account" data-unassign ${kit.assignedCourt ? "" : "disabled"}>Unassign</button>
        </div>

        <div class="actions hardware-actions">
          ${kit.assignedCourt?.viewerUrl ? `<a class="map-link" href="${esc(kit.assignedCourt.viewerUrl)}" target="_blank" rel="noopener">Open assigned court</a>` : ""}
          <a class="map-link" href="${esc(kit.qrUrl)}" target="_blank" rel="noopener">Kit QR</a>
        </div>
        <div class="msg" data-kit-msg hidden></div>
      `;

      el.querySelector("[data-kit-status]").value = kit.status;
      el.querySelector("[data-save-kit]").onclick = () => saveKit(kit, el);
      el.querySelector("[data-assign]").onclick = () => assignKit(kit, el);
      el.querySelector("[data-unassign]").onclick = () => unassignKit(kit, el);
      el.querySelectorAll("[data-role]").forEach(card => {
        const role = card.dataset.role;
        card.querySelector("[data-pair-device]").onclick = () => pairDevice(kit, role, card, el);
        card.querySelector("[data-unpair-device]").onclick = () => unpairDevice(kit, role, el);
      });
      host.appendChild(el);
    }
  }

  async function pairDevice(kit, role, card, kitEl) {
    const m = kitEl.querySelector("[data-kit-msg]");
    const value = Number(card.querySelector("[data-device-select]").value || 0);
    if (!value) {
      m.textContent = `Choose a detected device for ${ROLE_LABELS[role]}.`;
      m.hidden = false;
      return;
    }
    try {
      m.hidden = true;
      await req(`/admin/hardware/kit/${kit.id}/device`, {
        method: "POST",
        body: JSON.stringify({ role, deviceId: value }),
      });
      await load();
    } catch (e) {
      m.textContent = e.message;
      m.hidden = false;
    }
  }

  async function unpairDevice(kit, role, kitEl) {
    const current = kit.deviceRoles?.[role];
    if (!current) return;
    if (!confirm(`Unpair ${ROLE_LABELS[role]} from ${kit.kitCode}? The kit-to-court assignment will remain unchanged.`)) return;
    const m = kitEl.querySelector("[data-kit-msg]");
    try {
      m.hidden = true;
      await req(`/admin/hardware/kit/${kit.id}/device/${role}`, {
        method: "DELETE",
      });
      await load();
    } catch (e) {
      m.textContent = e.message;
      m.hidden = false;
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
        `${kit.kitCode} is currently assigned to ${allCourts().find(x => x.courtKey === kit.assignedCourt.courtKey)?.label || `${kit.assignedCourt.clubName} / ${kit.assignedCourt.courtName}`}.

` +
        `Move the COMPLETE KIT and all paired devices exclusively to ${targetRow?.club.name || target} / ${targetRow?.court.name || "court"}?

` +
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
    if (!confirm(`Unassign ${kit.kitCode} from ${kit.assignedCourt.clubName} / ${kit.assignedCourt.courtName}? Devices stay married to the kit.`)) return;
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
  $("#createNode").onclick = () => createNode();
})();
