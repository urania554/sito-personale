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

  const dayItems=itinerary.filter(x=>x.activity_date===iso);
  const box=document.querySelector("#todayActivities");

  if(!dayItems.length){
    box.innerHTML='<div class="empty">Nessuna attività inserita per questa giornata.</div>';
  } else {
    box.innerHTML=dayItems.map(renderActivity).join("");
  }

  renderTodayHotel(selectedDate);
  renderNextTransport(selectedDate);
}

function renderActivity(x){
  const time=x.start_time ? x.start_time.slice(0,5) : "—";
  const detail=[x.location,x.description].filter(Boolean).join(" · ");
  return `<article class="activity">
    <div class="activity-time">${time}</div>
    <div>
      <h3>${escapeHtml(x.title)}</h3>
      <p>${escapeHtml(detail || x.category || "")}</p>
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
    <p>${fmtShort.format(new Date(transport.start_datetime))} · ${fmtTime.format(new Date(transport.start_datetime))}</p>
    <p>${escapeHtml(safe(transport.location,""))}</p>`;
}

function renderItinerary(){
  const grouped=new Map();
  itinerary.forEach(x=>{
    if(!grouped.has(x.activity_date)) grouped.set(x.activity_date,[]);
    grouped.get(x.activity_date).push(x);
  });

  const el=document.querySelector("#itineraryList");
  el.innerHTML=[...grouped.entries()].map(([date,items])=>{
    const d=parseDateOnly(date);
    return `<section class="day-group">
      <div class="day-heading">${fmtDate.format(d)}</div>
      <div class="day-activities">${items.map(renderActivity).join("")}</div>
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
    const when=b.start_datetime
      ? `${fmtShort.format(new Date(b.start_datetime))} · ${fmtTime.format(new Date(b.start_datetime))}`
      : "Data/orario non inseriti";

    return `<article class="data-card">
      <span class="type">${bookingIcon(b.booking_type)} ${escapeHtml(b.booking_type)}</span>
      <h3>${escapeHtml(b.title)}</h3>
      <p><strong>${escapeHtml(when)}</strong></p>
      <p>${escapeHtml(safe(b.location,""))}</p>
      ${b.provider ? `<p>${escapeHtml(b.provider)}</p>` : ""}
      ${b.notes ? `<p>${escapeHtml(b.notes)}</p>` : ""}
      ${b.url ? `<a href="${escapeAttr(b.url)}" target="_blank" rel="noopener">Apri prenotazione →</a>` : ""}
    </article>`;
  }).join("");
}

function renderResources(){
  const el=document.querySelector("#resourcesList");
  if(!resources.length){
    el.innerHTML='<div class="empty">Nessuna risorsa inserita.</div>';
    return;
  }

  el.innerHTML=resources.map(r=>`<article class="data-card">
    <span class="type">${escapeHtml(r.category)}</span>
    <h3>${escapeHtml(r.title)}</h3>
    ${r.description ? `<p>${escapeHtml(r.description)}</p>` : ""}
    ${r.url ? `<a href="${escapeAttr(r.url)}" target="_blank" rel="noopener">Apri →</a>` : ""}
  </article>`).join("");
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
