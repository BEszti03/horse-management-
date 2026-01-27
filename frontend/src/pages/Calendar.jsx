import Header from "../components/Header";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

function Calendar() {
  const token = localStorage.getItem("token");

  async function fetchEvents(info, successCallback, failureCallback) {
    try {
      const from = info.startStr.slice(0, 10);
      const to = info.endStr.slice(0, 10);

      const res = await fetch(
        `http://localhost:5000/api/calendar?from=${from}&to=${to}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Nem sikerült betölteni a naptárt");

      const data = await res.json();
      successCallback(data);
    } catch (err) {
      console.error(err);
      failureCallback(err);
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
          eventClick={(info) => {
            const p = info.event.extendedProps;
            if (p?.type === "teendo") {
              alert(`Teendő\nStátusz: ${p.statusz}`);
            }
            if (p?.type === "palya") {
              alert(`Pálya\nFérőhely: ${p.ferohely}`);
            }
          }}
        />
      </main>
    </div>
  );
}

export default Calendar;
