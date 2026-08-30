(() => {
  const API = "https://api.escoreboards.eu/api/club-registry";
  const $ = (s) => document.querySelector(s);
  let setupToken = "";
  let license = null;

  const steps = [$("#step1"), $("#step2"), $("#step3"), $("#step4")];

  function showStep(n) {
    steps.forEach((el, i) => { el.hidden = i !== n - 1; });
    document.querySelectorAll("[data-step-pill]").forEach((el) => {
      el.classList.toggle("active", Number(el.dataset.stepPill) <= n);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setMessage(el, text) {
    el.textContent = text || "";
    el.hidden = !text;
  }

  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
    const r = await fetch(`${API}${path}`, {
      ...options,
      headers,
    });
    let body = null;
    try { body = await r.json(); } catch (_) {}
    if (!r.ok) {
      throw new Error(body?.detail || `Request failed (${r.status})`);
    }
    return body;
  }

  function allowedSportOptions() {
    return (license?.allowedSports || ["tennis"]).map((sport) => {
      const label = sport.charAt(0).toUpperCase() + sport.slice(1);
      return `<option value="${sport}">${label}</option>`;
    }).join("");
  }

  function renderCourtRows() {
    const count = Number($("#courtCount").value || 1);
    const host = $("#courtRows");
    const existing = [...host.querySelectorAll(".court-row")].map((row) => ({
      name: row.querySelector("input")?.value || "",
      sport: row.querySelector("select")?.value || "tennis",
    }));
    host.innerHTML = "";
    for (let i = 1; i <= count; i++) {
      const previous = existing[i - 1] || {};
      const row = document.createElement("div");
      row.className = "court-row";
      row.innerHTML = `
        <div class="court-index">${i}</div>
        <input aria-label="Court ${i} name" value="${previous.name || `Court ${i}`}" maxlength="80" />
        <select aria-label="Court ${i} sport">${allowedSportOptions()}</select>
      `;
      const select = row.querySelector("select");
      if ([...select.options].some(o => o.value === previous.sport)) select.value = previous.sport;
      host.appendChild(row);
    }
  }

  $("#activationForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    setMessage($("#activationMessage"), "");
    button.disabled = true;
    try {
      const body = await api("/setup/activate", {
        method: "POST",
        body: JSON.stringify({ activationCode: $("#activationCode").value.trim() }),
      });
      setupToken = body.setupToken;
      license = body.license;
      $("#licenseBadge").innerHTML = `<strong>License</strong><br>Up to ${license.maxCourts} courts<br>${license.allowedSports.join(" · ")}`;
      const count = $("#courtCount");
      count.innerHTML = "";
      for (let i = 1; i <= license.maxCourts; i++) {
        count.insertAdjacentHTML("beforeend", `<option value="${i}">${i}</option>`);
      }
      count.value = String(Math.min(3, license.maxCourts));
      renderCourtRows();
      showStep(2);
    } catch (err) {
      setMessage($("#activationMessage"), err.message);
    } finally {
      button.disabled = false;
    }
  });

  $("#backTo1").addEventListener("click", () => showStep(1));
  $("#backTo2").addEventListener("click", () => showStep(2));

  $("#toCourts").addEventListener("click", () => {
    if (!$("#clubName").value.trim() || !$("#cityName").value.trim()) {
      alert("Please enter the club name and city.");
      return;
    }
    showStep(3);
  });

  $("#courtCount").addEventListener("change", renderCourtRows);
  $("#clubLogo").addEventListener("change", () => {
    const file = $("#clubLogo").files?.[0];
    const box = $("#logoPreview");
    if (!file) { box.hidden = true; return; }
    if (file.size > 3 * 1024 * 1024) {
      alert("Logo must be smaller than 3 MB.");
      $("#clubLogo").value = "";
      box.hidden = true;
      return;
    }
    $("#logoPreviewImg").src = URL.createObjectURL(file);
    box.hidden = false;
  });


  $("#createClub").addEventListener("click", async () => {
    const button = $("#createClub");
    setMessage($("#createMessage"), "");
    const countrySelect = $("#countryName");
    const countryOption = countrySelect.options[countrySelect.selectedIndex];
    const courts = [...document.querySelectorAll("#courtRows .court-row")].map((row) => ({
      name: row.querySelector("input").value.trim(),
      sport: row.querySelector("select").value,
    }));
    if (courts.some(c => !c.name)) {
      setMessage($("#createMessage"), "Every court needs a name.");
      return;
    }

    button.disabled = true;
    try {
      let logoToken = "";
      const logoFile = $("#clubLogo").files?.[0];
      if (logoFile) {
        const form = new FormData();
        form.append("logo", logoFile);
        const uploaded = await api("/setup/logo", {
          method: "POST",
          headers: { Authorization: `Bearer ${setupToken}` },
          body: form,
        });
        logoToken = uploaded.logoToken || "";
      }

      const body = await api("/setup/club", {
        method: "POST",
        headers: { Authorization: `Bearer ${setupToken}` },
        body: JSON.stringify({
          clubName: $("#clubName").value.trim(),
          countryName: countrySelect.value,
          countryCode: countryOption.dataset.code || "",
          cityName: $("#cityName").value.trim(),
          address: $("#address").value.trim(),
          logoToken,
          courts,
        }),
      });

      $("#resultTitle").textContent = `${body.club.name} is ready.`;
      $("#clubKey").textContent = body.clubKey;
      const host = $("#resultCourts");
      host.innerHTML = "";
      for (const court of body.club.courts) {
        const card = document.createElement("article");
        card.className = "result-court";
        card.innerHTML = `
          <span class="sport">${court.sport}</span>
          <h3>${court.name}</h3>
          <p>${court.courtKey}</p>
          <div class="links">
            <a href="${court.viewerUrl}" target="_blank" rel="noopener">Open viewer</a>
            <a href="${court.qrUrl}" target="_blank" rel="noopener">Court QR</a>
          </div>
        `;
        host.appendChild(card);
      }
      showStep(4);
    } catch (err) {
      setMessage($("#createMessage"), err.message);
    } finally {
      button.disabled = false;
    }
  });

  $("#copyClubKey").addEventListener("click", async () => {
    const key = $("#clubKey").textContent;
    try {
      await navigator.clipboard.writeText(key);
      $("#copyClubKey").textContent = "Copied";
      setTimeout(() => { $("#copyClubKey").textContent = "Copy key"; }, 1200);
    } catch (_) {}
  });

  $("#newSetup").addEventListener("click", () => window.location.reload());
})();
