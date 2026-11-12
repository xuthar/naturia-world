/* On-demand, place-specific landscape photos from Wikimedia Commons.
   Uses geotagged files, exact locality-name matches, an open-license allowlist,
   visible attribution, and conservative title/category filters. */
(function(){
"use strict";
const root=document.getElementById("content");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const plain=s=>String(s??"").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&#39;/g,"'");
const norm=s=>plain(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const stop=new Set("naturist naturism nudist nude beach beaches coast coastlines shore oasis area resort naturism site lido di of the and at near bay beach place naturista naturismo".split(" "));
const blocked=new Set("people person man woman men women child children girl boy family crowd portrait selfie tourist tourists visitor visitors nudist nude naked naturist naturism nudity topless sex".split(" "));
const isReusable=license=>{
 const l=String(license||"").trim().toLowerCase();
 if(!l||/\b(nc|nd|non.?commercial|no.?derivatives|unknown)\b/.test(l))return false;
 return l==="cc0"||/^cc0\b/.test(l)||/^public domain\b/.test(l)||/^pd\b/.test(l)||/^cc by(?:-sa)?\s*[0-9]/i.test(l);
};
const tokens=s=>(norm(s).match(/[a-z0-9]+/g)||[]).filter(t=>t.length>=4&&!stop.has(t));
const banned=(s)=>tokens(s).some(t=>blocked.has(t))||/(^|[ _-])(people|person|portrait|selfie|tourist|visitor|nudist|nude|naked|naturist|naturism|topless|family|children|girl|boy|woman|man)([ _.-]|$)/i.test(String(s||""));
function mount(p){
 const host=document.getElementById("place-photo-gallery");
 if(!host||!p||!Array.isArray(p.coords))return;
 const btnId="commons-photo-search-"+String(p.id).replace(/[^a-z0-9_-]/gi,"");
 host.innerHTML='<section class="panel detail-card place-photo-panel"><div class="place-photo-heading"><span aria-hidden="true">📷</span><div><span class="place-photo-kicker">REAL PLACE PHOTOGRAPHS</span><h3>See the landscape</h3></div></div><p>Search Wikimedia Commons for open-license photographs geotagged near this approximate location and matched to its place name. Every result shows its author, licence and source.</p><button class="btn btn-small" type="button" id="'+esc(btnId)+'">Find landscape photos</button><p class="place-photo-privacy">This search sends the place name and approximate atlas coordinates to Wikimedia Commons. It does not upload files or select images of people by design.</p><div class="place-photo-results" aria-live="polite"></div></section>';
 const button=document.getElementById(btnId),results=host.querySelector(".place-photo-results");
 const lat=Number(p.coords[0]),lon=Number(p.coords[1]);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)){button.disabled=true;button.textContent="No map coordinates";return;}
 button.addEventListener("click",async()=>{
   button.disabled=true;button.textContent="Searching open photographs…";
   results.innerHTML='<p class="place-photo-status">Checking geotagged photos, place names and reuse licences…</p>';
   const q=new URL("https://commons.wikimedia.org/w/api.php");
   const params={action:"query",format:"json",origin:"*",generator:"geosearch",ggscoord:lat+"|"+lon,ggsradius:"10000",ggsnamespace:"6",ggsprimary:"all",ggslimit:"50",ggsprop:"type|name|country|region",prop:"imageinfo|categories|coordinates",iiprop:"url|extmetadata|mime",iiurlwidth:"1200",iilimit:"1",cllimit:"30"};
   for(const [k,v] of Object.entries(params))q.searchParams.set(k,v);
   try{
     const response=await fetch(q.toString(),{credentials:"omit",referrerPolicy:"no-referrer",headers:{Accept:"application/json"}});
     if(!response.ok)throw new Error("Photo service unavailable");
     const data=await response.json();
     const pages=Object.values(data?.query?.pages||{});
     const placeTokens=new Set(tokens((p.name||"")+" "+(p.area||"")));
     const found=pages.map(page=>{
       const info=page.imageinfo&&page.imageinfo[0],meta=info&&info.extmetadata||{};
       const title=(page.title||"").replace(/^File:/,"");
       const categories=(page.categories||[]).map(x=>x.title||"").join(" ");
       const searchText=norm(title+" "+categories);
       const hasName=[...placeTokens].some(t=>searchText.includes(t));
       const license=plain(meta.LicenseShortName?.value||"");
       const distance=page.coordinates?.[0]?.dist;
       const mime=info?.mime||"";
       if(!info||!info.thumburl||!/^image\/(jpeg|png|webp)$/i.test(mime)||!hasName||!isReusable(license)||banned(title+" "+categories))return null;
       if(Number.isFinite(distance)&&distance>10000)return null;
       if((info.width||0)<800||(info.height||0)<400||info.width<info.height)return null;
       return {title,thumb:info.thumburl,file:info.descriptionurl,license,licenseUrl:meta.LicenseUrl?.value||"",author:plain(meta.Artist?.value||meta.Credit?.value||"Author not stated"),distance:Number.isFinite(distance)?distance:null};
     }).filter(Boolean);
     const unique=found.filter((x,i,a)=>a.findIndex(y=>y.title===x.title)===i).slice(0,6);
     if(!unique.length){
       results.innerHTML='<div class="place-photo-empty"><strong>No verified landscape photo found here yet.</strong><span>We found no nearby Commons image that matched this place name and an allowed reuse licence. The illustrated scene remains as the guide image.</span></div>';
     }else{
       results.innerHTML='<div class="place-photo-grid">'+unique.map(x=>{
         const d=x.distance===null?"within the 10 km search area":(x.distance<1000?Math.round(x.distance)+" m from the approximate map point":(x.distance/1000).toFixed(1)+" km from the approximate map point");
         return '<figure class="place-photo-card"><a href="'+esc(x.file)+'" target="_blank" rel="noopener noreferrer"><img src="'+esc(x.thumb)+'" alt="Landscape photograph associated with '+esc(p.name)+'" loading="lazy" referrerpolicy="no-referrer"></a><figcaption><strong>'+esc(x.title)+'</strong><span>'+esc(d)+' · Wikimedia Commons</span><span>Author: '+esc(x.author)+'</span><span>Licence: '+(x.licenseUrl?'<a href="'+esc(x.licenseUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(x.license)+'</a>':esc(x.license))+' · <a href="'+esc(x.file)+'" target="_blank" rel="noopener noreferrer">file page</a></span></figcaption></figure>';
       }).join("")+'</div><p class="place-photo-note">These are open-license photographs whose Commons file names or categories match the locality and whose coordinates fall near the atlas marker. Map markers are approximate; open the file page to confirm the scene and complete attribution.</p>';
     }
   }catch(error){
     results.innerHTML='<p class="place-photo-status">Wikimedia Commons could not be reached just now. The illustrated destination guide is still available; try again later.</p>';
   }finally{
     button.disabled=false;button.textContent="Search again";
   }
 });
}
window.NATURIA_PLACE_PHOTOS={mount};
})();