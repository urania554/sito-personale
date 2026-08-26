import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = window.URANIA_CONFIG || {};
const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

const loginView = document.querySelector("#loginView");
const dashboardView = document.querySelector("#dashboardView");
const loginForm = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const loginMessage = document.querySelector("#loginMessage");
const logoutBtn = document.querySelector("#logoutBtn");
const userEmail = document.querySelector("#userEmail");

let trip = null;
let itinerary = [];
let bookings = [];
let resources = [];
let selectedDate = null;


const dayExtras = {
  "2026-09-16":[{start_time:"18:00",title:"Prima sera soft ad Asakusa",location:"Asakusa",description:"Solo se abbiamo energie dopo il viaggio: Sensō-ji illuminato e Sumida. Nessun obbligo.",category:"🌙 SERA · 😴 SACRIFICABILE"}],
  "2026-09-17":[{start_time:"08:50",title:"Incontro con Gioacchino",location:"Asakusabashi Station",description:"Punto fisso. Tour: Meiji Jingu → Takeshita → Palazzo Imperiale → Tokyo Station → Ueno → Kappabashi → Asakusa → Sensō-ji.",category:"⭐ PRIORITARIO"}],
  "2026-09-20":[{start_time:"08:30",title:"Valigie pronte per Kyoto",location:"Ano Hotel Asakusa",description:"Trolley chiusi. Spedizione oggi oppure il 21 mattina se l'hotel gestisce Takkyubin.",category:"⭐ PRIORITARIO"}],
  "2026-09-23":[{start_time:"18:00",title:"Prima sera a Kyoto",location:"Gion / Kamo / Ponto-chō",description:"Passeggiata morbida dopo il trasferimento.",category:"🌙 SERA"}],
  "2026-09-25":[{start_time:"08:00",title:"Due alternative per il bambù",location:"Kyoto Ovest",description:"A: Arashiyama/Sagano. B: Take-no-Michi, meno famosa e meno affollata.",category:"🔀 ALTERNATIVA"}],
  "2026-09-29":[{start_time:"08:30",title:"Nara oppure Osaka",location:"Nara / Osaka",description:"Prima scelta Nara; Osaka resta alternativa se preferiamo una giornata più libera.",category:"🔀 ALTERNATIVA"}]
};

const TOKYO_FOOD_MAP = "https://maps.app.goo.gl/P5XV9x6WBgCZvK5j8";
const KYOTO_FOOD_MAP = "https://maps.app.goo.gl/aBQNmPHSpUSPNZW46";
const OSAKA_FOOD_MAP = "https://maps.app.goo.gl/YGEKmwQPEidLJGMh7";

function mapsDir(origin,destination,waypoints=[],travelmode="transit"){
  const params=new URLSearchParams({origin,destination,travelmode});
  if(waypoints.length) params.set("waypoints",waypoints.join("|"));
  return `https://www.google.com/maps/dir/?api=1&${params.toString()}`;
}

