import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { apiFetch } from "../utils/api";

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

function Calendar() {
  const token = localStorage.getItem("token");
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const [horses, setHorses] = useState([]);

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

  //Naptár események betöltése + versenyek beolvasztása
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
        return { ...ev, extendedProps: p };
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
              lovarda_nev: c.lovarda_nev,
              jelentkezett: !!c.jelentkezett,
            },
          }));
      } catch {
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
        nev: p.nev,
        datum: p.datum,
        lovarda_nev: p.lovarda_nev,
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

    // Pálya/teendő edit
    if (p.category !== "palya" && p.category !== "teendo") return;

    setModalMode("edit");
    setCurrent({
      calendarApi: clickInfo.view.calendar,
      category: p.category,
      palya_id: p.palya_id,
      teendo_id: p.teendo_id,
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

      // Verseny létrehozás (csak lovarda_vezeto)
      if (type === "verseny") {
        if (user?.szerepkor !== "lovarda_vezeto") {
          alert("Csak lovarda vezető hozhat létre versenyt.");
          return;
        }

        const name = (title || "").trim();
        if (!name) {
          alert("Add meg a verseny nevét.");
          return;
        }

        const datum = startLocal.slice(0, 10); // YYYY-MM-DD

        const res = await fetch(`/api/competitions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nev: name, datum }),
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

  // Versenyre jelentkezés (lovas) + ló választás
  async function signupToCompetition() {
    if (!current?.verseny_id) return;

    if (user?.szerepkor !== "lovas") {
      alert("Csak lovas jelentkezhet versenyre.");
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

  // Verseny jelentkezés visszavonása (lovas)
  async function withdrawFromCompetition() {
    if (!current?.verseny_id) return;

    if (user?.szerepkor !== "lovas") {
      alert("Csak lovas vonhatja vissza a jelentkezést.");
      return;
    }

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

      // Pálya edit
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

      // Teendő edit
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

  // Delete (pálya/teendő)
  async function deleteCurrent() {
    if (!current) return;

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

    // Verseny ne legyen drag/resize, csak napra vehető fel
    if (p.category === "competition") {
      changeInfo.revert();
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

  const canCreateCompetition = user?.szerepkor === "lovarda_vezeto";
  const canSignupCompetition = user?.szerepkor === "lovas";

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
                {current?.category === "competition"
                  ? "Verseny"
                  : modalMode === "create"
                  ? "Új esemény"
                  : "Esemény szerkesztése"}
              </h3>

              {/* Verseny kattintás */}
              {current?.category === "competition" ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <strong>{current.nev}</strong>
                    <div style={{ opacity: 0.8 }}>{current.lovarda_nev}</div>
                    <div style={{ marginTop: 6 }}>Dátum: {current.datum}</div>
                    {current.jelentkezett && (
                      <div style={{ marginTop: 8 }}>✔ Már jelentkeztél</div>
                    )}
                  </div>

                  {/* Ló választás csak jelentkezéshez */}
                  {canSignupCompetition && !current.jelentkezett && (
                    <div style={{ display: "grid", gap: 6 }}>
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

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                    <button onClick={closeModal} style={{ padding: "8px 12px" }}>
                      Bezárás
                    </button>

                    {user?.szerepkor === "lovarda_vezeto" && (
                      <button onClick={deleteCompetition} style={{ padding: "8px 12px" }}>
                        Törlés
                      </button>
                    )}

                    {canSignupCompetition && !current.jelentkezett && (
                      <button onClick={signupToCompetition} style={{ padding: "8px 12px" }}>
                        Jelentkezés
                      </button>
                    )}

                    {canSignupCompetition && current.jelentkezett && (
                      <button onClick={withdrawFromCompetition} style={{ padding: "8px 12px" }}>
                        Jelentkezés visszavonása
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
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
                        {canCreateCompetition && <option value="verseny">Verseny</option>}
                        <option value="egyeb">Egyéb</option>
                      </select>
                    </label>

                    {/* Ló csak pálya/teendőhöz */}
                    {type !== "verseny" && (
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
                    )}

                    {/* Leírás: teendőnél; Versenynél: verseny neve */}
                    {type !== "palya" && (
                      <label style={{ display: "grid", gap: 6 }}>
                        <span>{type === "verseny" ? "Verseny neve" : "Leírás / cím"}</span>
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={type === "verseny" ? "Pl. Tavaszi kupa" : "Pl. fontos információ…"}
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
                          disabled={type === "verseny"}
                        />
                      </label>
                    </div>

                    {type === "verseny" && (
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        A verseny a kiválasztott <strong>nap</strong> alapján jön létre (all-day esemény).
                      </div>
                    )}
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
                    Tipp: drag&drop / resize működik.
                  </p>
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
