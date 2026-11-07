(function companion(){
"use strict";
const D=window.NATURIA_DATA,root=document.getElementById("content");
const h=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function route(){const p=(location.hash||"#/home").replace(/^#\/?/,"").split("/");return {base:p[0],id:decodeURIComponent(p[1]||"")}}
function block(markup){root.insertAdjacentHTML("beforeend",`<section class="section v2-companion"><div class="page-width">${markup}</div></section>`)}
function add(){
const {base,id}=route();
if(base==="history"){
block(`<div class="v2-intro"><div class="v2-diary-art"><span>1890</span><span>1953</span><span>1974</span><span>NOW</span></div><div><div class="v2-eyebrow">A CULTURAL HISTORY, NOT A MYTH</div><h2>The story is bigger than one century.</h2><p>Clothing practices across the ancient world and in different societies must not be mistaken for the modern European naturist movement. Our timeline focuses on documented movements, organisations and their later ethical ideas.</p></div></div><div class="v2-grid" style="margin-top:24px">
 <article class="v2-panel"><h3>🌾 Ancient cultures and ordinary bathing</h3><p>Public bathing, dress practices, body-related beliefs and ritual settings varied immensely across time and place. They cannot be summarised as a single global naturist tradition. Study each culture on its own terms.</p></article>
 <article class="v2-panel"><h3>🌱 The European life-reform era</h3><p>In the late nineteenth and early twentieth centuries, some reform movements promoted outdoor health, exercise and a less restrictive relationship with clothing. Their participants and politics were not uniform.</p></article>
 <article class="v2-panel"><h3>🌍 International cooperation</h3><p>National movements connected across borders. The International Naturist Federation was founded in 1953. Its later definition emphasised respect for self, others and the environment.</p><a href="https://inf-fni.org/about-naturism/" target="_blank" rel="noopener">INF-FNI background ↗</a></article>
 <article class="v2-panel"><h3>🌸 A contemporary ethic</h3><p>Today's responsible naturism intersects with privacy, inclusivity, environmental protection, access and clearly defined rules. This is a living social practice, not a promise that every coastline has the same laws.</p><a href="#/magazine">Read cultural essays ↗</a></article>
 </div>`);
}
if(base==="topless"){
block(`<div class="v2-panel"><div class="v2-eyebrow">TOPFREE CULTURAL NOTES</div><h2>Three questions to ask in every country</h2><div class="v2-grid">
 <article><h3>☀️ What behaviour?</h3><p>Sunbathing topless, swimming with an uncovered chest and complete nudity may be treated differently. Never assume the answer to one settles the others.</p></article>
 <article><h3>📍 Which place?</h3><p>Public beach, privately managed resort, urban park and sports centre can have different local rules or dress codes.</p></article>
 <article><h3>⚖️ What evidence?</h3><p>Distinguish cultural practice, federation guidance, an official rule and a court decision. Consult dated primary sources before relying on them.</p></article>
 <article><h3>🪧 What's posted today?</h3><p>A current on-site notice or management instruction matters more than general travel claims. Respect all other beach users and their privacy.</p></article></div><div class="v2-button-row"><a class="v2-button" href="#/observatory">Open Law Observatory</a><a class="v2-button alt" href="#/signs">Read illustrated signs</a></div></div>`);
}
if(base==="country"){
const c=D.countries.find(x=>x.code===id.toUpperCase());if(c)block(`<div class="v2-panel"><div class="v2-eyebrow">REGIONAL NOTES</div><h2>${h(c.flag)} ${h(c.name)} — explore by region</h2><p>Group the existing source-attributed beach and resort entries by their geographical region. These groupings are editorial and are not permission boundaries.</p><a class="v2-button" href="#/regions/${encodeURIComponent(c.code)}">View ${h(c.name)} regional guide ↗</a></div>`);
}
if(base==="place"){
const p=D.places.find(x=>x.id===id);if(p){
const cards=[["🪧","Boundary & rules","Confirm exactly where the permitted section begins and ends."],["🧻","Services & hygiene","Toilets, showers and amenities are unverified unless the original source expressly says otherwise."],["🦽","Accessibility","Confirm path surface, steps, distances and any support facilities directly with the site."],["🚌","Getting there","Location markers are approximate and not navigation coordinates for an access point."],["🌊","Environmental safety","Check surf, currents, tides, weather, protected dunes and seasonal closures."],["📵","Privacy & consent","Ask before photography; respect any venue bans and other visitors' boundaries."]];
block(`<div class="v2-eyebrow">THE CONSIDERATE TRAVELLER'S CHECKLIST</div><h2>Before visiting ${h(p.name)}</h2><p class="muted">Practical topics to verify, not service claims or personal reviews.</p><div class="v2-grid">${cards.map(x=>`<article class="v2-panel"><h3>${x[0]} ${x[1]}</h3><p>${x[2]}</p></article>`).join("")}</div><div class="v2-button-row" style="margin-top:23px"><a class="v2-button" href="#/journey">Add to a private journey</a><a class="v2-button alt" href="${h(p.url)}" target="_blank" rel="noopener">Check the reference ↗</a></div>`)}
}
if(base==="contact"){
block(`<div class="v2-panel"><h2>✉️ A real correction channel</h2><p>You can now suggest a factual correction directly through the public GitHub Issues form. A GitHub account is required. Please submit only place names, official source URLs and factual descriptions — never upload photos of visitors or share private information.</p><a class="v2-button" href="https://github.com/xuthar/naturia-world/issues/new?template=correction.yml" target="_blank" rel="noopener">Open the correction form ↗</a><p class="v2-small">Submissions are public. For urgent safety questions, contact a venue operator or competent local authority rather than the site's issue tracker.</p></div>`);
}
if(base==="resources"){
block(`<div class="v2-panel"><h2>🔎 Source links checked weekly</h2><p>A scheduled GitHub Action checks whether selected reference URLs respond to HTTP requests. It cannot confirm a place's legal status, details, prices, opening hours or accuracy, and it never silently rewrites the editorial data.</p><a href="https://github.com/xuthar/naturia-world/actions/workflows/source-audit.yml" target="_blank" rel="noopener">Review source audit history ↗</a></div>`);
}
}
window.addEventListener("hashchange",add);add();
})();