const dayRoutes = {
"2026-09-16":{city:"Tokyo",title:"Arrivo + Asakusa soft",note:"Dopo Narita e check-in: solo una passeggiata facoltativa.",food:TOKYO_FOOD_MAP,legs:[
 {label:"🌙 Passeggiata soft",mode:"walking",stops:["Ano Hotel Asakusa","Sensō-ji Tokyo","Sumida Park Tokyo","Ano Hotel Asakusa"]}]},
"2026-09-17":{city:"Tokyo",title:"Tokyo con Gioacchino",note:"Punto fisso 08:50 ad Asakusabashi; percorso della guida.",food:TOKYO_FOOD_MAP,legs:[
 {label:"🗺️ Mattina",mode:"transit",stops:["Asakusabashi Station Tokyo","Meiji Jingu Tokyo","Takeshita Street Tokyo","Imperial Palace East Gardens Tokyo","Tokyo Station"]},
 {label:"🗺️ Pomeriggio",mode:"transit",stops:["Tokyo Station","Ueno Park Tokyo","Kappabashi Dougu Street Tokyo","Sensō-ji Tokyo"]}]},
"2026-09-18":{city:"Tokyo",title:"Tokyo moderna",note:"Minato → Shibuya → Shinjuku. teamLab resta facoltativo.",food:TOKYO_FOOD_MAP,legs:[
 {label:"🗺️ Minato",mode:"walking",stops:["teamLab Borderless Azabudai Hills","Zōjō-ji Tokyo","Tokyo Tower"]},
 {label:"🌙 Shibuya → Shinjuku",mode:"transit",stops:["Tokyo Tower","Hachikō Memorial Statue","Shibuya Scramble Crossing","Tokyo Metropolitan Government Building","Shinjuku Golden Gai"]}]},
"2026-09-19":{city:"Tokyo",title:"Tokyo centrale",note:"Giardini, mercato e quartieri; nessun negozio è una tappa obbligatoria.",food:TOKYO_FOOD_MAP,legs:[
 {label:"🗺️ Mattina",mode:"transit",stops:["Hamarikyu Gardens Tokyo","Tsukiji Outer Market","Ginza Tokyo"]},
 {label:"🌙 Finale facoltativo",mode:"transit",stops:["Ginza Tokyo","Akihabara Electric Town"]}]},
"2026-09-20":{city:"Tokyo",title:"Tokyo Bay + giornata jolly",note:"Ritmo leggero prima di Kanazawa; priorità alla spedizione valigie.",food:TOKYO_FOOD_MAP,legs:[
 {label:"🗺️ Baia di Tokyo",mode:"transit",stops:["Ano Hotel Asakusa","Toyosu Senkyaku Banrai","Odaiba Marine Park","Rainbow Bridge Tokyo"]}]},
"2026-09-21":{city:"Kanazawa",title:"Tokyo → Kanazawa",note:"Solo zainetti. Hakutaka 559 10:33 → 13:36.",legs:[
 {label:"🚄 Verso lo Shinkansen",mode:"transit",stops:["Ano Hotel Asakusa","Tokyo Station"]},
 {label:"🌙 Primo giro",mode:"transit",stops:["Kanazawa Station","Oyama Shrine Kanazawa","Kanazawa Castle","Higashi Chaya District"]}]},
"2026-09-22":{city:"Kanazawa",title:"Kanazawa storica",note:"Quartieri storici, giardino e castello in un percorso compatto.",legs:[
 {label:"🗺️ Mattina",mode:"walking",stops:["Higashi Chaya District","Kazue-machi Chaya District","Kenroku-en","Kanazawa Castle"]},
 {label:"🗺️ Pomeriggio",mode:"transit",stops:["Kanazawa Castle","Nagamachi Samurai District","Nomura-ke Samurai Residence"]}]},
"2026-09-23":{food:KYOTO_FOOD_MAP,city:"Kyoto",title:"Kanazawa → Kyoto + prima sera",note:"Arrivo 13:35; KIORI e poi Gion con calma.",legs:[
 {label:"🚇 Stazione → hotel",mode:"transit",stops:["Kyoto Station","KIORI Exec Gojo Kyoto"]},
 {label:"🌙 Prima Kyoto",mode:"transit",stops:["KIORI Exec Gojo Kyoto","Yasaka Shrine Kyoto","Gion Kyoto","Pontocho Alley Kyoto"]}]},
"2026-09-24":{food:KYOTO_FOOD_MAP,city:"Kyoto",title:"Fushimi Inari + Higashiyama",note:"Giornata prioritaria. Partenza presto.",legs:[
 {label:"⛩️ Fushimi → Kiyomizu",mode:"transit",stops:["KIORI Exec Gojo Kyoto","Fushimi Inari Taisha","Kiyomizu-dera"]},
 {label:"🚶 Higashiyama",mode:"walking",stops:["Kiyomizu-dera","Sannenzaka Kyoto","Ninenzaka Kyoto","Hōkan-ji Temple Yasaka Pagoda","Yasaka Shrine Kyoto"]}]},
"2026-09-25":{food:KYOTO_FOOD_MAP,city:"Kyoto",title:"Bambù: scegliamo la versione",note:"A: Arashiyama/Sagano. B: Take-no-Michi più tranquilla.",legs:[
 {label:"🎋 A · Arashiyama",mode:"walking",stops:["Otagi Nenbutsuji Temple","Saga Toriimoto Preserved Street","Adashino Nenbutsuji","Arashiyama Bamboo Forest","Tenryū-ji"]},
 {label:"🌿 B · Take-no-Michi",mode:"transit",stops:["KIORI Exec Gojo Kyoto","Take-no-Michi Bamboo Path Muko Kyoto"]}]},
"2026-09-26":{food:KYOTO_FOOD_MAP,city:"Kyoto",title:"Kyoto Nord + extra",note:"Kinkaku-ji e Ryōan-ji; il resto si adatta alle energie.",legs:[
 {label:"🗺️ Kyoto Nord",mode:"transit",stops:["KIORI Exec Gojo Kyoto","Kinkaku-ji","Ryōan-ji","Ninna-ji"]},
 {label:"🟢 Extra facoltativo",mode:"transit",stops:["Ninna-ji","Ginkaku-ji","Philosopher's Path Kyoto"]}]},
"2026-09-27":{food:OSAKA_FOOD_MAP,city:"Osaka",title:"Kyoto → Osaka + Dotonbori",note:"Deposito bagagli e prima sera nel cuore di Osaka.",legs:[
 {label:"🚆 Trasferimento",mode:"transit",stops:["Kyoto Station","Weekly Green In Namba Osaka"]},
 {label:"🌙 Namba by night",mode:"walking",stops:["Weekly Green In Namba Osaka","Hozenji Yokocho","Dotonbori Osaka","Ebisu Bridge Osaka"]}]},
"2026-09-28":{food:OSAKA_FOOD_MAP,city:"Osaka",title:"Osaka completa",note:"Castello, Umeda e finale rétro a Shinsekai.",legs:[
 {label:"🏯 Castello → Umeda",mode:"transit",stops:["Weekly Green In Namba Osaka","Osaka Castle","Nakanoshima Park Osaka","Umeda Sky Building"]},
 {label:"🌙 Shinsekai",mode:"transit",stops:["Umeda Sky Building","Shinsekai Osaka","Tsutenkaku"]}]},
"2026-09-29":{food:OSAKA_FOOD_MAP,foodCity:"Osaka",city:"Nara / Osaka",title:"Nara oppure Osaka",note:"Prima scelta Nara; Osaka resta l'alternativa.",legs:[
 {label:"🦌 A · Nara",mode:"walking",stops:["Kintetsu-Nara Station","Kōfuku-ji","Tōdai-ji","Nigatsu-dō","Kasuga Taisha"]},
 {label:"🏙️ B · Osaka",mode:"transit",stops:["Weekly Green In Namba Osaka","Shitennō-ji","Tennoji Park","Abeno Harukas"]}]},
"2026-09-30":{food:OSAKA_FOOD_MAP,city:"Osaka",title:"Ultima mezza giornata",note:"Check-out entro le 10:00. Partenza per KIX verso le 14:00; EVA Air BR129 da Kansai T1 alle 18:30.",legs:[
 {label:"✈️ Verso l'aeroporto",mode:"transit",stops:["Weekly Green In Namba Osaka","Kansai International Airport"]}]}
};

