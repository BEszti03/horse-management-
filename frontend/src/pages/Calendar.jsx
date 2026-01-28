import { useState } from "react";
import Header from "../components/Header";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

function Calendar() {
  const token = localStorage.getItem("token");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null); // { palya_id, calendarApi }


  async function fetchEvents(info, successCallback, failureCallback) {
    try {
      const from = info.startStr.slice(0, 10);
      const to = info.endStr.slice(0, 10);

      const res = await fetch(
        `http://localhost:5000/api/calendar?from=${from}&to=${to}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Nem sikerült betölteni a naptárt");
      const data = await res.json();
      successCallback(data);
    } catch (err) {
      console.error(err);
      failureCallback(err);
    }
  }

  //Új foglalás létrehozása (kijelöléssel)
  async function createBooking(selectionInfo) {
    try {
      const start = selectionInfo.startStr;
      const end = selectionInfo.endStr;

      const res = await fetch("http://localhost:5000/api/calendar/palya-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ start, end, ferohely: 1 }),
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

      selectionInfo.view.calendar.unselect();
      selectionInfo.view.calendar.refetchEvents();
    } catch (err) {
      console.error(err);
      alert("Hiba a foglalás mentése közben.");
    }
  }

  //Foglalás módosítása (drag/resize után)
  async function updateBooking(changeInfo) {
    const p = changeInfo.event.extendedProps;
    if (p?.type !== "palya") return;


    const start = changeInfo.event.start;
    const end = changeInfo.event.end;

    if (!start || !end) {
      changeInfo.revert();
      alert("Hibás időpont (hiányzik start/end).");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/calendar/palya-booking/${p.palya_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start: start.toISOString(),
            end: end.toISOString(),
          }),
        }
      );

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
    } catch (err) {
      console.error(err);
      changeInfo.revert();
      alert("Hálózati hiba módosítás közben.");
    }
  }


  function onEventClick(info) {
    const p = info.event.extendedProps;
    if (p?.type !== "palya") return;

    setEventToDelete({ palya_id: p.palya_id, calendarApi: info.view.calendar });
    setDeleteModalOpen(true);
  }

 
  async function confirmDelete() {
    if (!eventToDelete) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/calendar/palya-booking/${eventToDelete.palya_id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 204) {
        eventToDelete.calendarApi.refetchEvents();
        setDeleteModalOpen(false);
        setEventToDelete(null);
        return;
      }

      const data = await res.json().catch(() => ({}));
      alert(data.message || "Nem sikerült törölni a foglalást.");
    } catch (err) {
      console.error(err);
      alert("Hálózati hiba törlés közben.");
    } finally {
      setDeleteModalOpen(false);
      setEventToDelete(null);
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
          select={createBooking}


          slotDuration="00:05:00"
          snapDuration="00:05:00"
          slotLabelInterval="01:00"


          editable
          eventResizableFromStart
          eventDrop={updateBooking}
          eventResize={updateBooking}


          eventClick={onEventClick}
        />


        {deleteModalOpen && (
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
            onClick={() => {
              setDeleteModalOpen(false);
              setEventToDelete(null);
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 16,
                width: "100%",
                maxWidth: 420,
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0 }}>Foglalás törlése</h3>
              <p>Biztosan törlöd ezt az időpontot?</p>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setEventToDelete(null);
                  }}
                  style={{ padding: "8px 12px" }}
                >
                  Mégse
                </button>

                <button
                  onClick={confirmDelete}
                  style={{ padding: "8px 12px" }}
                >
                  Igen
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Calendar;
