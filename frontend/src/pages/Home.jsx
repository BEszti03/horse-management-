import { useEffect, useState } from "react";
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

function labelTipus(tipus) {
  const x = String(tipus || "egyeb").toLowerCase();
  if (x === "patkolas") return "Patkolás";
  if (x === "allatorvos") return "Állatorvos";
  return "Egyéb";
}

function Home() {
  const [weeklyTodos, setWeeklyTodos] = useState([]);
  const [weeklyCompetitions, setWeeklyCompetitions] = useState([]);

  const token = localStorage.getItem("token");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  const role = user?.szerepkor;
  const myStableId = user?.lovarda_id;

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
          .filter((ev) => ev?.extendedProps?.category === "teendo")
          .filter((ev) => {
            const s = String(ev?.extendedProps?.statusz || "").toLowerCase();
            return !(
              s === "teljesitve" ||
              s === "teljesítve" ||
              s === "kesz" ||
              s === "kész"
            );
          })
          .map((ev) => {
            const p = ev.extendedProps || {};
            const tipus = labelTipus(p.type);
            const horseOrDesc = p.lo_nev || p.raw_leiras || ev.title;
            return {
              id: ev.id,
              label: `${tipus} - ${horseOrDesc}`,
              start: ev.start,
            };
          })
          .sort((a, b) => new Date(a.start) - new Date(b.start));

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
          // csak aktuális hét
          .filter((c) => {
            const t = c.date.getTime();
            return t >= startTs && t < endTs;
          })
          // szerepkör szerinti szűrés
          .filter((c) => {
            if (role === "lovas") {
              return c.jelentkezett;
            }
            if (role === "lovarda_vezeto") {
              return (
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
            label: `Verseny - ${c.name}${
              c.lovardaName ? ` (${c.lovardaName})` : ""
            }`,
          }));

        setWeeklyCompetitions(competitions);
      } catch {
        setWeeklyCompetitions([]);
      }
    }

    loadWeeklyCompetitions();
  }, [token, role, myStableId]);

  const competitionsTitle =
    role === "lovarda_vezeto"
      ? "Saját versenyeid a héten"
      : "Versenyek, amikre jelentkeztél a héten";

  return (
    <div className="homePage">
      <Header />

      <main className="homeMain">
        <div className="homeHeader">
          <h1 className="homeTitle">Hello {user?.nev || "Felhasználó"}!</h1>
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
              <h3 className="homeSectionTitle">Teendők</h3>

              {weeklyTodos.length === 0 ? (
                <p className="homeMuted">Nincs teendőd erre a hétre.</p>
              ) : (
                <ul className="homeList">
                  {weeklyTodos.map((t) => (
                    <li className="homeListItem" key={t.id}>
                      <span className="homeBullet" aria-hidden="true" />
                      <span className="homeItemText">{t.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="homeDivider" />

            <div className="homeSection">
              <h3 className="homeSectionTitle">{competitionsTitle}</h3>

              {weeklyCompetitions.length === 0 ? (
                <p className="homeMuted">
                  {role === "lovarda_vezeto"
                    ? "Nincs saját versenyed ezen a héten."
                    : "Nincs jelentkezett versenyed ezen a héten."}
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
                A részletekhez menj a Naptár / Verseny menüpontra.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default Home;
