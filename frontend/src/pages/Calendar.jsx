import { useEffect, useState } from "react";
import Header from "../components/Header";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const API = "http://localhost:5000";

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

function Calendar() {
  const token = localStorage.getItem("token");
  const [horses, setHorses] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [current, setCurrent] = useState(null);

  const [type, setType] = useState("palya"); // palya | patkolas | allatorvos | verseny | egyeb
  const [title, setTitle] = useState(""); // teendő leírás
  const [horseId, setHorseId] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  useEffect(() => {
    async function loadHorses() {
      try {
        const res = await fetch(`${API}/api/horses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setHorses(Array.isArray(data) ? data : []);
      } catch {
      }
    }
    if (token) loadHorses();
  }, [token]);

  async function fetchEvents(info, successCallback, failureCallback) {
    try {
      const from = info.startStr.slice(0, 10);
      const to = info.endStr.slice(0, 10);

      const res = await fetch(`${API}/api/calendar?from=${from}&to=${to}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Nem sikerült betölteni a naptárt");
      const data = await res.json();

      const normalized = data.map((ev) => {
        const p = ev.extendedProps || {};
        if (!p.category) {
          if (p.palya_id) p.category = "palya";
          if (p.teendo_id) p.category = "teendo";
        }
        return { ...ev, extendedProps: p };
      });

      successCallback(normalized);
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
    setStartLocal(toLocalInputValue(selectionInfo.start));
    setEndLocal(toLocalInputValue(selectionInfo.end));

    setModalOpen(true);
  }

  function openEditModal(clickInfo) {
    const ev = clickInfo.event;
    const p = ev.extendedProps || {};

    if (p.category !== "palya" && p.category !== "teendo") return;

    setModalMode("edit");
    setCurrent({
      calendarApi: clickInfo.view.calendar,
      category: p.category,
      palya_id: p.palya_id,
      teendo_id: p.teendo_id,
    });

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
      if (!(start < end)) {
        alert("A 'meddig' legyen későbbi, mint a 'mettől'.");
        return;
      }

      // Pálya
      if (type === "palya") {
        const res = await fetch(`${API}/api/calendar/palya-booking`, {
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

      // Teendő (patkolas/allatorvos/verseny/egyeb)
      const t = (title || "").trim();
      if (!t) {
        alert("Adj meg címet (leírás) a teendőnek.");
        return;
      }

      const res = await fetch(`${API}/api/calendar/teendo`, {
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

  //Módosítás mentése
  async function saveEditFromModal() {
    if (!current) return;

    try {
      const start = new Date(startLocal);
      const end = new Date(endLocal);
      if (!(start < end)) {
        alert("A 'meddig' legyen későbbi, mint a 'mettől'.");
        return;
      }

      //Pálya edit
      if (current.category === "palya") {
        const res = await fetch(`${API}/api/calendar/palya-booking/${current.palya_id}`, {
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

      //Teendő edit
      const t = (title || "").trim();
      if (!t) {
        alert("Adj meg címet (leírás) a teendőnek.");
        return;
      }

      const res = await fetch(`${API}/api/calendar/teendo/${current.teendo_id}`, {
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

  //Delete
  async function deleteCurrent() {
    if (!current) return;

    try {
      if (current.category === "palya") {
        const res = await fetch(`${API}/api/calendar/palya-booking/${current.palya_id}`, {
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

      const res = await fetch(`${API}/api/calendar/teendo/${current.teendo_id}`, {
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

  //Drag/Resize update
  async function onEventChange(changeInfo) {
    const ev = changeInfo.event;
    const p = ev.extendedProps || {};

    const start = ev.start;
    const end = ev.end;

    if (!start || !end) {
      changeInfo.revert();
      alert("Hibás időpont (hiányzik start/end).");
      return;
    }

    try {
      if (p.category === "palya") {
        const res = await fetch(`${API}/api/calendar/palya-booking/${p.palya_id}`, {
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
        const cleanLeiras = (p.raw_leiras || title || "").trim() || "Teendő";

        const res = await fetch(`${API}/api/calendar/teendo/${p.teendo_id}`, {
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

  return (
    <div>
      <Header />
      <main style={{ padding: "24px" }}>
        <h1>Naptár</h1>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={fetchEvents}
          nowIndicator
          height="auto"
          selectable
          selectMirror
          select={openCreateModal}
          slotDuration="00:05:00"
          snapDuration="00:05:00"
          slotLabelInterval="01:00"
          editable
          eventResizableFromStart
          eventDrop={onEventChange}
          eventResize={onEventChange}
          eventClick={openEditModal}
        />

        {modalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 9999,
            }}
            onClick={closeModal}
          >
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 16,
                width: "100%",
                maxWidth: 560,
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0 }}>
                {modalMode === "create" ? "Új esemény" : "Esemény szerkesztése"}
              </h3>

              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Típus</span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={modalMode === "edit" && current?.category === "palya"}
                  >
                    <option value="palya">Pályafoglalás</option>
                    <option value="patkolas">Patkolás</option>
                    <option value="allatorvos">Állatorvos</option>
                    <option value="verseny">Verseny</option>
                    <option value="egyeb">Egyéb</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
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

                {type !== "palya" && (
                  <label style={{ display: "grid", gap: 6 }}>
                    <span>Leírás / cím</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Pl. fontos információ…"
                    />
                  </label>
                )}

                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span>Mettől</span>
                    <input
                      type="datetime-local"
                      value={startLocal}
                      onChange={(e) => setStartLocal(e.target.value)}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span>Meddig</span>
                    <input
                      type="datetime-local"
                      value={endLocal}
                      onChange={(e) => setEndLocal(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
                <button onClick={closeModal} style={{ padding: "8px 12px" }}>
                  Mégse
                </button>

                {modalMode === "edit" && (
                  <button onClick={deleteCurrent} style={{ padding: "8px 12px" }}>
                    Igen, törlés
                  </button>
                )}

                <button
                  onClick={modalMode === "create" ? createFromModal : saveEditFromModal}
                  style={{ padding: "8px 12px" }}
                >
                  Mentés
                </button>
              </div>

              <p style={{ marginTop: 10, marginBottom: 0, opacity: 0.7, fontSize: 12 }}>
                Tipp: drag&drop / resize is működik.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Calendar;
