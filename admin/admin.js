(() => {
  const API = "https://api.escoreboards.eu/api/club-registry";
  const $ = s => document.querySelector(s);
  let key = "";
  let clubs = [];
  const esc = s => String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

  async function req(path,opt={}) {
    const h = { "X-VoxCourt-Admin-Key": key, ...(opt.headers||{}) };
    if (!(opt.body instanceof FormData)) h["Content-Type"] = "application/json";
    const r = await fetch(API + path, { ...opt, headers:h });
    let b=null; try{b=await r.json()}catch{}
    if(!r.ok) throw new Error(b?.detail || `Request failed (${r.status})`);
    return b;
  }
  function msg(t){ $("#loginMsg").textContent=t||""; $("#loginMsg").hidden=!t; }
  async function load(){ const b=await req("/admin/clubs"); clubs=b.clubs||[]; $("#count").textContent=`${clubs.length} clubs`; render(); }

  function render(){
    const host=$("#clubs"); host.innerHTML="";
    for(const c of clubs){
      const el=document.createElement("article"); el.className="club";
      const statusClass = c.status === "active" ? "status-active" : c.status === "suspended" ? "status-suspended" : "status-disabled";
      el.innerHTML=`
        <div class="club-head">
          <div>
            <div class="title-row"><h3>${esc(c.name)}</h3><span class="status-pill ${statusClass}">${esc(c.status)}</span></div>
            <div class="meta">${esc(c.countryName)} · ${esc(c.cityName)} · ${esc(c.publicPath)} · DB #${c.dbId}</div>
          </div>
          ${c.logo?`<img class="club-logo" src="${esc(c.logo)}" alt="">`:''}
        </div>
        <div class="grid">
          <label><span>Club name</span><input data-name value="${esc(c.name)}"></label>
          <label><span>Address</span><input data-address value="${esc(c.address)}"></label>
          <label><span>Account status</span><select data-status><option value="active">Active</option><option value="suspended">Suspended / billing lock</option><option value="disabled">Disabled</option></select></label>
        </div>
        <div class="admin-logo-row"><input data-logo type="file" accept="image/png,image/jpeg,image/webp"><button data-upload-logo>Replace logo</button>${c.mapsUrl?`<a class="map-link" href="${esc(c.mapsUrl)}" target="_blank" rel="noopener">Open Google Maps</a>`:""}</div>
        <div class="court-list"></div>
        <div class="actions">
          <button class="save" data-save>Save club</button>
          <button class="open-account" data-open>Open as club</button>
          <button class="disable" data-suspend>${c.status==='suspended'?'Re-enable':'Suspend service'}</button>
          <button class="danger" data-delete>Delete permanently</button>
        </div>
        <div class="msg" data-msg hidden></div>`;
      el.querySelector("[data-status]").value=c.status;
      const ch=el.querySelector(".court-list");
      for(const court of c.courts){
        const row=document.createElement("div"); row.className="court"; row.dataset.court=court.id;
        row.innerHTML=`<strong>${esc(court.id)}</strong><input value="${esc(court.name)}"><select data-sport><option value="tennis">Tennis</option><option value="padel">Padel</option><option value="pickleball">Pickleball</option></select><select data-cstatus><option value="active">Active</option><option value="disabled">Disabled</option></select>`;
        row.querySelector("[data-sport]").value=court.sport;
        row.querySelector("[data-cstatus]").value=court.status||"active";
        row.querySelector("input").addEventListener("change",()=>saveCourt(c.dbId,row));
        row.querySelector("[data-sport]").addEventListener("change",()=>saveCourt(c.dbId,row));
        row.querySelector("[data-cstatus]").addEventListener("change",()=>saveCourt(c.dbId,row));
        ch.appendChild(row);
      }
      el.querySelector("[data-save]").onclick=()=>saveClub(c.dbId,el);
      el.querySelector("[data-open]").onclick=()=>openAsClub(c.dbId,el);
      el.querySelector("[data-suspend]").onclick=()=>quickSuspend(c,el);
      el.querySelector("[data-upload-logo]").onclick=()=>uploadLogo(c.dbId,el);
      el.querySelector("[data-delete]").onclick=()=>delClub(c,el);
      host.appendChild(el);
    }
  }

  async function saveCourt(id,row){
    await req(`/admin/club/${id}/court`,{method:"PATCH",body:JSON.stringify({courtId:row.dataset.court,name:row.querySelector("input").value.trim(),sport:row.querySelector("[data-sport]").value,status:row.querySelector("[data-cstatus]").value})});
  }
  async function saveClub(id,el){ const m=el.querySelector("[data-msg]"); try{m.hidden=true;await req(`/admin/club/${id}`,{method:"PATCH",body:JSON.stringify({name:el.querySelector("[data-name]").value.trim(),address:el.querySelector("[data-address]").value.trim(),status:el.querySelector("[data-status]").value})});m.textContent="Saved.";m.hidden=false;await load()}catch(e){m.textContent=e.message;m.hidden=false} }
  async function quickSuspend(c,el){ const m=el.querySelector("[data-msg]"); try{const next=c.status==="suspended"?"active":"suspended";await req(`/admin/club/${c.dbId}`,{method:"PATCH",body:JSON.stringify({status:next})});await load()}catch(e){m.textContent=e.message;m.hidden=false} }
  async function uploadLogo(id,el){ const m=el.querySelector("[data-msg]"); const file=el.querySelector("[data-logo]").files?.[0]; if(!file){m.textContent="Choose a logo file first.";m.hidden=false;return} try{const fd=new FormData();fd.append("logo",file);await req(`/admin/club/${id}/logo`,{method:"POST",body:fd});await load()}catch(e){m.textContent=e.message;m.hidden=false} }
  async function openAsClub(id,el){ const m=el.querySelector("[data-msg]"); try{const b=await req(`/admin/club/${id}/session`,{method:"POST"});window.open(`https://voxcourt.com/members/manage.html?adminSession=${encodeURIComponent(b.adminSession)}`,"_blank","noopener")}catch(e){m.textContent=e.message;m.hidden=false} }
  async function delClub(c,el){ if(prompt(`Type DELETE to permanently remove ${c.name}`)!=="DELETE")return; const m=el.querySelector("[data-msg]"); try{await req(`/admin/club/${c.dbId}/delete`,{method:"POST",body:JSON.stringify({confirm:"DELETE"})});alert("Club deleted. Full VoxCourt data purge has been queued.");await load()}catch(e){m.textContent=e.message;m.hidden=false} }

  $("#loginForm").addEventListener("submit",async e=>{e.preventDefault();key=$("#adminKey").value.trim();try{await load();$("#login").hidden=true;$("#console").hidden=false}catch(err){msg(err.message)}});
  $("#refresh").onclick=()=>load();
})();
