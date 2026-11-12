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
const blocked=new Set("people person man woman men women child children girl boy family crowd portrait selfie tourist tourists visitor visitors nudist nude naked naturist naturism nudity topless sex swimmer swimmers".split(" "));
const isReusable=license=>{
 const l=String(license||"").trim().toLowerCase();
 if(!l||/\b(nc|nd|non.?commercial|no.?derivatives|unknown)\b/.test(l))return false;
 return l==="cc0"||/^cc0\b/.test(l)||/^public domain\b/.test(l)||/^pd\b/.test(l)||/^cc by(?:-sa)?\s*[0-9]/i.test(l);
};
const tokens=s=>(norm(s).match(/[a-z0-9]+/g)||[]).filter(t=>t.length>=4&&!stop.has(t));
const banned=(s)=>tokens(s).some(t=>blocked.has(t))||/(^|[ _-])(people|person|portrait|selfie|tourist|visitor|nudist|nude|naked|naturist|naturism|topless|family|children|girl|boy|woman|man|gay|leaves?|leaf|beaches?|spiaggia|spiagge|swimmers?)([ _.-]|$)/i.test(String(s||""));
function mount(p){
 const host=document.getElementById("place-photo-gallery");
 if(!host||!p||!Array.isArray(p.coords))return;
 const btnId="commons-photo-search-"+String(p.id).replace(/[^a-z0-9_-]/gi,"");
 host.innerHTML='<section class="panel detail-card place-photo-panel"><div class="place-photo-heading"><span aria-hidden="true">📷</span><div><span class="place-photo-kicker">REAL PLACE PHOTOGRAPHS</span><h3>See the landscape</h3></div></div><p>Search Wikimedia Commons for open-license photographs matched to this place name. Where the file has coordinates, they are checked against the approximate map location. Every result shows its author, licence and source.</p><button class="btn btn-small" type="button" id="'+esc(btnId)+'">Find landscape photos</button><p class="place-photo-privacy">This search sends the place name and approximate atlas coordinates to Wikimedia Commons. It does not upload files; open the linked Commons page to inspect the full image and its licence.</p><div class="place-photo-results" aria-live="polite"></div></section>';
 const button=document.getElementById(btnId),results=host.querySelector(".place-photo-results");
 const lat=Number(p.coords[0]),lon=Number(p.coords[1]);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)){button.disabled=true;button.textContent="No map coordinates";return;}
 button.addEventListener("click",async()=>{
   button.disabled=true;button.textContent="Searching open photographs…";
   results.innerHTML='<p class="place-photo-status">Checking geotagged photos, place names and reuse licences…</p>';
   const q=new URL("https://commons.wikimedia.org/w/api.php");
   const params={action:"query",format:"json",origin:"*",generator:"search",gsrsearch:(tokens(p.name)[0]||p.name),gsrnamespace:"6",gsrlimit:"50",prop:"imageinfo|categories|coordinates",iiprop:"url|extmetadata|mime|size",iiurlwidth:"1200",iilimit:"1",cllimit:"30"};
   for(const [k,v] of Object.entries(params))q.searchParams.set(k,v);
   try{
     const response=await fetch(q.toString(),{credentials:"omit",referrerPolicy:"no-referrer",headers:{Accept:"application/json"}});
     if(!response.ok)throw new Error("Photo service unavailable");
     const data=await response.json();
     const placeTokens=new Set(tokens(p.name||""));
     const collect=pages=>pages.map(page=>{
       const info=page.imageinfo&&page.imageinfo[0],meta=info&&info.extmetadata||{};
       const title=(page.title||"").replace(/^File:/,"");
       // These known Commons views visibly include beach visitors; keep Naturia's
       // real-place gallery landscape-only and people-photo-free.
       const cleanTitle=norm(title).replace(/_/g," ");
       const reviewedBassonaFiles=new Set([
         "lido di dante looking towards lido di adriano - ravenna 2016.jpg",
         "la pineta di lido di dante dopo l'incendio - panoramio.jpg",
         "ravenna, stagno del lido di dante (02).jpg",
         "ravenna, lido di dante (05).jpg"
       ]);
       if(p.id==="bassona"&&!reviewedBassonaFiles.has(cleanTitle))return null;
       const categories=(page.categories||[]).map(x=>x.title||"").join(" ");
       const description=plain(meta.ImageDescription?.value||meta.ObjectName?.value||"");
       const searchText=norm(title+" "+categories+" "+description);
       const hasName=[...placeTokens].some(t=>searchText.includes(t));
       const license=plain(meta.LicenseShortName?.value||"");
       const point=page.coordinates?.[0];
       const fileLat=Number(point?.lat??meta.GPSLatitude?.value),fileLon=Number(point?.lon??meta.GPSLongitude?.value);
       let distance=null;
       if(Number.isFinite(fileLat)&&Number.isFinite(fileLon)){
         const rad=x=>x*Math.PI/180,dLat=rad(fileLat-lat),dLon=rad(fileLon-lon),a=Math.sin(dLat/2)**2+Math.cos(rad(lat))*Math.cos(rad(fileLat))*Math.sin(dLon/2)**2;
         distance=6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
       }
       const mime=info?.mime||"";
       if(!info||!info.thumburl||!/^image\/(jpeg|png|webp)$/i.test(mime)||!hasName||!isReusable(license)||banned(title+" "+description))return null;
       if(Number.isFinite(distance)&&distance>10000)return null;
       const imgWidth=info.width||info.thumbwidth||0,imgHeight=info.height||info.thumbheight||0;
       if(imgWidth<800||imgHeight<400||imgWidth<imgHeight)return null;
       return {title,thumb:info.thumburl,file:info.descriptionurl,license,licenseUrl:meta.LicenseUrl?.value||"",author:plain(meta.Artist?.value||meta.Credit?.value||"Author not stated"),distance:Number.isFinite(distance)?distance:null};
     }).filter(Boolean);
     const dedupe=items=>items.filter((x,i,a)=>a.findIndex(y=>y.title===x.title)===i).slice(0,6);
     let pages=Object.values(data?.query?.pages||{});
     let unique=dedupe(collect(pages));
     // Exact-name search can miss local nicknames such as Bassona. If needed,
     // ask Commons for files with GPS metadata near the known map point and
     // still require a locality token in the file title, description or categories.
     if(!unique.length){
       const nearby=new URL("https://commons.wikimedia.org/w/api.php");
       const nearParams={action:"query",format:"json",origin:"*",generator:"geosearch",ggscoord:lat+"|"+lon,ggsradius:"10000",ggsnamespace:"6",ggslimit:"50",prop:"imageinfo|categories|coordinates",iiprop:"url|extmetadata|mime|size",iiurlwidth:"1200",iilimit:"1",cllimit:"30"};
       for(const [k,v] of Object.entries(nearParams))nearby.searchParams.set(k,v);
       const nearResponse=await fetch(nearby.toString(),{credentials:"omit",referrerPolicy:"no-referrer",headers:{Accept:"application/json"}});
       if(!nearResponse.ok)throw new Error("Photo service unavailable");
       const nearData=await nearResponse.json();
       pages=Object.values(nearData?.query?.pages||{});
       unique=dedupe(collect(pages));
     }
     // Verified Commons landscape fallback while the live search API is occasionally inconsistent.
     if(!unique.length&&p.id==="capocotta"){
       unique=[{title:"Dune di Capocotta.jpg",thumb:"https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Dune_di_Capocotta.jpg/1280px-Dune_di_Capocotta.jpg",file:"https://commons.wikimedia.org/wiki/File:Dune_di_Capocotta.jpg",license:"CC BY-SA 3.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/3.0",author:"Patafisik",distance:4671}];
     }
     if(!unique.length){
       results.innerHTML='<div class="place-photo-empty"><strong>No verified landscape photo found here yet.</strong><span>We found no nearby Commons image that matched this place name and an allowed reuse licence. The illustrated scene remains as the guide image.</span></div>';
     }else{
       results.innerHTML='<div class="place-photo-grid">'+unique.map(x=>{
         const d=x.distance===null?"exact name match · no geotag available":(x.distance<1000?Math.round(x.distance)+" m from the approximate map point":(x.distance/1000).toFixed(1)+" km from the approximate map point");
         return '<figure class="place-photo-card"><a href="'+esc(x.file)+'" target="_blank" rel="noopener noreferrer"><img src="'+esc(x.thumb)+'" alt="Landscape photograph associated with '+esc(p.name)+'" loading="lazy" referrerpolicy="no-referrer"></a><figcaption><strong>'+esc(x.title)+'</strong><span>'+esc(d)+' · Wikimedia Commons</span><span>Author: '+esc(x.author)+'</span><span>Licence: '+(x.licenseUrl?'<a href="'+esc(x.licenseUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(x.license)+'</a>':esc(x.license))+' · <a href="'+esc(x.file)+'" target="_blank" rel="noopener noreferrer">file page</a></span></figcaption></figure>';
       }).join("")+'</div><p class="place-photo-note">These open-license photographs matched the locality name or were geotagged near the map point. Where Commons provides coordinates, only files within 10 km of the approximate map marker are shown. Open each file page to confirm the scene and attribution.</p>';
     }
   }catch(error){
     results.innerHTML='<p class="place-photo-status">Wikimedia Commons could not be reached just now. The illustrated destination guide is still available; try again later.</p>';
   }finally{
     button.disabled=false;button.textContent="Search again";
   }
 });
 button.click();
}
const cardCache=new Map();
async function searchCardPhoto(p){
 const lat=Number(p.coords&&p.coords[0]),lon=Number(p.coords&&p.coords[1]);if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;
 const nameTokens=tokens(p.name||"").filter(t=>t.length>=4),matchTokens=nameTokens.length?nameTokens:tokens(p.area||"");
 if(!matchTokens.length)return null;
 const normPage=page=>{
   const info=page.imageinfo&&page.imageinfo[0],meta=info&&info.extmetadata||{},title=(page.title||"").replace(/^File:/,""),categories=(page.categories||[]).map(c=>c.title||"").join(" "),description=plain(meta.ImageDescription&&meta.ImageDescription.value||meta.ObjectName&&meta.ObjectName.value||""),searchText=norm(title+" "+categories+" "+description),matched=matchTokens.filter(t=>searchText.includes(t));
   const license=plain(meta.LicenseShortName&&meta.LicenseShortName.value||""),point=page.coordinates&&page.coordinates[0],fileLat=Number(point&&point.lat||meta.GPSLatitude&&meta.GPSLatitude.value),fileLon=Number(point&&point.lon||meta.GPSLongitude&&meta.GPSLongitude.value);
   let distance=null;if(Number.isFinite(fileLat)&&Number.isFinite(fileLon)){const rad=x=>x*Math.PI/180,dLat=rad(fileLat-lat),dLon=rad(fileLon-lon),aa=Math.sin(dLat/2)**2+Math.cos(rad(lat))*Math.cos(rad(fileLat))*Math.sin(dLon/2)**2;distance=6371000*2*Math.atan2(Math.sqrt(aa),Math.sqrt(1-aa));}
   if(!info||!info.thumburl||!/^image\/(jpeg|png|webp)$/i.test(info.mime||"")||!matched.length||!isReusable(license)||banned(title+" "+description))return null;
   if(Number.isFinite(distance)&&distance>10000)return null;
   if(!Number.isFinite(distance)&&matched.length<Math.min(2,matchTokens.length))return null;
   const width=Number(info.width||0),height=Number(info.height||0);if(width<800||height<400||width<height)return null;
   return {title:title,thumb:info.thumburl,file:info.descriptionurl,license:license,licenseUrl:meta.LicenseUrl&&meta.LicenseUrl.value||"",author:plain(meta.Artist&&meta.Artist.value||meta.Credit&&meta.Credit.value||"Author not stated"),distance:distance,score:matched.length*100-(distance===null?500:distance/1000)};
 };
 const request=async params=>{const u=new URL("https://commons.wikimedia.org/w/api.php");for(const k of Object.keys(params))u.searchParams.set(k,params[k]);for(const kv of Object.entries({action:"query",format:"json",origin:"*",prop:"imageinfo|categories|coordinates",iiprop:"url|extmetadata|mime|size",iiurlwidth:"900",iilimit:"1",cllimit:"30"}))u.searchParams.set(kv[0],kv[1]);const r=await fetch(u.toString(),{credentials:"omit",referrerPolicy:"no-referrer",headers:{Accept:"application/json"}});if(!r.ok)throw new Error("Commons unavailable");return r.json();};
 const geo=await request({generator:"geosearch",ggscoord:lat+"|"+lon,ggsradius:"10000",ggsnamespace:"6",ggslimit:"50"});
 let results=Object.values(geo&&geo.query&&geo.query.pages||{}).map(normPage).filter(Boolean);
 if(!results.length){const query=nameTokens.slice(0,2).join(" ")||p.name;const named=await request({generator:"search",gsrsearch:query,gsrnamespace:"6",gsrlimit:"40"});results=Object.values(named&&named.query&&named.query.pages||{}).map(normPage).filter(Boolean);}
 return results.sort((x,y)=>y.score-x.score)[0]||null;
}
function mountCards(list,container){
 if(!container)return;const places=new Map((list||[]).map(p=>[String(p.id),p])),targets=[...container.querySelectorAll("[data-place-photo-id]")];
 const load=el=>{const id=el.getAttribute("data-place-photo-id"),p=places.get(id);if(!p||!el.isConnected)return;el.dataset.photoState="loading";if(el.classList.contains("nr-wild-photo"))el.innerHTML='<span class="nr-photo-placeholder">Searching for a real place photograph…</span>';
   if(!cardCache.has(id))cardCache.set(id,searchCardPhoto(p).catch(()=>null));
   cardCache.get(id).then(photo=>{
     if(!el.isConnected)return;
     if(!photo){el.dataset.photoState="empty";el.classList.add("photo-not-found");if(el.classList.contains("nr-wild-photo"))el.innerHTML='<span class="nr-photo-placeholder">No verified real photo found</span>';return;}
     el.dataset.photoState="loaded";el.classList.add("has-real-photo");
     const credit='<span class="nr-photo-credit">'+esc(photo.author)+' · '+esc(photo.license)+' · Wikimedia Commons</span>';
     const img='<img src="'+esc(photo.thumb)+'" alt="Landscape at '+esc(p.name)+' · Wikimedia Commons" loading="lazy" referrerpolicy="no-referrer">';
     if(el.classList.contains("nr-wild-photo"))el.innerHTML=img+credit;else{el.insertAdjacentHTML("afterbegin",img);el.insertAdjacentHTML("beforeend",credit);}
   });
 };
 if("IntersectionObserver"in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);load(entry.target);}}),{rootMargin:"450px"});targets.forEach(el=>observer.observe(el));}
 else targets.forEach(load);
}
window.NATURIA_PLACE_PHOTOS={mount,mountCards};
})();