const CITY_HOTELS = {
  "Tokyo":"Ano Hotel Asakusa",
  "Kanazawa":"Kanazawa Station",
  "Kyoto":"KIORI Exec Gojo Kyoto",
  "Osaka":"Weekly Green In Namba Osaka",
  "Nara / Osaka":"Weekly Green In Namba Osaka"
};

function compactStop(name){
  return name.replace(/ Tokyo| Kyoto| Osaka| Kanazawa/g,"").replace("Weekly Green In Namba","Hotel").replace("KIORI Exec Gojo","Hotel").replace("Ano Hotel Asakusa","Hotel");
}

function routeCardFor(date){
  const route=dayRoutes[date]; if(!route) return "";
  const buttons=route.legs.map(leg=>{
    const s=leg.stops, href=mapsDir(s[0],s[s.length-1],s.slice(1,-1),leg.mode);
    return `<a class="map-route-btn" href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHtml(leg.label)} · Apri in Maps ↗</a>`;
  }).join("");
  const food=route.food ? `<a class="map-route-btn food" href="${escapeAttr(route.food)}" target="_blank" rel="noopener">🍜 Dove mangiare a ${escapeHtml(route.foodCity || route.city)} ↗</a>` : "";
  const hotel=CITY_HOTELS[route.city];
  const hotelBtn=hotel ? `<a class="map-route-btn hotel" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel)}" target="_blank" rel="noopener">🏨 Torna in hotel ↗</a>` : "";
  const routeSummary=route.legs.map(leg=>`<div class="route-summary"><b>${escapeHtml(leg.label)}</b><span>${leg.stops.map(compactStop).map(escapeHtml).join(" → ")}</span></div>`).join("");
  return `<aside class="day-map-card"><div class="day-map-head"><span>📍 ${escapeHtml(route.city)}</span><strong>${escapeHtml(route.title)}</strong></div><p>${escapeHtml(route.note)}</p>${routeSummary}<div class="day-map-actions">${buttons}${food}${hotelBtn}</div></aside>`;
}

