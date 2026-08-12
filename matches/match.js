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
