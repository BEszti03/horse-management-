import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Home.css";

function startOfWeekMonday(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function addDays(date, days) {
  const x = new Date(date);
  x.setDate(x.getDate() + days);
  return x;
}

function toYMD(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateHu(date) {
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatTimeHu(date) {
  return new Intl.DateTimeFormat("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function monthLabelHu(date) {
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function startOfMonthGrid(date) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const day = firstOfMonth.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  firstOfMonth.setDate(firstOfMonth.getDate() + diff);
  firstOfMonth.setHours(0, 0, 0, 0);
  return firstOfMonth;
}

function buildMonthGrid(date) {
  const start = startOfMonthGrid(date);
  const cells = [];

  for (let i = 0; i < 42; i += 1) {
    const day = addDays(start, i);
    cells.push({
      date: day,
      ymd: toYMD(day),
      dayNumber: day.getDate(),
      inCurrentMonth: day.getMonth() === date.getMonth(),
    });
  }

  return cells;
}

function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function labelTipus(tipus) {
  const x = String(tipus || "egyeb").toLowerCase();
  if (x === "patkolas") return "Patkolás";
  if (x === "allatorvos") return "Állatorvos";
  return "Egyéb";
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "Jó reggelt";
  } else if (hour >= 12 && hour < 18) {
    return "Jó napot";
  } else if (hour >= 18 && hour < 24) {
    return "Jó estét";
  } else {
    return "Jó éjt";
  }
}

function sortTodosCompletedLast(items) {
  return [...items].sort((a, b) => {
    if (!!a.completed !== !!b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(a.start) - new Date(b.start);
  });
}

function Home() {
  const [weeklyTodos, setWeeklyTodos] = useState([]);
  const [weeklyCompetitions, setWeeklyCompetitions] = useState([]);
  const [miniCalendarEventDays, setMiniCalendarEventDays] = useState({});
  const [previewMonth, setPreviewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  const role = user?.szerepkor;
  const myStableId = user?.lovarda_id;
  const ridingTasks = useMemo(
    () => sortTodosCompletedLast(weeklyTodos.filter((item) => item.taskCategory === "palya")),
    [weeklyTodos]
  );
  const otherTodoTasks = useMemo(
    () => sortTodosCompletedLast(weeklyTodos.filter((item) => item.taskCategory === "teendo")),
    [weeklyTodos]
  );

  /* =========================
     TEENDŐK – CALENDAR
  ========================= */
  useEffect(() => {
    async function loadWeeklyTodos() {
      try {
        if (!token) return;

        const start = startOfWeekMonday(new Date());
        const end = addDays(start, 7);

        const from = toYMD(start);
        const to = toYMD(end);

        const res = await fetch(`/api/calendar?from=${from}&to=${to}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) {
          setWeeklyTodos([]);
          return;
        }

        const todos = (Array.isArray(data) ? data : [])
          .filter((ev) => {
            const category = ev?.extendedProps?.category;
            return category === "teendo" || category === "palya";
          })
          .map((ev) => {
            const p = ev.extendedProps || {};
            const isPalya = p.category === "palya";
            const tipus = isPalya ? "Pályán lovaglás" : labelTipus(p.type);
            const horseOrDesc = p.lo_nev || p.raw_leiras || ev.title;
            const startDate = ev.start ? new Date(ev.start) : null;
            const hasValidStart = startDate && !Number.isNaN(startDate.getTime());
            const hasSpecificTime = hasValidStart && !(startDate.getHours() === 0 && startDate.getMinutes() === 0);
            return {
              id: ev.id,
              teendoId: p.category === "teendo" ? Number(p.teendo_id) : null,
              palyaId: isPalya ? Number(p.palya_id) : null,
              taskCategory: p.category,
              label: `${tipus} - ${horseOrDesc}`,
              start: ev.start,
              completed: !!p.elvegzett,
              dateLabel: hasValidStart
                ? `${formatDateHu(startDate)}${hasSpecificTime ? ` ${formatTimeHu(startDate)}` : ""}`
                : "",
            };
          });

        setWeeklyTodos(todos);
      } catch {
        setWeeklyTodos([]);
      }
    }

    loadWeeklyTodos();
  }, [token]);

  /* =========================
     VERSENYEK – COMPETITIONS
  ========================= */
  useEffect(() => {
    async function loadWeeklyCompetitions() {
      try {
        if (!token) return;

        const start = startOfWeekMonday(new Date());
        const end = addDays(start, 7);

        const startTs = start.getTime();
        const endTs = end.getTime();

        const res = await fetch(`/api/competitions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) {
          setWeeklyCompetitions([]);
          return;
        }

        const competitions = (Array.isArray(data) ? data : [])
          .map((c) => {
            const dt = new Date(`${c.datum}T00:00:00`);
            return {
              id: c.verseny_id,
              name: c.nev,
              lovardaName: c.lovarda_nev,
              lovardaId: c.lovarda_id,
              date: dt,
              jelentkezett: !!c.jelentkezett,
            };
          })
          // szerepkör szerinti szűrés
          .filter((c) => {
            if (role === "lovas") {
              return c.jelentkezett;
            }
            if (role === "lovarda_vezeto") {
              const t = c.date.getTime();
              const isThisWeek = t >= startTs && t < endTs;
              return (
                isThisWeek &&
                myStableId != null &&
                c.lovardaId != null &&
                String(c.lovardaId) === String(myStableId)
              );
            }
            return false;
          })
          .sort((a, b) => a.date - b.date)
          .map((c) => ({
            id: c.id,
            dateYmd: toYMD(c.date),
            label: `Verseny - ${c.name}${
              c.lovardaName ? ` (${c.lovardaName})` : ""
            } (${formatDateHu(c.date)})`,
          }));

        setWeeklyCompetitions(competitions);
      } catch {
        setWeeklyCompetitions([]);
      }
    }

    loadWeeklyCompetitions();
  }, [token, role, myStableId]);

  /* =========================
     MINI NAPTÁR – Havi jelölők
  ========================= */
  useEffect(() => {
    async function loadMiniCalendarEventDays() {
      try {
        if (!token) {
          setMiniCalendarEventDays({});
          return;
        }

        const monthStart = startOfMonth(previewMonth);
        const monthEnd = endOfMonth(previewMonth);
        const from = toYMD(monthStart);
        const to = toYMD(addDays(monthEnd, 1));

        const [calendarRes, competitionsRes] = await Promise.all([
          fetch(`/api/calendar?from=${from}&to=${to}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/competitions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const calendarData = await calendarRes.json().catch(() => []);
        const competitionsData = await competitionsRes.json().catch(() => []);

        // Object: ymd -> { competitions: count, todos: count }
        const days = {};

        if (calendarRes.ok) {
          (Array.isArray(calendarData) ? calendarData : []).forEach((ev) => {
            const startValue = ev?.start;
            if (!startValue) return;

            const startDate = new Date(startValue);
            if (Number.isNaN(startDate.getTime())) return;

            if (startDate >= monthStart && startDate <= monthEnd) {
              const ymd = toYMD(startDate);
              if (!days[ymd]) days[ymd] = { competitions: 0, todos: 0 };
              days[ymd].todos += 1;
            }
          });
        }

        if (competitionsRes.ok) {
          (Array.isArray(competitionsData) ? competitionsData : [])
            .map((c) => {
              const dt = new Date(`${c.datum}T00:00:00`);
              return {
                date: dt,
                lovardaId: c.lovarda_id,
                jelentkezett: !!c.jelentkezett,
              };
            })
            .filter((c) => {
              if (Number.isNaN(c.date.getTime())) return false;
              if (c.date < monthStart || c.date > monthEnd) return false;

              // Csak a jelentkezett versenyeket jelöljük
              return c.jelentkezett;
            })
            .forEach((c) => {
              const ymd = toYMD(c.date);
              if (!days[ymd]) days[ymd] = { competitions: 0, todos: 0 };
              days[ymd].competitions += 1;
            });
        }

        setMiniCalendarEventDays(days);
      } catch {
        setMiniCalendarEventDays({});
      }
    }

    loadMiniCalendarEventDays();
  }, [token, role, myStableId, previewMonth]);

  const competitionsTitle =
    role === "lovarda_vezeto"
      ? "Saját versenyeid a héten"
      : "Versenyek, amikre jelentkeztél";

  const monthCells = useMemo(() => buildMonthGrid(previewMonth), [previewMonth]);
  const todayYmd = toYMD(new Date());

  function goPrevMonth() {
    setPreviewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setPreviewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  async function toggleTodoComplete(todo) {
    const isPalya = todo?.taskCategory === "palya";
    const entityId = isPalya ? Number(todo?.palyaId) : Number(todo?.teendoId);
    if (!Number.isFinite(entityId)) return;

    const nextCompleted = !todo.completed;

    setWeeklyTodos((prev) =>
      prev.map((item) => {
        const itemId = isPalya ? Number(item.palyaId) : Number(item.teendoId);
        return item.taskCategory === todo.taskCategory && itemId === entityId
          ? { ...item, completed: nextCompleted }
          : item;
      })
    );

    try {
      const endpoint = isPalya
        ? `/api/calendar/palya-booking/${entityId}/elvegzett`
        : `/api/calendar/teendo/${entityId}/elvegzett`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ elvegzett: nextCompleted }),
      });

      if (!res.ok) {
        throw new Error("Nem sikerült menteni az elvégzett állapotot.");
      }
    } catch {
      // Sikertelen mentésnél visszaállítjuk az előző állapotot.
      setWeeklyTodos((prev) =>
        prev.map((item) => {
          const itemId = isPalya ? Number(item.palyaId) : Number(item.teendoId);
          return item.taskCategory === todo.taskCategory && itemId === entityId
            ? { ...item, completed: todo.completed }
            : item;
        })
      );
      alert("Nem sikerült menteni a teendő állapotát.");
    }
  }

  return (
    <div className="homePage">
      <Header />

      <main className="homeMain">
        <div className="homeHeader">
          <h1 className="homeTitle">{getGreeting()} {user?.nev || "Felhasználó"}!</h1>
          <p className="homeSubtitle">Nézd át a heti teendőket és versenyeket egy helyen.</p>
        </div>

        <section className="homeGrid">
          <div className="homeCard">
            <div className="homeCardHeader">
              <h2 className="homeCardTitle">Közelgő események a héten</h2>
              <p className="homeCardHint">
                Csak az aktuális hét (hétfő–vasárnap) eseményei.
              </p>
            </div>

            <div className="homeSection">
              <h3 className="homeSectionTitle">
                <img src="/to-do.png" alt="Teendők" className="homeSectionIcon" />
                Teendők
              </h3>

              {weeklyTodos.length === 0 ? (
                <p className="homeMuted">Nincs teendőd erre a hétre.</p>
              ) : (
                <>
                  <div className="homeSubSection">
                    <h4 className="homeSubSectionTitle">Lovaglás</h4>
                    {ridingTasks.length === 0 ? (
                      <p className="homeMuted">Ezen a héten nincs pályahasználati feladat.</p>
                    ) : (
                      <ul className="homeList">
                        {ridingTasks.map((t) => (
                          <li className={`homeListItem ${t.completed ? "is-completed" : ""}`} key={t.id}>
                            <input
                              type="checkbox"
                              className="homeCheckbox"
                              id={`task-${t.id}`}
                              checked={!!t.completed}
                              onChange={() => toggleTodoComplete(t)}
                            />
                            <label htmlFor={`task-${t.id}`} className="homeCheckboxLabel">
                              <div>
                                <span className="homeItemText">{t.label}</span>
                                {t.dateLabel && <span className="homeItemMeta">{t.dateLabel}</span>}
                              </div>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="homeSubSection">
                    <h4 className="homeSubSectionTitle">Egyéb teendők</h4>
                    {otherTodoTasks.length === 0 ? (
                      <p className="homeMuted">Ezen a héten nincs egyéb teendő.</p>
                    ) : (
                      <ul className="homeList">
                        {otherTodoTasks.map((t) => (
                          <li className={`homeListItem ${t.completed ? "is-completed" : ""}`} key={t.id}>
                            <input
                              type="checkbox"
                              className="homeCheckbox"
                              id={`task-${t.id}`}
                              checked={!!t.completed}
                              onChange={() => toggleTodoComplete(t)}
                            />
                            <label htmlFor={`task-${t.id}`} className="homeCheckboxLabel">
                              <div>
                                <span className="homeItemText">{t.label}</span>
                                {t.dateLabel && <span className="homeItemMeta">{t.dateLabel}</span>}
                              </div>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="homeDivider" />

            <div className="homeSection">
              <h3 className="homeSectionTitle">
                <img src="/competitions.png" alt="Versenyek" className="homeSectionIcon" />
                {competitionsTitle}
              </h3>

              {weeklyCompetitions.length === 0 ? (
                <p className="homeMuted">
                  {role === "lovarda_vezeto"
                    ? "Nincs saját versenyd ezen a héten."
                    : "Nem jelentkeztél eheti versenyre."}
                </p>
              ) : (
                <ul className="homeList">
                  {weeklyCompetitions.map((c) => (
                    <li className="homeListItem" key={c.id}>
                      <span className="homeBullet" aria-hidden="true" />
                      <span className="homeItemText">{c.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="homeSide">
            <div className="homeMiniCard">
              <h3 className="homeMiniTitle">Gyors összegzés</h3>
              <div className="homeStats">
                <div className="homeStat">
                  <div className="homeStatNumber">{weeklyTodos.length}</div>
                  <div className="homeStatLabel">eheti teendők</div>
                </div>
                <div className="homeStat">
                  <div className="homeStatNumber">{weeklyCompetitions.length}</div>
                  <div className="homeStatLabel">verseny</div>
                </div>
              </div>
              <p className="homeMiniHint">
                A részletekhez menj a Naptár menüpontra.
              </p>
            </div>

            <div className="homeMiniCard homeMiniCalendar">
              <div className="homeMiniCalendarHead">
                <p className="homeMiniMonthLabel homeMiniMonthLabelInHead">{monthLabelHu(previewMonth)}</p>
                <div className="homeMiniCalendarNav">
                  <button type="button" className="homeMiniNavBtn" onClick={goPrevMonth} aria-label="Előző hónap">
                    ◀
                  </button>
                  <button type="button" className="homeMiniNavBtn" onClick={goNextMonth} aria-label="Következő hónap">
                    ▶
                  </button>
                </div>
              </div>

              <div className="homeMiniWeekdays" aria-hidden="true">
                {['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="homeMiniDaysGrid">
                {monthCells.map((cell) => {
                  const isToday = cell.ymd === todayYmd;
                  const dayEvents = miniCalendarEventDays[cell.ymd];
                  const eventCount = (dayEvents?.competitions || 0) + (dayEvents?.todos || 0);
                  const hasCompetition = dayEvents && dayEvents.competitions > 0;
                  const hasTodo = dayEvents && dayEvents.todos > 0;

                  let tooltipText = "Nincs jelölt esemény";
                  if (eventCount > 0) {
                    const parts = [];
                    if (hasCompetition) parts.push(`${dayEvents.competitions} verseny`);
                    if (hasTodo) parts.push(`${dayEvents.todos} teendő`);
                    tooltipText = parts.join(", ");
                  }

                  const eventClasses = [
                    cell.inCurrentMonth ? "" : "is-outside",
                    isToday ? "is-today" : "",
                    hasCompetition ? "has-competition" : "",
                    hasTodo ? "has-todo" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div
                      key={cell.ymd}
                      className={`homeMiniDay ${eventClasses}`}
                      title={tooltipText}
                    >
                      {cell.dayNumber}
                    </div>
                  );
                })}
              </div>

              <p className="homeMiniHint">
                Jelölve: napok, amelyeken ebben a hónapban van eseményed.
              </p>

              <button
                type="button"
                className="homeMiniCalendarCta"
                onClick={() => navigate("/calendar")}
              >
                <span>Ugrás a naptárra</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default Home;