function dayItemsFor(iso){
  const db=itinerary.filter(x=>x.activity_date===iso);
  const extra=(dayExtras[iso]||[]).map((x,i)=>({...x,activity_date:iso,sort_order:900+i}));
  const keys=new Set(db.map(x=>(x.title||"").trim().toLowerCase()));
  return [...db,...extra.filter(x=>!keys.has(x.title.trim().toLowerCase()))]
    .sort((a,b)=>(a.start_time||"99:99").localeCompare(b.start_time||"99:99") || (a.sort_order||0)-(b.sort_order||0));
}

const practicalGuides = [
  {
    id:"guide-navetta",
    icon:"🚐",
    title:"Narita T1 → punto di incontro navetta",
    subtitle:"Da aprire appena ritirati i bagagli",
    intro:"Contatta l’autista durante il ritiro bagagli. Poi segui il percorso in base all’ala da cui esci: Ala Nord (Gate N2) oppure Ala Sud (Gate S2). L’autista non può sostare a lungo al punto di prelievo, quindi ricontattalo quando sei arrivata nella zona indicata.",
    sections:[
      {
        title:"Ala Nord · Gate N2",
        text:"Dalla sala arrivi segui le indicazioni verso N2, esci dal terminal e prosegui fino alla zona di carico/scarico mostrata nelle foto.",
        images:[
          ["guides/navetta/page-02.webp","Sala arrivi: segui la direzione indicata"],
          ["guides/navetta/page-03.webp","Raggiungi Gate N2"],
          ["guides/navetta/page-04.webp","All’esterno attraversa e prosegui lungo il marciapiede"],
          ["guides/navetta/page-05.webp","Punto di prelievo Ala Nord"]
        ]
      },
      {
        title:"Ala Sud · Gate S2",
        text:"Dalla sala arrivi segui Bus Tickets / uscita S2, quindi prosegui verso la stessa area di carico/scarico indicata nelle immagini.",
        images:[
          ["guides/navetta/page-06.webp","Sala arrivi Ala Sud: segui Bus Tickets"],
          ["guides/navetta/page-07.webp","Raggiungi l’uscita S2"],
          ["guides/navetta/page-08.webp","All’esterno prosegui lungo il marciapiede"],
          ["guides/navetta/page-09.webp","Punto di prelievo Ala Sud"]
        ]
      }
    ],
    note:"Promemoria: il servizio della prenotazione inizia ad attendere alle 13:55. Tieni a portata di mano la conferma Trip.com e il contatto dell’autista."
  },
  {
    id:"guide-biglietti",
    icon:"🎫",
    title:"Ritiro biglietti Tokyo → Kanazawa",
    subtitle:"JR EAST / Eki-net · meglio ritirarli in anticipo",
    intro:"Il QR di Trip.com non è il biglietto di viaggio: serve a stampare i titoli cartacei. Per ogni passeggero vengono emessi due tagliandi: tariffa base + Limited Express/Shinkansen. Conservali insieme.",
    sections:[
      {
        title:"1 · Trova la macchina giusta",
        text:"Cerca una Reserved Seat Ticket Vending Machine JR EAST compatibile Eki-net. Sullo schermo cerca “Pick up tickets”, “JR-EAST Train Reservation”, “Eki-net” o “Read QR code”.",
        images:[["guides/biglietti/page-2.webp","Macchina JR EAST e pulsanti da cercare"]]
      },
      {
        title:"2 · Scansiona il QR",
        text:"Imposta English → Pick up tickets / JR-EAST Train Reservation / Eki-net → apri il QR Trip.com → scansionalo → controlla data, tratta, treno, carrozza e posti → Confirm.",
        images:[["guides/biglietti/page-3.webp","Procedura alla macchinetta"]]
      },
      {
        title:"3 · Ritira entrambi i biglietti",
        text:"La macchina stampa due tagliandi. Non buttarne uno e non separarli: servono entrambi per il viaggio.",
        images:[["guides/biglietti/page-4.webp","Ritiro dei due titoli di viaggio"]]
      },
      {
        title:"4 · Il 21 settembre ai tornelli",
        text:"Inserisci insieme i due biglietti nel tornello Shinkansen. Il tornello li restituisce dall’altra parte: ricordati di riprenderli entrambi.",
        images:[["guides/biglietti/page-5.webp","Come usare i biglietti al tornello"]]
      }
    ],
    note:"Se la macchina non è chiara, mostra la prenotazione a un addetto JR e dì: “Eki-net ticket pickup, please”."
  }
];

