(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function s(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(n){if(n.ep)return;n.ep=!0;const a=s(n);fetch(n.href,a)}})();function _(){const e=document.getElementById("app");e.innerHTML=`
    <div class="wrap">
      <!-- ===== NAV ===== -->
      <div class="nav">
        <div class="brand">
          <div class="logo"></div>
          <div>e-Scoreboards</div>
        </div>

        <div class="navlinks">
          <a href="/" data-nav>Home</a>
          <a href="/live" data-nav>Find courts</a>
          <a href="#how" data-nav>How it works</a>
          <a href="#contact">Contact</a>
        </div>

        <a class="cta" href="/live" data-nav>Open a court</a>
      </div>

      <!-- ===== HERO ===== -->
      <div class="hero">
        <div class="panel hero-left">

          <div class="kicker">
            <span class="dot"></span>
            Live courts • Smart scoring • Streaming • LED integration
          </div>

          <h1>
            Professional live scoring & streaming
            for Tennis, Padel & Pickleball courts.
          </h1>

          <p class="sub">
            Tablet-controlled live scoring, camera streaming and LED scoreboard
            integration — all connected to a clean online viewer.
            Built for clubs, academies and tournaments.
          </p>

          <div class="actions">
            <a class="btn primary" href="/live" data-nav>Find courts</a>
            <a class="btn" href="/?p=/gr/attica/kavouri-tennis-club/court-1" data-nav>
              Open demo court
            </a>
          </div>

          <div class="bullets">
            <div><span class="tick">✓</span> Real-time names, points, games & sets</div>
            <div><span class="tick">✓</span> Works with RTSP IP cameras (low latency HLS)</div>
            <div><span class="tick">✓</span> LED scoreboard sync (Raspberry Pi)</div>
            <div><span class="tick">✓</span> Multi-court ready & cloud connected</div>
          </div>
        </div>

        <!-- ===== PREVIEW PANEL ===== -->
        <div class="panel hero-right">
          <div class="mock-top">
            <div style="font-weight:900">Live Court Preview</div>
            <div class="pill">Score ✓ • Stream ✓ • LED ✓</div>
          </div>

          <div class="mock">
            <div class="screen">
              <div class="bar">
                <div class="live"><i></i> LIVE • Court 1</div>
                <div>api.escoreboards.eu</div>
              </div>

              <div class="grid2">
                <div class="card">
                  <div class="label">Player A</div>
                  <div class="value">Player A</div>
                  <div class="score">
                    <div class="big">15</div>
                    <div class="mini">
                      <span>G <b>2</b></span>
                      <span>S <b>0</b></span>
                    </div>
                  </div>
                </div>

                <div class="card">
                  <div class="label">Player B</div>
                  <div class="value">Player B</div>
                  <div class="score">
                    <div class="big">30</div>
                    <div class="mini">
                      <span>G <b>3</b></span>
                      <span>S <b>0</b></span>
                    </div>
                  </div>
                </div>
              </div>

              <div style="padding:0 12px 12px">
                <div class="cam"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== HOW IT WORKS ===== -->
      <div id="how" class="panel section">
        <div class="badge"><i></i> How it works</div>

        <div style="margin-top:16px; display:grid; gap:14px;">
          <div><b>1.</b> Tablet controls score (voice or touch)</div>
          <div><b>2.</b> Raspberry Pi streams camera + LED scoreboard</div>
          <div><b>3.</b> Cloud API syncs live data to your website</div>
        </div>
      </div>

      <!-- ===== CONTACT ===== -->
      <div id="contact" class="panel section">
        <div class="badge"><i></i> Contact</div>
        <div style="margin-top:12px;color:var(--muted);font-weight:700;line-height:1.7">
          Email: <b style="color: var(--text)">info@escoreboards.eu</b>
        </div>
      </div>

      <div class="footer">© <span id="y"></span> e-Scoreboards.</div>
    </div>
  `;const t=e.querySelector("#y");t&&(t.textContent=String(new Date().getFullYear()))}function F(e,t){const s=document.createElement("option");return s.value=e,s.textContent=t,s}function g(e,t,s){e.innerHTML="",e.appendChild(F("",s));for(const o of t)e.appendChild(F(o.id,o.name));e.disabled=t.length===0}async function ct(){const t=await fetch("/tennislive-match/config/clubs.json",{cache:"no-store"});if(!t.ok)throw new Error(`Failed to load clubs.json: ${t.status}`);return t.json()}function dt(){const e=document.getElementById("app");e.innerHTML="";const t=document.createElement("div");t.className="wrap",t.innerHTML=`
    <!-- ===== NAV (same as Home) ===== -->
    <div class="nav">
      <div class="brand"><div class="logo"></div><div>e-Scoreboards</div></div>
      <div class="navlinks">
        <a href="/" data-nav>Home</a>
        <a href="/live" data-nav>Find courts</a>
        <a href="/#how" data-nav>How it works</a>
        <a href="/#contact" data-nav>Contact</a>
      </div>
      <a class="cta" href="/live" data-nav>Find a court</a>
    </div>

    <!-- ===== TOP TITLE STRIP ===== -->
    <div class="panel section" style="margin-top:18px;">
      <div class="badge"><i></i> Find a court</div>
      <div class="hint" style="margin-top:10px;">
        Select Country → City → Club → Court and open the live viewer.
      </div>
    </div>

    <!-- ===== MAIN GRID ===== -->
    <div class="viewerWrap">
      <!-- LEFT: selectors -->
      <div class="panel section">
        <div class="badge"><i></i> Court selector</div>

        <div class="selectRow">
          <select id="selCountry"></select>
          <select id="selCity" disabled></select>
          <select id="selClub" disabled></select>
          <select id="selCourt" disabled></select>
          <button id="btnOpen" class="btn primary" disabled>Open</button>
        </div>

        <div class="hint">
          Tip: If you are on-site, the court name usually matches the sign on the fence (Court 1, Court 2, etc).
        </div>
      </div>

      <!-- RIGHT: quick demo / how -->
      <div class="panel section">
        <div class="badge"><i></i> Quick demo</div>
        <div class="hint" style="margin-top:10px;">
          Try a demo court to see how the viewer looks with score + stream.
        </div>

        <div class="actions" style="margin-top:12px;">
          <a class="btn" href="/?p=/gr/attica/kavouri-tennis-club/court-1" data-nav>Open Kavouri Court 1</a>
          <a class="btn" href="/?p=/gr/attica/kavouri-tennis-club/court-2" data-nav>Open Kavouri Court 2</a>
        </div>

        <div style="margin-top:16px; border-top:1px solid var(--line2); padding-top:14px;">
          <div class="badge"><i></i> How it works</div>
          <div class="hint" style="margin-top:10px; line-height:1.7;">
            <b>1.</b> Tablet controls the score<br/>
            <b>2.</b> Raspberry Pi streams the camera + syncs LED<br/>
            <b>3.</b> Cloud API updates the online viewer
          </div>
        </div>
      </div>
    </div>

    <!-- ===== BOTTOM DEMO STRIP ===== -->
    <div class="panel section">
      <div class="badge"><i></i> Demo courts</div>
      <div class="hint" style="margin-top:10px;">
        Tennis / Padel / Pickleball use the same viewer concept — pick a court and open it.
      </div>

      <div class="actions" style="margin-top:12px;">
        <a class="btn" href="/?p=/gr/attica/kavouri-tennis-club/court-1" data-nav>Demo • Kavouri Court 1</a>
        <a class="btn" href="/?p=/gr/attica/kavouri-tennis-club/court-2" data-nav>Demo • Kavouri Court 2</a>
        <a class="btn" href="/" data-nav>Back to Home</a>
      </div>
    </div>

    <div class="footer">© <span id="y"></span> e-Scoreboards.</div>
  `,e.appendChild(t);const s=t.querySelector("#y");s&&(s.textContent=String(new Date().getFullYear()));const o=t.querySelector("#selCountry"),n=t.querySelector("#selCity"),a=t.querySelector("#selClub"),r=t.querySelector("#selCourt"),d=t.querySelector("#btnOpen");let l=null;const v=()=>l?.countries?.find(c=>c.id===o.value),h=()=>(v()?.cities||[]).find(c=>c.id===n.value),p=()=>(h()?.clubs||[]).find(c=>c.id===a.value),C=()=>(p()?.courts||[]).find(c=>c.id===r.value);function B(){const c=v();g(n,c?.cities||[],"City"),g(a,[],"Club"),g(r,[],"Court"),d.disabled=!0}function L(){const c=h();g(a,c?.clubs||[],"Club"),g(r,[],"Court"),d.disabled=!0}function k(){const c=p();g(r,c?.courts||[],"Court"),d.disabled=!0}function f(){const c=v(),b=h(),m=p(),x=C();d.disabled=!(c&&b&&m&&x)}o.addEventListener("change",()=>{B(),f()}),n.addEventListener("change",()=>{L(),f()}),a.addEventListener("change",()=>{k(),f()}),r.addEventListener("change",()=>f()),d.addEventListener("click",()=>{const c=v(),b=h(),m=p(),x=C();if(!(c&&b&&m&&x))return;const T=`/${c.id}/${b.id}/${m.id}/${x.id}`;window.location.href=`/tennislive-match/?p=${encodeURIComponent(T)}`}),(async()=>{try{l=await ct(),g(o,l.countries||[],"Country")}catch(c){t.innerHTML=`
        <div class="wrap">
          <div class="panel section">
            <div class="badge"><i></i> Error</div>
            <pre style="margin-top:12px; white-space:pre-wrap;">${String(c)}</pre>
            <div class="actions" style="margin-top:12px;">
              <a class="btn" href="/" data-nav>Back to Home</a>
            </div>
          </div>
        </div>
      `}})()}function lt(e){return String(e||"").split("/").filter(Boolean)}function K(e){return/^https?:\/\//i.test(String(e||""))}function V(e){const t=String(e||"").trim();return t?K(t)?t:new URL(t,window.location.origin).toString():""}async function pt(){const e="/tennislive-match/",t=await fetch(`${e}config/clubs.json`,{cache:"no-store"});if(!t.ok)throw new Error(`Cannot load ${e}config/clubs.json (${t.status})`);return t.json()}async function N(e){const t=await fetch(e,{cache:"no-store"});if(!t.ok)throw new Error(`Fetch failed (${t.status})`);return t.json()}function E(e,t=28){const s=String(e??"");return s.length>t?s.slice(0,t-1)+"…":s}function A(e,t,s){const o=String(s||"").trim();o?(e.src=o,e.style.display="",t&&(t.style.display="none")):(e.removeAttribute("src"),e.style.display="none",t&&(t.style.display=""))}function ut(e,t){if(!e)return;const s=String(t||"").trim();if(!s)return;try{e._hls&&(e._hls.destroy(),e._hls=null)}catch{}e.muted=!0,e.playsInline=!0,e.autoplay=!0,e.preload="auto";try{e.pause(),e.removeAttribute("src"),e.load()}catch{}const o=navigator.userAgent||"";if(/^((?!chrome|android).)*safari/i.test(o)&&e.canPlayType("application/vnd.apple.mpegurl")){e.src=s,e.play?.().catch(()=>{});return}const a=window.Hls;if(!a||!a.isSupported()){e.src=s,e.play?.().catch(()=>{});return}const r=new a({lowLatencyMode:!0,backBufferLength:30,enableWorker:!0,manifestLoadingTimeOut:2e4,manifestLoadingMaxRetry:3,levelLoadingTimeOut:2e4,levelLoadingMaxRetry:3,fragLoadingTimeOut:2e4,fragLoadingMaxRetry:3});e._hls=r,r.attachMedia(e),r.on(a.Events.MEDIA_ATTACHED,()=>{try{r.loadSource(s),r.startLoad()}catch{}}),r.on(a.Events.MANIFEST_PARSED,()=>{e.play?.().catch(()=>{})}),r.on(a.Events.ERROR,(d,l)=>{if(!(!l||!l.fatal))try{switch(l.type){case a.ErrorTypes.NETWORK_ERROR:r.startLoad();break;case a.ErrorTypes.MEDIA_ERROR:r.recoverMediaError();break;default:r.destroy(),e._hls=null;break}}catch{}})}async function vt(e){const t=document.getElementById("app"),s=lt(e),n=s[0]==="v"?1:0,a=s[n+0]||"",r=s[n+1]||"",d=s[n+2]||"",l=s[n+3]||"";t.innerHTML=`
  <div class="wrap">
    <div class="nav">
      <div class="brand">
        <div class="logo"></div>
        <div>e-Scoreboards</div>
      </div>
      <div class="navlinks">
        <a href="/" data-nav>Home</a>
        <a href="/live" data-nav>Find courts</a>
      </div>
      <a class="cta" href="/live" data-nav>Change court</a>
    </div>

    <div class="panel section" style="min-height:120px;">
      <div class="badge" style="margin-bottom:18px;">
        <i></i> Match info
      </div>
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div id="miTitle" style="font-weight:900; font-size:18px; letter-spacing:.2px;">
          Loading…
        </div>
        <div class="hint" id="miLine2">—</div>
      </div>
    </div>

    <div style="height:16px;"></div>

    <!-- ✅ MOBILE WRAP: κάτω από 900px γίνεται 1 στήλη (score πάνω, video κάτω) -->
    <style>
      @media (max-width: 900px){
        .viewerWrap { grid-template-columns: 1fr !important; }
      }
    </style>

    <div class="viewerWrap" style="grid-template-columns: 1fr 1fr; gap:16px; align-items:stretch;">

      <div class="panel section" style="display:flex; flex-direction:column;">
        <div class="badge"><i></i> Live score</div>

        <div style="display:flex; gap:16px; margin: 10px 0 12px 0;">
          <div style="
              position:relative;
              flex:1 1 0;
              min-width:0;
              height:82px;
              display:flex;
              align-items:center;
              gap:12px;
              padding:12px;
              border-radius:14px;
              background: rgba(255,255,255,.04);
              border: 1px solid rgba(255,255,255,.10);
            ">
            <div style="
                width:56px; height:56px;
                border-radius:999px;
                background: rgba(255,255,255,.08);
                border: 1px solid rgba(255,255,255,.15);
                overflow:hidden;
                display:flex; align-items:center; justify-content:center;
                flex:0 0 auto;
              ">
              <img id="photoA" alt="A"
                   style="width:100%;height:100%;object-fit:cover;display:none;" />
              <span id="photoAph" style="opacity:.65; font-weight:900; letter-spacing:.5px;">A</span>
            </div>

            <div style="min-width:0; flex:1 1 auto; padding-right:54px;">
              <div id="photoATitle" style="
                  font-weight:900;
                  font-size:10px;
                  line-height:1.15;
                  display:-webkit-box;
                  -webkit-line-clamp:2;
                  -webkit-box-orient:vertical;
                  overflow:hidden;
                  word-break:break-word;
                ">Player A</div>
              <div class="hint" style="margin:3px 0 0 0;">Photo</div>
            </div>

            <span id="serveAIcon" style="
                display:none;
                position:absolute;
                right:14px;
                top:50%;
                transform:translateY(-50%);
                width:16px;
                height:16px;
                border-radius:999px;
                background:#ffd34d;
                box-shadow:
                  0 0 0 4px rgba(255,211,77,.16),
                  0 0 14px rgba(255,211,77,.55);
              "></span>
          </div>

          <div style="
              position:relative;
              flex:1 1 0;
              min-width:0;
              height:82px;
              display:flex;
              align-items:center;
              gap:12px;
              padding:12px;
              border-radius:14px;
              background: rgba(255,255,255,.04);
              border: 1px solid rgba(255,255,255,.10);
            ">
            <div style="
                width:56px; height:56px;
                border-radius:999px;
                background: rgba(255,255,255,.08);
                border: 1px solid rgba(255,255,255,.15);
                overflow:hidden;
                display:flex; align-items:center; justify-content:center;
                flex:0 0 auto;
              ">
              <img id="photoB" alt="B"
                   style="width:100%;height:100%;object-fit:cover;display:none;" />
              <span id="photoBph" style="opacity:.65; font-weight:900; letter-spacing:.5px;">B</span>
            </div>

            <div style="min-width:0; flex:1 1 auto; padding-right:54px;">
              <div id="photoBTitle" style="
                  font-weight:900;
                  font-size:10px;
                  line-height:1.15;
                  display:-webkit-box;
                  -webkit-line-clamp:2;
                  -webkit-box-orient:vertical;
                  overflow:hidden;
                  word-break:break-word;
                ">Player B</div>
              <div class="hint" style="margin:3px 0 0 0;">Photo</div>
            </div>

            <span id="serveBIcon" style="
                display:none;
                position:absolute;
                right:14px;
                top:50%;
                transform:translateY(-50%);
                width:16px;
                height:16px;
                border-radius:999px;
                background:#ffd34d;
                box-shadow:
                  0 0 0 4px rgba(255,211,77,.16),
                  0 0 14px rgba(255,211,77,.55);
              "></span>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Point</th>
              <th>Games</th>
              <th>Sets</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td id="nameA" style="font-weight:900; font-size:15px;">—</td>
              <td id="pointA">—</td>
              <td id="gamesA">—</td>
              <td id="setsA">—</td>
            </tr>

            <tr>
              <td id="nameB" style="font-weight:900; font-size:15px;">—</td>
              <td id="pointB">—</td>
              <td id="gamesB">—</td>
              <td id="setsB">—</td>
            </tr>
          </tbody>
        </table>

        <div class="hint" id="status">Waiting for data…</div>
        <div class="hint" id="photostatus" style="margin-top:6px;">PHOTOS / —</div>
        <div style="flex:1 1 auto;"></div>
      </div>

      <div class="panel section" style="display:flex; flex-direction:column;">
        <div class="badge"><i></i> Camera / Stream</div>

        <div class="cam" style="margin-top:10px;">
          <video
            id="camVideo"
            controls
            playsinline
            muted
            autoplay
            style="
              width:100%;
              height:100%;
              object-fit:cover;
              display:block;
              background:black;
            "
          ></video>
        </div>

        <div style="flex:1 1 auto;"></div>
      </div>

    </div>

    <div class="footer">© <span id="y"></span> e-Scoreboards.</div>
  </div>
`,t.querySelector("#y").textContent=String(new Date().getFullYear());const v=t.querySelector("#miTitle"),h=t.querySelector("#miLine2"),p=t.querySelector("#status"),C=t.querySelector("#photostatus"),B=t.querySelector("#camVideo"),L=t.querySelector("#nameA"),k=t.querySelector("#nameB"),f=t.querySelector("#pointA"),c=t.querySelector("#pointB"),b=t.querySelector("#gamesA"),m=t.querySelector("#gamesB"),x=t.querySelector("#setsA"),T=t.querySelector("#setsB"),q=t.querySelector("#photoA"),$=t.querySelector("#photoB"),H=t.querySelector("#photoAph"),D=t.querySelector("#photoBph"),z=t.querySelector("#photoATitle"),Y=t.querySelector("#photoBTitle"),J=t.querySelector("#serveAIcon"),Q=t.querySelector("#serveBIcon");try{const w=await pt();if(!w||!Array.isArray(w.countries))throw new Error("Invalid clubs.json: expected { countries: [...] }");const I=w.countries.find(i=>i.id===a);if(!I)throw new Error(`Country not found: ${a}`);const O=(I.cities||[]).find(i=>i.id===r);if(!O)throw new Error(`City not found: ${r}`);const P=(O.clubs||[]).find(i=>i.id===d);if(!P)throw new Error(`Club not found: ${d}`);const u=(P.courts||[]).find(i=>i.id===l);if(!u)throw new Error(`Court not found: ${l}`);const S=V(u.state||""),X=typeof u.stream=="string"?u.stream:u.stream&&typeof u.stream=="object"?u.stream.url:"",Z=V(X||""),tt=String(u.photosCourt||l||"court-1").trim()||"court-1",et=K(S)?new URL(S).origin:window.location.origin;if(v.textContent=`🎾 ${P.name} – ${u.name}`,h.textContent=`📍 ${O.name}, ${I.name}  •  🔴 LIVE`,p.textContent="VIDEO DEBUG: calling attach...",ut(B,Z),setTimeout(()=>{const i=document.querySelector("video"),y=!!(i&&i._hls);p.textContent="VIDEO DEBUG: attached="+y+" readyState="+(i?i.readyState:-1)},1500),!S){p.textContent="No state URL configured for this court.";return}async function M(){try{const i=await N(S),y=i.nameA??i.playerA?.name??"Player A",W=i.nameB??i.playerB?.name??"Player B",it=i.pointA??i.playerA?.points??i.playerA?.point??i.playerA?.score??"—",st=i.pointB??i.playerB?.points??i.playerB?.point??i.playerB?.score??"—",at=i.gamesA??i.playerA?.games??"—",nt=i.gamesB??i.playerB?.games??"—",ot=i.setsA??i.playerA?.sets??"—",rt=i.setsB??i.playerB?.sets??"—",U=String(i.server||"").toUpperCase();J.style.display=U==="A"?"":"none",Q.style.display=U==="B"?"":"none",L.textContent=E(y,34),k.textContent=E(W,34),f.textContent=String(it),c.textContent=String(st),b.textContent=String(at),m.textContent=String(nt),x.textContent=String(ot),T.textContent=String(rt),z.textContent=E(y,30),Y.textContent=E(W,30),p.textContent=`LIVE ✓ Updated: ${new Date().toLocaleTimeString()}`}catch(i){p.textContent=`Waiting… (${i.message})`}}async function j(){try{const i=`${et}/api/photos?court=${encodeURIComponent(tt)}`,y=await N(i);A(q,H,y.playerA||""),A($,D,y.playerB||""),C.textContent=`PHOTOS ✓ Updated: ${new Date().toLocaleTimeString()}`}catch(i){C.textContent=`PHOTOS / Waiting… (${i.message})`,A(q,H,""),A($,D,"")}}M(),j(),setInterval(M,1e3),setInterval(j,2e3)}catch(w){v.textContent="Config load error",h.textContent=String(w.message||w),p.textContent="Fix config and refresh."}}const G=document.getElementById("app");G?G.innerHTML='<div style="padding:16px;font-family:Inter,system-ui,sans-serif">Loading…</div>':console.error("Missing #app");function R(){const e="/tennislive-match/",t=new URL(window.location.href),s=t.searchParams.get("p");if(s){const n=decodeURIComponent(s);return vt(n)}let o=t.pathname;return o.startsWith(e)&&(o=o.slice(e.length-1)),o=o.replace(/\/+$/,"")||"/",o==="/"?_():o==="/live"?dt():_()}function ht(e){const t=e.target.closest("a");if(!t)return;const s=t.getAttribute("href");!s||s.startsWith("http")||s.startsWith("mailto:")||s.startsWith("tel:")||t.target==="_blank"||s.startsWith("/")&&(e.preventDefault(),history.pushState({},"","/tennislive-match/".replace(/\/+$/,"")+s),R())}window.addEventListener("popstate",R);document.addEventListener("click",ht);R();
