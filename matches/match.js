"use strict";

const API_BASE =
  "https://api.voxcourt.com/api/matches/history/";


function byId(id) {
  return document.getElementById(id);
}


function asString(value) {
  return value == null
    ? ""
    : String(value);
}


function prettyLabel(value) {
  return asString(value)
    .replace(/-/g, " ")
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );
}


function parseCourtId(courtId) {
  const parts =
    asString(courtId)
      .split("/")
      .filter(Boolean);

  return {
    country: parts[0] || "",
    region: parts[1] || "",
    club: parts[2] || "",
    court: parts[3] || ""
  };
}


function formatDate(value) {
  const number =
    Number(value || 0);

  if (!number) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(
    new Date(number)
  );
}


function formatDuration(seconds) {
  const value =
    Math.max(
      0,
      Number(seconds || 0)
    );

  if (!value) {
    return "—";
  }

  const hours =
    Math.floor(
      value / 3600
    );

  const minutes =
    Math.floor(
      (value % 3600) / 60
    );

  if (hours) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes} min`;
}


function setText(element, value) {
  element.textContent =
    asString(value);
}


function makeDetailPlayer(
  name,
  score,
  isWinner
) {
  const row =
    document.createElement(
      "div"
    );

  row.className =
    isWinner
      ? "detail-player winner"
      : "detail-player";

  const player =
    document.createElement(
      "div"
    );

  player.className =
    "detail-player-name";

  if (isWinner) {
    const dot =
      document.createElement(
        "span"
      );

    dot.className =
      "winner-dot";

    player.appendChild(
      dot
    );
  }

  player.appendChild(
    document.createTextNode(
      name || "Player"
    )
  );

  const result =
    document.createElement(
      "div"
    );

  result.className =
    "detail-player-score";

  setText(
    result,
    score ?? "—"
  );

  row.append(
    player,
    result
  );

  return row;
}


function renderHero(match) {
  const hero =
    byId("matchHero");

  hero.replaceChildren();

  const location =
    parseCourtId(
      match.courtId
    );

  const meta =
    document.createElement(
      "div"
    );

  meta.className =
    "detail-meta";

  const final =
    document.createElement(
      "span"
    );

  final.className =
    "final-pill";

  setText(
    final,
    "Final"
  );

  const date =
    document.createElement(
      "span"
    );

  setText(
    date,
    formatDate(
      match.endedAt ||
      match.archivedAt
    )
  );

  const locationText =
    document.createElement(
      "span"
    );

  setText(
    locationText,
    [
      prettyLabel(
        location.country
      ),
      prettyLabel(
        location.club
      ),
      prettyLabel(
        location.court
      )
    ]
      .filter(Boolean)
      .join(" · ")
  );

  meta.append(
    final,
    date,
    locationText
  );


  const scoreboard =
    document.createElement(
      "div"
    );

  scoreboard.className =
    "detail-scoreboard";

  scoreboard.append(
    makeDetailPlayer(
      match.nameA,
      match.setsA,
      match.winner === "A"
    )
  );

  const divider =
    document.createElement(
      "div"
    );

  divider.className =
    "detail-divider";

  scoreboard.appendChild(
    divider
  );

  scoreboard.append(
    makeDetailPlayer(
      match.nameB,
      match.setsB,
      match.winner === "B"
    )
  );


  hero.append(
    meta,
    scoreboard
  );

  document.title =
    `${match.nameA || "Player"} vs ${match.nameB || "Player"} — VoxCourt`;
}


function addInfoCard(
  container,
  label,
  value
) {
  const card =
    document.createElement(
      "div"
    );

  card.className =
    "info-card";

  const title =
    document.createElement(
      "span"
    );

  title.className =
    "info-label";

  setText(
    title,
    label
  );

  const body =
    document.createElement(
      "div"
    );

  body.className =
    "info-value";

  setText(
    body,
    value || "—"
  );

  card.append(
    title,
    body
  );

  container.appendChild(
    card
  );
}


function renderOverview(match) {
  const grid =
    byId("overviewGrid");

  grid.replaceChildren();

  const location =
    parseCourtId(
      match.courtId
    );

  addInfoCard(
    grid,
    "Result",
    match.finalScore ||
      `${match.setsA ?? "—"}-${match.setsB ?? "—"}`
  );

  addInfoCard(
    grid,
    "Winner",
    match.winnerName ||
      "—"
  );

  addInfoCard(
    grid,
    "Format",
    match.formatLabel ||
      match.metadata?.formatLabel ||
      "—"
  );

  addInfoCard(
    grid,
    "Duration",
    formatDuration(
      match.durationSeconds
    )
  );

  addInfoCard(
    grid,
    "Club",
    prettyLabel(
      location.club
    ) || "—"
  );

  addInfoCard(
    grid,
    "Court",
    prettyLabel(
      location.court
    ) || "—"
  );

  addInfoCard(
    grid,
    "Started",
    formatDate(
      match.startedAt
    )
  );

  addInfoCard(
    grid,
    "Finished",
    formatDate(
      match.endedAt
    )
  );
}


function eventType(event) {
  return asString(
    event.type ||
    event.eventType ||
    "EVENT"
  ).toUpperCase();
}


function eventTitle(event) {
  const type =
    eventType(event);

  const metadata =
    event.metadata || {};

  const side =
    asString(
      metadata.scoringSide
    );

  const nameA =
    asString(
      metadata.nameA
    );

  const nameB =
    asString(
      metadata.nameB
    );

  if (side === "A" && nameA) {
    return `${type} · ${nameA}`;
  }

  if (side === "B" && nameB) {
    return `${type} · ${nameB}`;
  }

  return type;
}


function scoreFromState(state) {
  if (!state) {
    return "";
  }

  const parts = [];

  if (
    state.pointA != null &&
    state.pointB != null
  ) {
    parts.push(
      `${state.pointA}-${state.pointB}`
    );
  }

  if (
    state.gamesA != null &&
    state.gamesB != null
  ) {
    parts.push(
      `Games ${state.gamesA}-${state.gamesB}`
    );
  }

  if (
    state.setsA != null &&
    state.setsB != null
  ) {
    parts.push(
      `Sets ${state.setsA}-${state.setsB}`
    );
  }

  return parts.join(" · ");
}


function eventTimestamp(event) {
  return Number(
    event.createdAt ||
    event.timestamp ||
    event.ts ||
    0
  );
}


function renderTimeline(match) {
  const container =
    byId("timelineList");

  container.replaceChildren();

  const events =
    Array.isArray(match.events)
      ? match.events
      : [];

  if (!events.length) {
    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "archive-message";

    empty.innerHTML =
      "<strong>No timeline events available</strong><span>This match has no archived events.</span>";

    container.appendChild(
      empty
    );

    return;
  }

  events.forEach(
    event => {
      const row =
        document.createElement(
          "div"
        );

      row.className =
        "timeline-event";


      const type =
        document.createElement(
          "div"
        );

      type.className =
        "timeline-type";

      setText(
        type,
        eventType(event)
      );


      const main =
        document.createElement(
          "div"
        );

      main.className =
        "timeline-main";


      const title =
        document.createElement(
          "div"
        );

      title.className =
        "timeline-title";

      setText(
        title,
        eventTitle(event)
      );


      const score =
        document.createElement(
          "div"
        );

      score.className =
        "timeline-score";

      setText(
        score,
        scoreFromState(
          event.after
        )
      );


      main.append(
        title,
        score
      );


      const time =
        document.createElement(
          "div"
        );

      time.className =
        "timeline-time";

      const timestamp =
        eventTimestamp(event);

      setText(
        time,
        timestamp
          ? new Date(timestamp)
              .toLocaleTimeString()
          : ""
      );


      row.append(
        type,
        main,
        time
      );

      container.appendChild(
        row
      );
    }
  );
}


function replayInfo(event) {
  const metadata =
    event.metadata || {};

  return metadata.replay || {};
}


function hasReplay(event) {
  const replay =
    replayInfo(event);

  return Boolean(
    event.clipUrl ||
    event.replayUrl ||
    metadataUrl(event) ||
    replay.url ||
    replay.clipUrl ||
    event.clip
  );
}


function metadataUrl(event) {
  const metadata =
    event.metadata || {};

  return (
    metadata.clipUrl ||
    metadata.replayUrl ||
    ""
  );
}


function getReplayUrl(event) {
  const replay =
    replayInfo(event);

  return (
    event.clipUrl ||
    event.replayUrl ||
    metadataUrl(event) ||
    replay.url ||
    replay.clipUrl ||
    ""
  );
}


function renderHighlights(match) {
  const container =
    byId("highlightsGrid");

  container.replaceChildren();

  const events =
    Array.isArray(match.events)
      ? match.events
      : [];

  const highlights =
    events.filter(
      hasReplay
    );

  if (!highlights.length) {
    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "archive-message";

    empty.innerHTML =
      "<strong>No saved highlights</strong><span>Highlights will appear here when replay media is attached to the archived match.</span>";

    container.appendChild(
      empty
    );

    return;
  }

  highlights.forEach(
    event => {
      const card =
        document.createElement(
          "a"
        );

      card.className =
        "highlight-card";

      const url =
        getReplayUrl(event);

      if (url) {
        card.href = url;
        card.target = "_blank";
        card.rel = "noopener";
      }


      const preview =
        document.createElement(
          "div"
        );

      preview.className =
        "highlight-preview";

      setText(
        preview,
        "▶"
      );


      const copy =
        document.createElement(
          "div"
        );

      copy.className =
        "highlight-copy";


      const title =
        document.createElement(
          "strong"
        );

      setText(
        title,
        eventTitle(event)
      );


      const description =
        document.createElement(
          "span"
        );

      setText(
        description,
        scoreFromState(
          event.after
        ) ||
        "Replay"
      );


      copy.append(
        title,
        description
      );


      card.append(
        preview,
        copy
      );


      container.appendChild(
        card
      );
    }
  );
}


function activateTabs() {
  document
    .querySelectorAll(
      ".match-tab"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            const target =
              button.dataset.tab;

            document
              .querySelectorAll(
                ".match-tab"
              )
              .forEach(
                item =>
                  item.classList.toggle(
                    "active",
                    item === button
                  )
              );

            document
              .querySelectorAll(
                ".tab-panel"
              )
              .forEach(
                panel =>
                  panel.classList.toggle(
                    "active",
                    panel.dataset.panel === target
                  )
              );
          }
        );
      }
    );
}


function showError(message) {
  const hero =
    byId("matchHero");

  hero.innerHTML = "";

  const box =
    document.createElement(
      "div"
    );

  box.className =
    "archive-message";

  const strong =
    document.createElement(
      "strong"
    );

  setText(
    strong,
    "Match unavailable"
  );

  const text =
    document.createElement(
      "span"
    );

  setText(
    text,
    message
  );

  box.append(
    strong,
    text
  );

  hero.appendChild(
    box
  );
}


async function loadMatch() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const matchId =
    asString(
      params.get("id")
    ).trim();

  if (!matchId) {
    showError(
      "No match ID was provided."
    );

    return;
  }

  try {
    const response =
      await fetch(
        API_BASE +
        encodeURIComponent(matchId),
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      !data.ok ||
      !data.match
    ) {
      showError(
        "This match does not exist in the archive."
      );

      return;
    }

    const match =
      data.match;

    renderHero(match);
    renderOverview(match);
    renderHighlights(match);
    renderTimeline(match);

    byId("matchContent").hidden =
      false;

  } catch (error) {
    console.error(
      "Failed to load match:",
      error
    );

    showError(
      "The match could not be loaded. Please try again."
    );
  }
}


setText(
  byId("year"),
  new Date().getFullYear()
);


activateTabs();
loadMatch();

/* ===== VC MATCH DETAIL ENHANCEMENTS START ===== */
(function () {
  if (document.body?.dataset?.page !== "match") return;

  const DEFAULT_A =
    "/tennislive-match/players/default-a.jpg";

  const DEFAULT_B =
    "/tennislive-match/players/default-b.jpg";

  function textOf(el) {
    return (el?.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function unique(list) {
    return Array.from(new Set(list));
  }

  function looksLikeName(txt) {
    if (!txt) return false;

    const t = txt.trim();

    if (t.length < 3 || t.length > 40) {
      return false;
    }

    if (/^\d+$/.test(t)) {
      return false;
    }

    if (
      /^(FINAL|OVERVIEW|HIGHLIGHTS|TIMELINE|MATCH ARCHIVE|RESULT|WINNER|FORMAT|DURATION|STARTED|FINISHED|CLUB|COURT)$/i.test(
        t
      )
    ) {
      return false;
    }

    return /[A-Za-zΑ-ΩΆ-Ώα-ωά-ώ]/.test(t);
  }

  function getBigScoreCards() {
    const all =
      Array.from(
        document.querySelectorAll("main *")
      );

    const scoreEls = all.filter((el) => {
      const t = textOf(el);

      if (!/^\d{1,2}$/.test(t)) {
        return false;
      }

      const fs =
        parseFloat(
          getComputedStyle(el).fontSize || "0"
        ) || 0;

      return fs >= 34 || el.offsetHeight >= 40;
    });

    const cards = [];
    const seen = new Set();

    scoreEls.forEach((scoreEl) => {
      let cur = scoreEl;

      while (
        cur &&
        cur !== document.body
      ) {
        if (
          cur.offsetWidth >= 220 &&
          cur.offsetHeight >= 110
        ) {
          const r =
            cur.getBoundingClientRect();

          const key = [
            Math.round(r.top),
            Math.round(r.left),
            Math.round(r.width),
            Math.round(r.height),
          ].join("|");

          if (!seen.has(key)) {
            seen.add(key);
            cards.push(cur);
          }

          break;
        }

        cur = cur.parentElement;
      }
    });

    return unique(cards)
      .filter(isVisible)
      .sort((a, b) => {
        const ar =
          a.getBoundingClientRect();
        const br =
          b.getBoundingClientRect();

        return (
          ar.top - br.top ||
          ar.left - br.left
        );
      })
      .slice(0, 2);
  }

  function findNameEl(card) {
    const nodes = [
      card,
      ...card.querySelectorAll("*"),
    ];

    const candidates = nodes.filter((el) => {
      const t = textOf(el);
      return (
        looksLikeName(t) &&
        isVisible(el)
      );
    });

    candidates.sort((a, b) => {
      const af =
        parseFloat(
          getComputedStyle(a).fontSize || "0"
        ) || 0;

      const bf =
        parseFloat(
          getComputedStyle(b).fontSize || "0"
        ) || 0;

      return bf - af;
    });

    return candidates[0] || null;
  }

  function decorateScoreCards() {
    const cards =
      getBigScoreCards();

    cards.forEach((card, idx) => {
      if (
        card.dataset.vcPhotoEnhanced ===
        "1"
      ) {
        return;
      }

      const photoWrap =
        document.createElement("div");

      photoWrap.className =
        "vc-detail-player-photo-wrap";

      const img =
        document.createElement("img");

      img.className =
        "vc-detail-player-photo";

      img.alt =
        idx === 0
          ? "Player A"
          : "Player B";

      img.src =
        idx === 0
          ? DEFAULT_A
          : DEFAULT_B;

      img.onerror = () => {
        img.onerror = null;
        img.src =
          idx === 0
            ? DEFAULT_A
            : DEFAULT_B;
      };

      photoWrap.appendChild(img);

      card.classList.add(
        "vc-detail-player-card"
      );

      card.prepend(photoWrap);

      const nameEl =
        findNameEl(card);

      if (nameEl) {
        nameEl.classList.add(
          "vc-detail-player-name"
        );
      }

      card.dataset.vcPhotoEnhanced =
        "1";
    });
  }

  function findTimelineRows() {
    const nodes = Array.from(
      document.querySelectorAll("main *")
    );

    const candidates = [];

    nodes.forEach((el) => {
      const t = textOf(el);

      if (
        !/\b(POINT|GAME|SET)\b/i.test(t)
      ) {
        return;
      }

      if (
        !/Sets?\s*\d+\s*-\s*\d+/i.test(t)
      ) {
        return;
      }

      let cur = el;

      while (
        cur &&
        cur !== document.body
      ) {
        if (
          cur.offsetWidth >= 500 &&
          cur.offsetHeight >= 42
        ) {
          candidates.push(cur);
          break;
        }

        cur = cur.parentElement;
      }
    });

    const rows = unique(candidates)
      .filter(isVisible)
      .sort((a, b) => {
        const ar =
          a.getBoundingClientRect();
        const br =
          b.getBoundingClientRect();

        return (
          ar.top - br.top ||
          ar.left - br.left
        );
      });

    return rows.filter(
      (row, i) =>
        !rows.some(
          (other, j) =>
            i !== j &&
            other !== row &&
            other.contains(row)
        )
    );
  }

  function getTimelineContainer(rows) {
    const counts = new Map();

    rows.forEach((row) => {
      const parent =
        row.parentElement;
      if (!parent) return;

      counts.set(
        parent,
        (counts.get(parent) || 0) + 1
      );
    });

    let best = null;
    let bestCount = 0;

    counts.forEach((count, el) => {
      if (count > bestCount) {
        best = el;
        bestCount = count;
      }
    });

    return best;
  }

  function parseSetInfo(text) {
    const m = text.match(
      /Sets?\s*(\d+)\s*-\s*(\d+)/i
    );

    if (!m) return null;

    const a = Number(m[1]);
    const b = Number(m[2]);

    return {
      a,
      b,
      key: `${a}-${b}`,
      setNumber: a + b + 1,
    };
  }

  function styleTimelineRows() {
    const rows =
      findTimelineRows();

    rows.forEach((row) => {
      row.classList.add(
        "vc-timeline-row"
      );

      const t =
        textOf(row).toUpperCase();

      row.classList.remove(
        "vc-timeline-row--point",
        "vc-timeline-row--game",
        "vc-timeline-row--set",
        "vc-timeline-row--first-in-set"
      );

      if (t.includes("POINT")) {
        row.classList.add(
          "vc-timeline-row--point"
        );
      }

      if (t.includes("GAME")) {
        row.classList.add(
          "vc-timeline-row--game"
        );
      }

      if (t.includes("SET")) {
        row.classList.add(
          "vc-timeline-row--set"
        );
      }
    });
  }

  function insertSetSeparators() {
    const rows =
      findTimelineRows();

    const container =
      getTimelineContainer(rows);

    if (!container) return;

    container
      .querySelectorAll(
        ".vc-timeline-set-separator"
      )
      .forEach((el) => el.remove());

    let lastKey = null;

    rows.forEach((row) => {
      if (!container.contains(row)) {
        return;
      }

      const info =
        parseSetInfo(textOf(row));

      if (!info) return;

      if (info.key !== lastKey) {
        const sep =
          document.createElement("div");

        sep.className =
          "vc-timeline-set-separator";

        sep.innerHTML = `
          <div class="vc-timeline-set-kicker">SET ${info.setNumber}</div>
          <div class="vc-timeline-set-title">Set ${info.setNumber} timeline</div>
          <div class="vc-timeline-set-subtitle">Running sets score: ${info.a}-${info.b}</div>
        `;

        row.before(sep);
        row.classList.add(
          "vc-timeline-row--first-in-set"
        );

        lastKey = info.key;
      }
    });
  }

  function applyEnhancements() {
    decorateScoreCards();
    styleTimelineRows();
    insertSetSeparators();
  }

  let timer = null;

  function scheduleEnhancements() {
    clearTimeout(timer);
    timer = setTimeout(
      applyEnhancements,
      80
    );
  }

  window.addEventListener(
    "load",
    scheduleEnhancements
  );

  document.addEventListener(
    "click",
    () => {
      setTimeout(
        scheduleEnhancements,
        120
      );
    },
    true
  );

  const observer =
    new MutationObserver(() => {
      scheduleEnhancements();
    });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  scheduleEnhancements();
  setTimeout(
    scheduleEnhancements,
    400
  );
  setTimeout(
    scheduleEnhancements,
    1200
  );
})();
/* ===== VC MATCH DETAIL ENHANCEMENTS END ===== */