const fmtDate = new Intl.DateTimeFormat("it-IT", {
  weekday:"long", day:"numeric", month:"long", year:"numeric"
});
const fmtShort = new Intl.DateTimeFormat("it-IT", {
  day:"2-digit", month:"2-digit", year:"numeric"
});
const fmtTime = new Intl.DateTimeFormat("it-IT", {
  hour:"2-digit", minute:"2-digit", hour12:false
});

function parseDateOnly(value){
  if(!value) return null;
  const [y,m,d] = value.split("-").map(Number);
  return new Date(y,m-1,d);
}
function toDateOnly(date){
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,"0");
  const d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function safe(value, fallback="—"){
  return value === null || value === undefined || value === "" ? fallback : value;
}
function bookingDateTime(booking){
  if(!booking?.start_datetime) return "Data/orario non inseriti";
  const zone = booking.local_timezone || "Asia/Tokyo";
  const dt = new Date(booking.start_datetime);
  const dateFmt = new Intl.DateTimeFormat("it-IT", {
    day:"2-digit", month:"2-digit", year:"numeric", timeZone:zone
  });
  const timeFmt = new Intl.DateTimeFormat("it-IT", {
    hour:"2-digit", minute:"2-digit", hour12:false, timeZone:zone
  });
  return `${dateFmt.format(dt)} · ${timeFmt.format(dt)}`;
}
function bookingIcon(type){
  return {
    hotel:"🏨", flight:"✈️", train:"🚄", transfer:"🚐", guided_tour:"🧑‍🏫"
  }[type] || "🎫";
}

loginForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email = emailInput.value.trim();
  if(!email) return;

  loginMessage.textContent = "Invio in corso…";
  const redirectTo = `${window.location.origin}${window.location.pathname}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options:{ emailRedirectTo: redirectTo }
  });

  loginMessage.textContent = error
    ? `Errore: ${error.message}`
    : "Controlla la tua e-mail: ti ho inviato il link di accesso.";
});

logoutBtn.addEventListener("click", async ()=>{
  await supabase.auth.signOut();
  showLogin();
});

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    document.querySelector(`#${btn.dataset.tab}`).classList.add("active");
  });
});

document.querySelector("#bookingFilters").addEventListener("click",(e)=>{
  const btn=e.target.closest("[data-filter]");
  if(!btn) return;
  document.querySelectorAll("#bookingFilters .pill").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  renderBookings(btn.dataset.filter);
});

document.addEventListener("click",(e)=>{
  const guideBtn=e.target.closest("[data-open-guide]");
  if(guideBtn){
    openGuide(guideBtn.dataset.openGuide);
    return;
  }
  const zoom=e.target.closest(".guide-image-btn");
  if(zoom){
    openImage(zoom.dataset.src, zoom.dataset.alt || "Immagine guida");
  }
});

document.querySelector("#closeImageViewer").addEventListener("click", closeImage);
document.querySelector("#imageViewer").addEventListener("click",(e)=>{
  if(e.target.id==="imageViewer") closeImage();
});
document.addEventListener("keydown",(e)=>{
  if(e.key==="Escape") closeImage();
});

document.querySelector("#dayPicker").addEventListener("change",(e)=>{
  selectedDate = parseDateOnly(e.target.value);
  renderToday();
});
document.querySelector("#prevDay").addEventListener("click",()=>moveDay(-1));
document.querySelector("#nextDay").addEventListener("click",()=>moveDay(1));

function moveDay(delta){
  if(!selectedDate) return;
  const d=new Date(selectedDate);
  d.setDate(d.getDate()+delta);

  const min=parseDateOnly(trip.start_date);
  const max=parseDateOnly(trip.end_date);
  if(d < min || d > max) return;

  selectedDate=d;
  document.querySelector("#dayPicker").value=toDateOnly(d);
  renderToday();
}

