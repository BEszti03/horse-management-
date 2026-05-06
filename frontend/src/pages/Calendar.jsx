import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import huLocale from "@fullcalendar/core/locales/hu";

import { apiFetch } from "../utils/api";

import "./Calendar.css";

function pad(n) {
  return String(n).padStart(2, "0");
}

// datetime-local formátum: YYYY-MM-DDTHH:MM
function toLocalInputValue(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isFutureOrToday(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  date.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function toDisplayDateTime(value) {
  if (!value) return "Nincs megadva";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Nincs megadva";
  return d.toLocaleString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDisplayInterval(startValue, endValue) {
  const start = startValue ? new Date(startValue) : null;
  const end = endValue ? new Date(endValue) : null;

  if (!start || Number.isNaN(start.getTime())) return "Nincs megadva";
  if (!end || Number.isNaN(end.getTime())) return `${toDisplayDateTime(start)}`;

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${toDisplayDateTime(start)} - ${end.toLocaleTimeString("hu-HU", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return `${toDisplayDateTime(start)} - ${toDisplayDateTime(end)}`;
}

function getProfileImageUrl(profilePath) {
  if (!profilePath) return "/default-avatar.png";
  return String(profilePath).startsWith("/uploads/")
    ? `http://localhost:5000${profilePath}`
    : String(profilePath);
}

function getOccupancyText(category, props, fallbackTitle) {
  if (category === "palya") {
    return props?.lo_nev ? `Pályafoglalás • Ló: ${props.lo_nev}` : "Pályafoglalás";
  }

  if (category === "teendo") {
    const typeLabelByCode = {
      patkolas: "Patkolás",
      allatorvos: "Állatorvos",
      verseny: "Verseny",
      egyeb: "Egyéb",
    };
    const typeCode = String(props?.type || "egyeb").toLowerCase();
    const typeLabel = typeLabelByCode[typeCode] || "Egyéb";
    const horse = props?.lo_nev ? `Ló: ${props.lo_nev}` : "";
    return [typeLabel, horse].filter(Boolean).join(" • ");
  }

  return fallbackTitle || "Elfoglaltság";
}

function labelTipus(tipus) {
  const x = String(tipus || "egyeb").toLowerCase();
  if (x === "patkolas") return "Patkolás";
  if (x === "allatorvos") return "Állatorvos";
  if (x === "verseny") return "Verseny";
  if (x === "palya") return "Pálya";
  return "Egyéb";
}

function renderEventContent(eventInfo) {
  return (
    <div className="calendarEventContent">
      {eventInfo.timeText && <div className="calendarEventTime">{eventInfo.timeText}</div>}
      <div className="calendarEventTitle">{eventInfo.event.title}</div>
    </div>
  );
}

function getEventClassNames(arg) {
  const props = arg?.event?.extendedProps || {};
  const category = String(props.category || "").toLowerCase();

  if (category === "competition") return ["calendarEventCompetition"];
  if (category === "palya") return ["calendarEventPalya"];

  if (category === "teendo") {
    const todoType = String(props.type || "egyeb").toLowerCase();
    if (todoType === "patkolas") return ["calendarEventTodoPatkolas"];
    if (todoType === "allatorvos") return ["calendarEventTodoAllatorvos"];
    if (todoType === "verseny") return ["calendarEventTodoVerseny"];
    return ["calendarEventTodoEgyeb"];
  }

  return [];
}

function Calendar() {
  const token = localStorage.getItem("token");
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);
  const currentUserId = Number(user?.felhasznalo_id);

  const [horses, setHorses] = useState([]);
  const [stables, setStables] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [current, setCurrent] = useState(null);

  const [type, setType] = useState("palya"); // palya | patkolas | allatorvos | verseny | egyeb
  const [title, setTitle] = useState(""); // teendő leírás / verseny neve
  const [horseId, setHorseId] = useState(""); // pálya/teendőhöz
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  //Verseny jelentkezéshez kiválasztott ló
  const [competitionHorseId, setCompetitionHorseId] = useState("");
  const [competitionStableId, setCompetitionStableId] = useState("");

  // Nézet módja: 'calendar' | 'list'
  const [viewMode, setViewMode] = useState("calendar");
  const [listQHorse, setListQHorse] = useState("");
  const [listQType, setListQType] = useState("");
  const [listQDesc, setListQDesc] = useState("");
  const [listQYear, setListQYear] = useState("");
  const [listQMonth, setListQMonth] = useState("");
  const [listEvents, setListEvents] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [listPage, setListPage] = useState(1);

  useEffect(() => {
    async function loadHorses() {
      try {
        const data = await apiFetch("/api/horses");
        setHorses(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      }
    }
    if (token) loadHorses();
  }, [token]);

  useEffect(() => {
    async function loadStables() {
      if (user?.szerepkor !== "admin") {
        setStables([]);
        return;
      }

      try {
        const data = await apiFetch("/api/stables");
        const items = Array.isArray(data?.stables) ? data.stables : [];
        setStables(items);
      } catch {
        setStables([]);
      }
    }

    if (token) loadStables();
  }, [token, user?.szerepkor]);

  //Naptár események betöltése + versenyek 
  async function fetchEvents(info, successCallback, failureCallback) {
    try {
      const from = info.startStr.slice(0, 10);
      const to = info.endStr.slice(0, 10);

      //Saját naptár események (pálya + teendő)
      const data = await apiFetch(`/api/calendar?from=${from}&to=${to}`);

      const normalized = (Array.isArray(data) ? data : []).map((ev) => {
        const p = ev.extendedProps || {};
        if (!p.category) {
          if (p.palya_id) p.category = "palya";
          if (p.teendo_id) p.category = "teendo";
        }

        const ownerId = Number(p.felhasznalo_id);
        const isOwnedByCurrentUser =
          Number.isFinite(ownerId) && Number.isFinite(currentUserId) && ownerId === currentUserId;
        const isUserEditableCategory = p.category === "palya" || p.category === "teendo";

        return {
          ...ev,
          editable: isUserEditableCategory ? isOwnedByCurrentUser : ev.editable,
          extendedProps: {
            ...p,
            is_own_event: isUserEditableCategory ? isOwnedByCurrentUser : undefined,
          },
        };
      });

      //Versenyek (mindenki látja)
      let competitions = [];
      try {
        const cData = await apiFetch("/api/competitions");
        competitions = (Array.isArray(cData) ? cData : []).map((c) => ({
          id: `verseny-${c.verseny_id}`,
          title: `🏆 ${c.nev} (${c.lovarda_nev})`,
          start: c.datum, // YYYY-MM-DD
          end: addDays(new Date(c.datum), 1).toISOString().slice(0, 10),
          allDay: true,
          editable: false,
          extendedProps: {
            category: "competition",
            verseny_id: c.verseny_id,
            nev: c.nev,
            datum: c.datum,
            jelentkezheto: c.jelentkezheto ?? isFutureOrToday(c.datum),
            lovarda_nev: c.lovarda_nev,
            rendezo_nev: c.rendezo_nev,
            rendezo_profilkep_url: c.rendezo_profilkep_url,
            jelentkezett: !!c.jelentkezett,
          },
        }));
      } catch {
        // hiba figyelmen kívül hagyva
      }

      successCallback([...normalized, ...competitions]);
    } catch (err) {
      console.error(err);
      failureCallback(err);
    }
  }

  function openCreateModal(selectionInfo) {
    setModalMode("create");
    setCurrent({ calendarApi: selectionInfo.view.calendar });

    setType("palya");
    setTitle("");
    setHorseId("");
    setCompetitionHorseId("");
    setCompetitionStableId(user?.szerepkor === "admin" ? String(user?.lovarda_id || "") : "");
    setStartLocal(toLocalInputValue(selectionInfo.start));
    setEndLocal(toLocalInputValue(selectionInfo.end));

    setModalOpen(true);
  }

  function openEditModal(clickInfo) {
    const ev = clickInfo.event;
    const p = ev.extendedProps || {};

    // Verseny kattintás
    if (p.category === "competition") {
      setModalMode("edit");
      setCurrent({
        calendarApi: clickInfo.view.calendar,
        category: "competition",
        verseny_id: p.verseny_id,
        jelentkezett: !!p.jelentkezett,
        jelentkezheto: !!p.jelentkezheto,
        nev: p.nev,
        datum: p.datum,
        lovarda_nev: p.lovarda_nev,
        rendezo_nev: p.rendezo_nev,
        rendezo_profilkep_url: p.rendezo_profilkep_url,
      });

      setType("verseny");
      setTitle(p.nev || "");
      setHorseId("");
      setCompetitionHorseId("");

      const start = ev.start ? new Date(ev.start) : new Date();
      const end = ev.end ? new Date(ev.end) : addDays(start, 1);

      setStartLocal(toLocalInputValue(start));
      setEndLocal(toLocalInputValue(end));

      setModalOpen(true);
      return;
    }

    // Pálya/teendő szerkesztése
    if (p.category !== "palya" && p.category !== "teendo") return;

    const ownerId = Number(p.felhasznalo_id);
    const isOwnEvent =
      Number.isFinite(ownerId) && Number.isFinite(currentUserId) && ownerId === currentUserId;

    if (!isOwnEvent) {
      setModalMode("view");
      setCurrent({
        calendarApi: clickInfo.view.calendar,
        category: p.category,
        isOwnEvent: false,
        felhasznalo_nev: p.felhasznalo_nev,
        profilkep_url: p.profilkep_url,
        foglaltsag: getOccupancyText(p.category, p, ev.title),
        interval_display: toDisplayInterval(ev.start, ev.end),
      });

      setModalOpen(true);
      return;
    }

    setModalMode("edit");
    setCurrent({
      calendarApi: clickInfo.view.calendar,
      isOwnEvent: true,
      category: p.category,
      palya_id: p.palya_id,
      teendo_id: p.teendo_id,
      lo_nev: p.lo_nev,
      felhasznalo_nev: p.felhasznalo_nev,
    });

    setCompetitionHorseId("");

    if (p.category === "palya") {
      setType("palya");
      setTitle("");
      setHorseId(p.lo_id ? String(p.lo_id) : "");
    } else {
      setType(p.type || "egyeb");
      setTitle(p.raw_leiras || "");
      setHorseId(p.lo_id ? String(p.lo_id) : "");
    }

    const start = ev.start ? new Date(ev.start) : new Date();
    const end = ev.end ? new Date(ev.end) : new Date(start.getTime() + 30 * 60000);

    setStartLocal(toLocalInputValue(start));
    setEndLocal(toLocalInputValue(end));

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setCurrent(null);
  }

  async function createFromModal() {
    try {
      const start = new Date(startLocal);
      const end = new Date(endLocal);

      // Verseny létrehozás (lovarda_vezeto vagy admin)
      if (type === "verseny") {
        if (user?.szerepkor !== "lovarda_vezeto" && user?.szerepkor !== "admin") {
          alert("Csak lovarda vezető vagy admin hozhat létre versenyt.");
          return;
        }

        const name = (title || "").trim();
        if (!name) {
          alert("Add meg a verseny nevét.");
          return;
        }

        const datum = startLocal.slice(0, 10); // YYYY-MM-DD

        const selectedStableId = competitionStableId ? Number(competitionStableId) : null;
        if (user?.szerepkor === "admin" && !selectedStableId) {
          alert("Adminként válassz lovardát a versenyhez.");
          return;
        }

        const res = await fetch(`/api/competitions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nev: name,
            datum,
            lovarda_id: user?.szerepkor === "admin" ? selectedStableId : undefined,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data.error || data.message || "Verseny létrehozása sikertelen.");
          return;
        }

        current?.calendarApi?.refetchEvents();
        closeModal();
        return;
      }

      if (!(start < end)) {
        alert("A 'meddig' legyen későbbi, mint a 'mettől'.");
        return;
      }

      // Pálya
      if (type === "palya") {
        const res = await fetch(`/api/calendar/palya-booking`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start: start.toISOString(),
            end: end.toISOString(),
            ferohely: 1,
            lo_id: horseId || null,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 409) {
          alert(data.message || "Ez az idősáv már foglalt.");
          return;
        }
        if (!res.ok) {
          alert(data.message || "Foglalás sikertelen.");
          return;
        }

        current?.calendarApi?.refetchEvents();
        closeModal();
        return;
      }

      // Teendő (patkolas/allatorvos/egyeb)
      const t = (title || "").trim();
      if (!t) {
        alert("Adj meg címet (leírás) a teendőnek.");
        return;
      }

      const res = await fetch(`/api/calendar/teendo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leiras: t,
          tipus: type,
          start: start.toISOString(),
          end: end.toISOString(),
          lo_id: horseId || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Teendő mentése sikertelen.");
        return;
      }

      current?.calendarApi?.refetchEvents();
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Hálózati hiba mentés közben.");
    }
  }

  // Versenyre jelentkezés + ló választás
  async function signupToCompetition() {
    if (!current?.verseny_id) return;

    if (!current?.jelentkezheto) {
      alert("Múltbeli versenyre már nem lehet jelentkezni.");
      return;
    }

    try {
      const res = await fetch(`/api/competitions/${current.verseny_id}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lo_id: competitionHorseId || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || data.message || "Jelentkezés sikertelen.");
        return;
      }

      current?.calendarApi?.refetchEvents();
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Hálózati hiba jelentkezés közben.");
    }
  }

  // Verseny jelentkezés visszavonása
  async function withdrawFromCompetition() {
    if (!current?.verseny_id) return;

    if (!window.confirm("Biztosan visszavonod a jelentkezést?")) return;

    try {
      const res = await fetch(`/api/competitions/${current.verseny_id}/signup`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 204) {
        current?.calendarApi?.refetchEvents();
        closeModal();
        return;
      }

      const data = await res.json().catch(() => ({}));
      alert(data.error || data.message || "Nem sikerült visszavonni a jelentkezést.");
    } catch (err) {
      console.error(err);
      alert("Hálózati hiba visszavonás közben.");
    }
  }

  // Verseny törlés (lovarda_vezeto)
  async function deleteCompetition() {
    if (!current?.verseny_id) return;

    if (user?.szerepkor !== "lovarda_vezeto") {
      alert("Csak lovarda vezető törölhet versenyt.");
      return;
    }

    if (!window.confirm("Biztosan törlöd ezt a versenyt?")) return;

    try {
      const res = await fetch(`/api/competitions/${current.verseny_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 204) {
        current?.calendarApi?.refetchEvents();
        closeModal();
        return;
      }

      const data = await res.json().catch(() => ({}));
      alert(data.error || data.message || "Nem sikerült törölni.");
    } catch (err) {
      console.error(err);
      alert("Hálózati hiba törlés közben.");
    }
  }

  // Módosítás mentése (pálya/teendő)
  async function saveEditFromModal() {
    if (!current) return;

    if (current.isOwnEvent === false) {
      closeModal();
      return;
    }

    // Verseny eseménynél csak jelentkezés/törlés
    if (current.category === "competition") {
      closeModal();
      return;
    }

    try {
      const start = new Date(startLocal);
      const end = new Date(endLocal);
      if (!(start < end)) {
        alert("A 'meddig' legyen későbbi, mint a 'mettől'.");
        return;
      }

      // Pálya szerkesztés
      if (current.category === "palya") {
        const res = await fetch(`/api/calendar/palya-booking/${current.palya_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start: start.toISOString(),
            end: end.toISOString(),
            lo_id: horseId || null,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 409) {
          alert(data.message || "Ütközés: foglalt idősáv.");
          return;
        }
        if (!res.ok) {
          alert(data.message || "Nem sikerült módosítani a foglalást.");
          return;
        }

        current?.calendarApi?.refetchEvents();
        closeModal();
        return;
      }

      // Teendő szerkesztés
      const t = (title || "").trim();
      if (!t) {
        alert("Adj meg címet (leírás) a teendőnek.");
        return;
      }

      const res = await fetch(`/api/calendar/teendo/${current.teendo_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leiras: t,
          tipus: type,
          start: start.toISOString(),
          end: end.toISOString(),
          lo_id: horseId || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Nem sikerült módosítani a teendőt.");
        return;
      }

      current?.calendarApi?.refetchEvents();
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Hálózati hiba módosítás közben.");
    }
  }

  // Törlés (pálya/teendő)
  async function deleteCurrent() {
    if (!current) return;

    if (current.isOwnEvent === false) {
      closeModal();
      return;
    }

    // Verseny törlése gomb
    if (current.category === "competition") {
      closeModal();
      return;
    }

    try {
      if (current.category === "palya") {
        const res = await fetch(`/api/calendar/palya-booking/${current.palya_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 204) {
          current?.calendarApi?.refetchEvents();
          closeModal();
          return;
        }

        const data = await res.json().catch(() => ({}));
        alert(data.message || "Nem sikerült törölni a foglalást.");
        return;
      }

      const res = await fetch(`/api/calendar/teendo/${current.teendo_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 204) {
        current?.calendarApi?.refetchEvents();
        closeModal();
        return;
      }

      const data = await res.json().catch(() => ({}));
      alert(data.message || "Nem sikerült törölni a teendőt.");
    } catch (err) {
      console.error(err);
      alert("Hálózati hiba törlés közben.");
    }
  }

  // Drag/Resize update (pálya/teendő)
  async function onEventChange(changeInfo) {
    const ev = changeInfo.event;
    const p = ev.extendedProps || {};

    const ownerId = Number(p.felhasznalo_id);
    const isOwnEvent =
      Number.isFinite(ownerId) && Number.isFinite(currentUserId) && ownerId === currentUserId;

    // Verseny ne legyen drag/resize, csak napra vehető fel
    if (p.category === "competition") {
      changeInfo.revert();
      return;
    }

    if ((p.category === "palya" || p.category === "teendo") && !isOwnEvent) {
      changeInfo.revert();
      alert("Másik lovardatag eseménye nem szerkeszthető.");
      return;
    }

    const start = ev.start;
    const end = ev.end;

    if (!start || !end) {
      changeInfo.revert();
      alert("Hibás időpont (hiányzik start/end).");
      return;
    }

    try {
      if (p.category === "palya") {
        const res = await fetch(`/api/calendar/palya-booking/${p.palya_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start: start.toISOString(),
            end: end.toISOString(),
            lo_id: p.lo_id || null,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          changeInfo.revert();
          alert(data.message || "Ütközés: foglalt idősáv.");
          return;
        }
        if (!res.ok) {
          changeInfo.revert();
          alert(data.message || "Nem sikerült módosítani.");
          return;
        }

        changeInfo.view.calendar.refetchEvents();
        return;
      }

      if (p.category === "teendo") {
        const cleanLeiras = (p.raw_leiras || "").trim() || "Teendő";

        const res = await fetch(`/api/calendar/teendo/${p.teendo_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            leiras: cleanLeiras,
            tipus: p.type || "egyeb",
            start: start.toISOString(),
            end: end.toISOString(),
            lo_id: p.lo_id || null,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          changeInfo.revert();
          alert(data.message || "Nem sikerült módosítani a teendőt.");
          return;
        }

        changeInfo.view.calendar.refetchEvents();
      }
    } catch (err) {
      console.error(err);
      changeInfo.revert();
      alert("Hálózati hiba módosítás közben.");
    }
  }

  const canCreateCompetition = user?.szerepkor === "lovarda_vezeto" || user?.szerepkor === "admin";
  const canSignupCompetition = !!user;
  const calendarHeight = "calc(100vh - 160px)";
  const calendarButtonText = {
    today: "Ma",
    month: "Hónap",
    week: "Hét",
    day: "Nap",
  };

  // A felhasználó eseményeinek betöltése lista nézethez
  useEffect(() => {
    async function loadList() {
      setListLoading(true);
      setListError(null);
      try {
        const from = new Date();
        from.setFullYear(from.getFullYear() - 1);
        const to = new Date();
        to.setFullYear(to.getFullYear() + 1);

        const data = await apiFetch(
          `/api/calendar?from=${from.toISOString().slice(0, 10)}&to=${to.toISOString().slice(0, 10)}`
        );

        const list = Array.isArray(data) ? data : [];
        const mine = list.filter((ev) => {
          const p = ev.extendedProps || {};
          const ownerId = Number(p.felhasznalo_id);
          return Number.isFinite(ownerId) && ownerId === currentUserId;
        });

        setListEvents(mine);

        // Évek kigyűjtése
        const yearsSet = new Set();
        mine.forEach((ev) => {
          if (ev.start) {
            const year = new Date(ev.start).getFullYear().toString();
            yearsSet.add(year);
          }
        });
        const sortedYears = Array.from(yearsSet).sort();
        setAvailableYears(sortedYears);
      } catch (err) {
        setListError(err.message || String(err));
      } finally {
        setListLoading(false);
      }
    }

    if (viewMode === "list" && currentUserId) loadList();
  }, [viewMode, currentUserId]);

  useEffect(() => {
    setListPage(1);
  }, [listQHorse, listQType, listQYear, listQMonth, listQDesc]);

  const listItemsPerPage = 20;
  const filteredListEvents = listEvents.filter((ev) => {
    const p = ev.extendedProps || {};
    const horse = p.lo_nev || "";
    const type = (p.type || p.tipus || p.category || "").toLowerCase();
    const desc = (p.raw_leiras || "").toLowerCase();
    const eventDateStr = ev.start ? new Date(ev.start).toISOString().slice(0, 10) : "";
    const [eventYear, eventMonthStr] = eventDateStr.split("-");

    const matchHorse = !listQHorse || horse === listQHorse;
    const matchType = !listQType || type === listQType.toLowerCase();
    const matchDesc = !listQDesc || desc.includes(listQDesc.toLowerCase());
    const matchYear = !listQYear || eventYear === listQYear;
    const matchMonth = !listQMonth || eventMonthStr === listQMonth;

    return matchHorse && matchType && matchDesc && matchYear && matchMonth;
  });

  const totalPages = Math.max(1, Math.ceil(filteredListEvents.length / listItemsPerPage));
  const currentPage = Math.min(listPage, totalPages);
  const pageStart = (currentPage - 1) * listItemsPerPage;
  const pagedListEvents = filteredListEvents.slice(pageStart, pageStart + listItemsPerPage);

  function renderListPager(position) {
    if (filteredListEvents.length === 0) return null;

    return (
      <div className={`calPager calPager--${position}`}>
        <button
          type="button"
          className="calPagerBtn"
          onClick={() => setListPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          Előző
        </button>

        <span className="calPagerInfo">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          className="calPagerBtn"
          onClick={() => setListPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
        >
          Következő
        </button>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="calendarPage">
        <h1 className="calendarTitle">Naptár</h1>

        <div className="calViewsPanel">
          <h4 className="calViewsTitle">Nézetek</h4>
          <div className="calViewsButtons">
            <button
              type="button"
              className={"calViewBtn " + (viewMode === "calendar" ? "calViewBtnActive" : "")}
              onClick={() => setViewMode("calendar")}
            >
              Naptár
            </button>

            <button
              type="button"
              className={"calViewBtn " + (viewMode === "list" ? "calViewBtnActive" : "")}
              onClick={() => setViewMode("list")}
            >
              Saját tevékenységek
            </button>
          </div>
        </div>

        {viewMode === "calendar" ? (
          <div className="calendar">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={huLocale}
            buttonText={calendarButtonText}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={fetchEvents}
            nowIndicator
            height={calendarHeight}
            selectable
            selectMirror
            select={openCreateModal}
            slotDuration="01:00:00"
            snapDuration="01:00:00"
            slotLabelInterval="01:00"
            editable
            eventResizableFromStart
            eventDrop={onEventChange}
            eventResize={onEventChange}
            eventClick={openEditModal}
            eventContent={renderEventContent}
            eventClassNames={getEventClassNames}
          />
          </div>
        ) : (
          <div className="calListPage">
            <div className="calListControls">
              <div className="calListSearchGrid">
                <label>
                  <span>Ló</span>
                  <select value={listQHorse} onChange={(e) => setListQHorse(e.target.value)}>
                    <option value="">— összes —</option>
                    {horses.map((h) => (
                      <option key={h.lo_id} value={h.nev}>
                        {h.nev}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Típus</span>
                  <select value={listQType} onChange={(e) => setListQType(e.target.value)}>
                    <option value="">— összes —</option>
                    <option value="palya">Pálya</option>
                    <option value="patkolas">Patkolás</option>
                    <option value="allatorvos">Állatorvos</option>
                    <option value="verseny">Verseny</option>
                    <option value="egyeb">Egyéb</option>
                  </select>
                </label>

                <label>
                  <span>Év</span>
                  <select value={listQYear} onChange={(e) => setListQYear(e.target.value)}>
                    <option value="">— összes —</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Hónap</span>
                  <select value={listQMonth} onChange={(e) => setListQMonth(e.target.value)}>
                    <option value="">— összes —</option>
                    <option value="01">Január</option>
                    <option value="02">Február</option>
                    <option value="03">Március</option>
                    <option value="04">Április</option>
                    <option value="05">Május</option>
                    <option value="06">Június</option>
                    <option value="07">Július</option>
                    <option value="08">Augusztus</option>
                    <option value="09">Szeptember</option>
                    <option value="10">Október</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </label>

                <label>
                  <span>Leírás</span>
                  <input
                    placeholder="pl. fontos"
                    value={listQDesc}
                    onChange={(e) => setListQDesc(e.target.value)}
                  />
                </label>
              </div>
            </div>

            {listLoading && <div className="calListEmpty">Betöltés…</div>}
            {listError && <div className="calListError">Hiba: {listError}</div>}

            {!listLoading && !listError && filteredListEvents.length === 0 && (
              <div className="calListEmpty">Nincsenek események.</div>
            )}

            <ul className="calList">
              {pagedListEvents.map((ev) => {
                  const p = ev.extendedProps || {};
                  const classNames = getEventClassNames({ event: { extendedProps: p } }).join(" ");
                  const horse = p.lo_nev || "—";
                  const typeLabel = labelTipus(p.type || p.tipus || p.category);
                  const description = p.raw_leiras || (p.category === "palya" ? "Pályafoglalás" : "");
                  return (
                    <li key={ev.id} className={`calListItem ${classNames}`}>
                      <div className="calListItemLeft">
                        <div className="calListItemTitle">Ló: {horse}</div>
                        <div className="calListItemMeta">{typeLabel}</div>
                        {description && <div className="calListItemDesc">{description}</div>}
                      </div>
                      <div className="calListItemRight">{toDisplayInterval(ev.start, ev.end)}</div>
                    </li>
                  );
                })}
            </ul>

            {renderListPager("bottom")}
          </div>
        )}

        {modalOpen && (
          <div className="calModalOverlay" onClick={closeModal}>
            <div className="calModal" onClick={(e) => e.stopPropagation()}>
              <h3 className="calModalTitle">
                {current?.category === "competition"
                  ? "Verseny jelentkezés"
                  : modalMode === "view"
                  ? "Lovardatag eseménye"
                  : modalMode === "create"
                  ? "Új esemény"
                  : "Esemény szerkesztése"}
              </h3>

              {/* Verseny kattintás */}
              {current?.category === "competition" ? (
                <div className="calModalGrid">
                  <div className="calMemberSummary">
                    <img
                      className="calMemberAvatar"
                      src={getProfileImageUrl(current.rendezo_profilkep_url)}
                      alt={current.rendezo_nev || "Verseny szervezője"}
                    />

                    <div className="calMemberMeta">
                      <strong>{current.nev}</strong>
                      <div className="calMuted">{current.lovarda_nev}</div>
                      <div className="calMuted">Szervező: {current.rendezo_nev || "Nincs megadva"}</div>
                      <div className="calSpacerTop">Dátum: {current.datum}</div>
                      {!current.jelentkezheto && (
                        <div className="calSpacerTop">Ez a verseny már elmúlt, jelentkezés nem lehetséges.</div>
                      )}
                      {current.jelentkezett && (
                        <div className="calSpacerTop">Már jelentkeztél</div>
                      )}
                    </div>
                  </div>

                  {/* Ló választás csak jelentkezéshez */}
                  {canSignupCompetition && !current.jelentkezett && current.jelentkezheto && (
                    <div className="calField">
                      <span>Ló kiválasztása (opcionális)</span>
                      <select
                        value={competitionHorseId}
                        onChange={(e) => setCompetitionHorseId(e.target.value)}
                      >
                        <option value="">— nincs kiválasztva —</option>
                        {horses.map((h) => (
                          <option key={h.lo_id} value={String(h.lo_id)}>
                            {h.nev}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="calActions">
                    <button className="calBtn calBtnGhost" onClick={closeModal}>
                      Bezárás
                    </button>

                    {user?.szerepkor === "lovarda_vezeto" && (
                      <button className="calBtn calBtnDanger" onClick={deleteCompetition}>
                        Törlés
                      </button>
                    )}

                    {canSignupCompetition && !current.jelentkezett && current.jelentkezheto && (
                      <button className="calBtn calBtnPrimary" onClick={signupToCompetition}>
                        Jelentkezés
                      </button>
                    )}

                    {canSignupCompetition && current.jelentkezett && (
                      <button className="calBtn calBtnPrimary" onClick={withdrawFromCompetition}>
                        Jelentkezés visszavonása
                      </button>
                    )}
                  </div>
                </div>
              ) : modalMode === "view" && current?.isOwnEvent === false ? (
                <>
                  <div className="calMemberSummary">
                    <img
                      className="calMemberAvatar"
                      src={getProfileImageUrl(current.profilkep_url)}
                      alt={current.felhasznalo_nev || "Lovardatag"}
                    />

                    <div className="calMemberMeta">
                      <div className="calMemberName">{current.felhasznalo_nev || "Ismeretlen felhasználó"}</div>
                    </div>
                  </div>

                  <div className="calDetailBox">
                    <div className="calDetailLabel">Elfoglaltság</div>
                    <div className="calDetailValue">{current.foglaltsag || "Nincs megadva"}</div>
                  </div>

                  <div className="calDetailBox">
                    <div className="calDetailLabel">Időpont</div>
                    <div className="calDetailValue">{current.interval_display || "Nincs megadva"}</div>
                  </div>

                  <div className="calActions">
                    <button className="calBtn calBtnGhost" onClick={closeModal}>
                      Bezárás
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="calModalGrid">
                    <label className="calField">
                      <span>Típus</span>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        disabled={modalMode === "edit" && current?.category === "palya"}
                      >
                        <option value="palya">Pályafoglalás</option>
                        <option value="patkolas">Patkolás</option>
                        <option value="allatorvos">Állatorvos</option>
                        {canCreateCompetition && <option value="verseny">Verseny</option>}
                        <option value="egyeb">Egyéb</option>
                      </select>
                    </label>

                    {/* Ló csak pálya/teendőhöz */}
                    {type !== "verseny" && (
                      <label className="calField">
                        <span>Ló (opcionális)</span>
                        <select value={horseId} onChange={(e) => setHorseId(e.target.value)}>
                          <option value="">— nincs kiválasztva —</option>
                          {horses.map((h) => (
                            <option key={h.lo_id} value={String(h.lo_id)}>
                              {h.nev}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {/* Leírás: teendőnél; Versenynél: verseny neve */}
                    {type !== "palya" && (
                      <label className="calField">
                        <span>{type === "verseny" ? "Verseny neve" : "Leírás / cím"}</span>
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={type === "verseny" ? "Pl. Tavaszi kupa" : "Pl. fontos információ…"}
                        />
                      </label>
                    )}

                    {type === "verseny" && user?.szerepkor === "admin" && (
                      <label className="calField">
                        <span>Lovarda</span>
                        <select
                          value={competitionStableId}
                          onChange={(e) => setCompetitionStableId(e.target.value)}
                        >
                          <option value="">— válassz lovardát —</option>
                          {stables.map((stable) => (
                            <option key={stable.stable_id} value={String(stable.stable_id)}>
                              {stable.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <div className="calTwoCols">
                      <label className="calField">
                        <span>Mettől</span>
                        <input
                          type="datetime-local"
                          value={startLocal}
                          onChange={(e) => setStartLocal(e.target.value)}
                        />
                      </label>

                      <label className="calField">
                        <span>Meddig</span>
                        <input
                          type="datetime-local"
                          value={endLocal}
                          onChange={(e) => setEndLocal(e.target.value)}
                          disabled={type === "verseny"}
                        />
                      </label>
                    </div>

                    {type === "verseny" && (
                      <div className="calHint">
                        A verseny a kiválasztott <strong>nap</strong> alapján jön létre (all-day esemény).
                      </div>
                    )}
                  </div>

                  <div className="calActions">
                    <button className="calBtn calBtnGhost" onClick={closeModal}>
                      Mégse
                    </button>

                    {modalMode === "edit" && (
                      <button className="calBtn calBtnDanger" onClick={deleteCurrent}>
                        Igen, törlés
                      </button>
                    )}

                    <button
                      className="calBtn calBtnPrimary"
                      onClick={modalMode === "create" ? createFromModal : saveEditFromModal}
                    >
                      Mentés
                    </button>
                  </div>

                  <p className="calTip">Tipp: áthúzás és méretezés is működik.</p>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Calendar;