function showLogin(){
  loginView.classList.remove("hidden");
  dashboardView.classList.add("hidden");
}

async function showDashboard(session){
  loginView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  userEmail.textContent = session.user.email || "";
  await loadData();
}

async function loadData(){
  const { data:tripData, error:tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("name", cfg.TRIP_NAME)
    .single();

  if(tripError) return renderFatal(tripError.message);
  trip=tripData;

  const [i,b,r] = await Promise.all([
    supabase.from("itinerary").select("*").eq("trip_id",trip.id)
      .order("activity_date").order("sort_order"),
    supabase.from("bookings").select("*").eq("trip_id",trip.id)
      .order("start_datetime",{ascending:true,nullsFirst:false}),
    supabase.from("travel_resources").select("*").eq("trip_id",trip.id)
      .order("sort_order")
  ]);

  if(i.error) return renderFatal(i.error.message);
  if(b.error) return renderFatal(b.error.message);
  if(r.error) return renderFatal(r.error.message);

  itinerary=i.data || [];
  bookings=b.data || [];
  resources=r.data || [];

  renderTripHeader();
  renderItinerary();
  renderBookings("all");
  renderResources();
  renderGuides();

  const today=new Date();
  const start=parseDateOnly(trip.start_date);
  const end=parseDateOnly(trip.end_date);

  if(today < start) selectedDate=start;
  else if(today > end) selectedDate=end;
  else selectedDate=today;

  document.querySelector("#dayPicker").min=trip.start_date;
  document.querySelector("#dayPicker").max=trip.end_date;
  document.querySelector("#dayPicker").value=toDateOnly(selectedDate);
  renderToday();
}

function renderTripHeader(){
  document.querySelector("#tripTitle").textContent=trip.name;
  document.querySelector("#heroTitle").textContent=trip.name;

  const start=parseDateOnly(trip.start_date);
  const end=parseDateOnly(trip.end_date);
  document.querySelector("#tripDates").textContent =
    `${fmtShort.format(start)} → ${fmtShort.format(end)} · ${safe(trip.destination)}`;

  const today=new Date();
  today.setHours(0,0,0,0);
  const diff=Math.ceil((start-today)/86400000);

  let label;
  if(today < start) label=`${diff} giorni`;
  else if(today > end) label="Concluso";
  else label="In viaggio";

  document.querySelector("#countdown").textContent=label;
  document.querySelector("#tripStatus").textContent =
    trip.status === "completed" ? "VIAGGIO COMPLETATO" :
    trip.status === "active" ? "SIAMO IN VIAGGIO" :
    "VIAGGIO IN PREPARAZIONE";
}

function renderToday(){
  const iso=toDateOnly(selectedDate);
  document.querySelector("#todayDate").textContent=fmtDate.format(selectedDate);

  const dayItems=dayItemsFor(iso);
  const box=document.querySelector("#todayActivities");

  if(!dayItems.length){
    box.innerHTML='<div class="empty">Nessuna attività inserita per questa giornata.</div>' + routeCardFor(iso);
  } else {
    box.innerHTML=dayItems.map(renderActivity).join("") + routeCardFor(iso);
  }

  renderTodayHotel(selectedDate);
  renderNextTransport(selectedDate);
}

function renderActivity(x){
  const time=x.start_time ? x.start_time.slice(0,5) : "—";
  const detail=[x.location,x.description].filter(Boolean).join(" · ");
  const cat=(x.category||"").toLowerCase();
  const statusClass = cat.includes("prior") ? "priority" : cat.includes("sera") ? "evening" : cat.includes("altern") ? "alternative" : cat.includes("facolt") || cat.includes("energie") ? "optional" : cat.includes("sacrific") ? "skippable" : "";
  return `<article class="activity ${statusClass}">
    <div class="activity-time">${time}</div>
    <div>
      ${x.category ? `<span class="activity-status">${escapeHtml(x.category)}</span>` : ""}
      <h3>${escapeHtml(x.title)}</h3>
      <p>${escapeHtml(detail || "")}</p>
    </div>
  </article>`;
}

function renderTodayHotel(date){
  const ts=date.getTime();
  const hotels=bookings.filter(b=>{
    if(b.booking_type!=="hotel" || !b.start_datetime || !b.end_datetime) return false;
    const start=new Date(b.start_datetime); start.setHours(0,0,0,0);
    const end=new Date(b.end_datetime); end.setHours(0,0,0,0);
    return ts>=start.getTime() && ts<end.getTime();
  });

  const el=document.querySelector("#todayHotel");
  if(!hotels.length){
    el.innerHTML='<p>Nessun pernottamento associato.</p>';
    return;
  }
  el.innerHTML=hotels.map(h=>`<div>
    <h3>${escapeHtml(h.title)}</h3>
    <p>${escapeHtml(safe(h.location,""))}</p>
  </div>`).join("");
}

function renderNextTransport(date){
  const endOfDay=new Date(date);
  endOfDay.setHours(23,59,59,999);

  const transport=bookings
    .filter(b=>["flight","train","transfer"].includes(b.booking_type) && b.start_datetime)
    .filter(b=>new Date(b.start_datetime)>=endOfDay)
    .sort((a,b)=>new Date(a.start_datetime)-new Date(b.start_datetime))[0];

  const el=document.querySelector("#nextTransport");
  if(!transport){
    el.innerHTML="<p>Nessun prossimo spostamento registrato.</p>";
    return;
  }

  el.innerHTML=`<h3>${bookingIcon(transport.booking_type)} ${escapeHtml(transport.title)}</h3>
    <p>${escapeHtml(bookingDateTime(transport))}</p>
    <p>${escapeHtml(safe(transport.location,""))}</p>`;
}

function itineraryLegend(){
  return `<div class="trip-legend">
    <strong>Come leggere l’itinerario</strong>
    <span>⭐ Prioritario</span><span>🟢 Consigliato</span><span>⚪ Facoltativo</span><span>🔀 Alternativa</span><span>🌙 Sera</span><span>😴 Sacrificabile</span>
  </div>
  <div class="food-map-strip">
    <strong>🍜 Le nostre mappe cibo</strong>
    <a href="${TOKYO_FOOD_MAP}" target="_blank" rel="noopener">Tokyo ↗</a>
    <a href="${KYOTO_FOOD_MAP}" target="_blank" rel="noopener">Kyoto ↗</a>
    <a href="${OSAKA_FOOD_MAP}" target="_blank" rel="noopener">Osaka ↗</a>
  </div>`;
}

function renderItinerary(){
  const dates=[];
  const start=parseDateOnly(trip.start_date);
  const end=parseDateOnly(trip.end_date);
  for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) dates.push(toDateOnly(d));

  const el=document.querySelector("#itineraryList");
  el.innerHTML=dates.map(date=>{
    const d=parseDateOnly(date);
    const items=dayItemsFor(date);
    return `<section class="day-group">
      <div class="day-heading">${fmtDate.format(d)}</div>
      <div class="day-activities">${items.length ? items.map(renderActivity).join("") : '<div class="empty">Giornata ancora libera: decidiamo sul momento.</div>'}</div>
      ${routeCardFor(date)}
    </section>`;
  }).join("");
}

function renderBookings(filter){
  const rows=filter==="all" ? bookings : bookings.filter(x=>x.booking_type===filter);
  const el=document.querySelector("#bookingsList");

  if(!rows.length){
    el.innerHTML='<div class="empty">Nessuna prenotazione in questa categoria.</div>';
    return;
  }

  el.innerHTML=rows.map(b=>{
    const when=bookingDateTime(b);

    return `<article class="data-card">
      <span class="type">${bookingIcon(b.booking_type)} ${escapeHtml(b.booking_type)}</span>
      <h3>${escapeHtml(b.title)}</h3>
      <p><strong>${escapeHtml(when)}</strong></p>
      <p>${escapeHtml(safe(b.location,""))}</p>
      ${b.provider ? `<p>${escapeHtml(b.provider)}</p>` : ""}
      ${b.notes ? `<p>${escapeHtml(b.notes)}</p>` : ""}
      ${guideButtonForBooking(b)}
      ${b.url ? `<a href="${escapeAttr(b.url)}" target="_blank" rel="noopener">Apri prenotazione →</a>` : ""}
    </article>`;
  }).join("");
}

function renderResources(){
  const el=document.querySelector("#resourcesList");
  const plotline={category:"MAPPA",title:"I nostri posti salvati su Plotline",description:"Posti salvati e idee da recuperare durante il viaggio.",url:"https://getplotline.app/u/urania554"};
  const tokyoFood={category:"CIBO · TOKYO",title:"Dove mangiare a Tokyo",description:"Lista condivisa Google Maps: scegliamo sul momento in base alla zona.",url:TOKYO_FOOD_MAP};
  const kyotoFood={category:"CIBO · KYOTO",title:"Dove mangiare a Kyoto",description:"Lista condivisa Google Maps da popolare con ristoranti, caffè e posti interessanti.",url:KYOTO_FOOD_MAP};
  const osakaFood={category:"CIBO · OSAKA",title:"Dove mangiare a Osaka",description:"Lista condivisa Google Maps da popolare e consultare sul momento.",url:OSAKA_FOOD_MAP};
  const rows=[tokyoFood,kyotoFood,osakaFood,plotline,...resources];

  el.innerHTML=rows.map(r=>`<article class="data-card">
    <span class="type">${escapeHtml(r.category)}</span>
    <h3>${escapeHtml(r.title)}</h3>
    ${r.description ? `<p>${escapeHtml(r.description)}</p>` : ""}
    ${r.url ? `<a href="${escapeAttr(r.url)}" target="_blank" rel="noopener">Apri →</a>` : ""}
  </article>`).join("");
}


function guideButtonForBooking(b){
  const title=(b.title || "").toLowerCase();
  if(title.includes("navetta narita") || (b.booking_type==="transfer" && title.includes("ano hotel"))){
    return `<button class="guide-link-btn" type="button" data-open-guide="guide-navetta">📍 Istruzioni punto di incontro</button>`;
  }
  if(b.booking_type==="train" && title.includes("tokyo") && title.includes("kanazawa")){
    return `<button class="guide-link-btn" type="button" data-open-guide="guide-biglietti">🎫 Come ritirare i biglietti</button>`;
  }
  return "";
}

function renderGuides(){
  const el=document.querySelector("#guidesList");
  el.innerHTML=practicalGuides.map(g=>`<article class="guide-card" id="${g.id}">
    <div class="guide-card-head">
      <div class="guide-icon">${g.icon}</div>
      <div>
        <span class="type">GUIDA PRATICA</span>
        <h3>${escapeHtml(g.title)}</h3>
        <p class="guide-subtitle">${escapeHtml(g.subtitle)}</p>
      </div>
    </div>
    <p class="guide-intro">${escapeHtml(g.intro)}</p>
    <div class="guide-steps">
      ${g.sections.map(s=>`<section class="guide-step">
        <h4>${escapeHtml(s.title)}</h4>
        <p>${escapeHtml(s.text)}</p>
        <div class="guide-gallery">
          ${s.images.map(([src,alt])=>`<button type="button" class="guide-image-btn" data-src="${escapeAttr(src)}" data-alt="${escapeAttr(alt)}">
            <img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy">
            <span>🔎 Tocca per ingrandire</span>
          </button>`).join("")}
        </div>
      </section>`).join("")}
    </div>
    <div class="guide-note">💡 ${escapeHtml(g.note)}</div>
  </article>`).join("");
}

function openGuide(id){
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));
  const tab=document.querySelector('[data-tab="guides"]');
  const panel=document.querySelector("#guides");
  tab?.classList.add("active");
  panel?.classList.add("active");
  requestAnimationFrame(()=>document.querySelector(`#${id}`)?.scrollIntoView({behavior:"smooth",block:"start"}));
}

function openImage(src, alt){
  const viewer=document.querySelector("#imageViewer");
  const img=document.querySelector("#viewerImage");
  img.src=src;
  img.alt=alt;
  viewer.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}
function closeImage(){
  const viewer=document.querySelector("#imageViewer");
  if(!viewer || viewer.classList.contains("hidden")) return;
  viewer.classList.add("hidden");
  document.querySelector("#viewerImage").src="";
  document.body.classList.remove("no-scroll");
}

function renderFatal(message){
  dashboardView.innerHTML=`<div class="empty" style="margin-top:30px">
    <strong>Impossibile caricare Urania Travel Hub.</strong><br>${escapeHtml(message)}
  </div>`;
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
function escapeAttr(value){ return escapeHtml(value); }

const { data:{ session } } = await supabase.auth.getSession();
if(session) await showDashboard(session);
else showLogin();

supabase.auth.onAuthStateChange(async (_event, session)=>{
  if(session) await showDashboard(session);
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./sw.js").catch(error=>{
      console.warn("Service worker non disponibile:",error);
    });
  });
}
