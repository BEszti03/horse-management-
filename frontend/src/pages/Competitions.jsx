import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { apiFetch } from "../utils/api";
import "./Competitions.css";

function formatDateHu(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function Competitions() {
  const [competitions, setCompetitions] = useState([]);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const role = user?.szerepkor;
  const userStableId = user?.lovarda_id;

  useEffect(() => {
    async function fetchData() {
      try {
        const [competitionData, entryData] = await Promise.all([
          apiFetch("/api/competitions/managed"),
          apiFetch("/api/competitions/managed/entries"),
        ]);

        setCompetitions(Array.isArray(competitionData) ? competitionData : []);
        setEntries(Array.isArray(entryData) ? entryData : []);
      } catch (err) {
        setError(err?.message || "Nem sikerült betölteni a verseny adatokat.");
        setCompetitions([]);
        setEntries([]);
      }
    }

    fetchData();
  }, []);

  const competitionsWithStats = useMemo(() => {
    const byCompetition = new Map();

    entries.forEach((entry) => {
      const competitionId = entry?.verseny_id;
      if (competitionId == null) return;

      if (!byCompetition.has(competitionId)) {
        byCompetition.set(competitionId, new Map());
      }

      const riders = byCompetition.get(competitionId);
      const riderId = entry?.felhasznalo_id;
      if (riderId == null) return;

      if (!riders.has(riderId)) {
        riders.set(riderId, {
          felhasznalo_id: riderId,
          felhasznalo_nev: entry?.felhasznalo_nev || "Ismeretlen",
          email: entry?.email || "",
          horses: new Set(),
        });
      }

      if (entry?.lo_nev) {
        riders.get(riderId).horses.add(entry.lo_nev);
      }
    });

    return competitions.map((competition) => {
      const ridersMap = byCompetition.get(competition.verseny_id);
      const riders = ridersMap
        ? Array.from(ridersMap.values())
            .map((r) => ({
              ...r,
              horses: Array.from(r.horses),
            }))
            .sort((a, b) => a.felhasznalo_nev.localeCompare(b.felhasznalo_nev, "hu"))
        : [];

      return {
        ...competition,
        riderCount: riders.length,
        riders,
      };
    });
  }, [competitions, entries]);

  function canDeleteCompetition(competition) {
    if (role === "admin") return true;
    if (role === "lovarda_vezeto") {
      return String(competition?.lovarda_id ?? "") === String(userStableId ?? "");
    }
    return false;
  }

  async function handleSuspendCompetition(competition) {
    if (!competition?.verseny_id) return;

    const confirmed = window.confirm(
      `Biztosan felfüggeszted/törlöd ezt a versenyt?\n\n${competition.nev}`
    );

    if (!confirmed) return;

    setDeletingId(competition.verseny_id);
    setError("");

    try {
      await apiFetch(`/api/competitions/${competition.verseny_id}`, {
        method: "DELETE",
      });

      setCompetitions((prev) => prev.filter((c) => c.verseny_id !== competition.verseny_id));
      setEntries((prev) => prev.filter((e) => e.verseny_id !== competition.verseny_id));

      setSelectedCompetition((prev) =>
        prev?.verseny_id === competition.verseny_id ? null : prev
      );
    } catch (err) {
      setError(err?.message || "Nem sikerült felfüggeszteni/törölni a versenyt.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="competitionsPage">
      <Header />
      <main className="competitions-container">
        <section className="competitions-hero">
          <div>
            <p className="competitions-kicker">Rendezői nézet</p>
            <h1>Saját versenyek</h1>
            <p className="competitions-subtitle">
              Csak azokat a versenyeket látod, amelyeket te rendezel.
            </p>
          </div>
        </section>

        {error ? (
          <section className="competitions-empty">
            <h2>Hiba történt</h2>
            <p>{error}</p>
          </section>
        ) : competitionsWithStats.length === 0 ? (
          <section className="competitions-empty">
            <h2>Még nincs saját versenyed.</h2>
            <p>Amint létrehozol egyet, itt fog megjelenni a jelentkezési statisztikával.</p>
          </section>
        ) : (
          <section className="competitions-grid">
            {competitionsWithStats.map((competition) => (
              <article key={competition.verseny_id} className="competition-card">
                <div className="competition-card__top">
                  <div>
                    <p className="competition-card__label">Verseny</p>
                    <h2>{competition.nev}</h2>
                  </div>

                  <div className="competition-card__date">{formatDateHu(competition.datum)}</div>
                </div>

                <div className="competition-card__controls">
                  <div className="competition-card__meta">
                    <span className="competition-chip">{competition.lovarda_nev}</span>
                    <button
                      type="button"
                      className="competition-chip competition-chip--count competition-chip--interactive"
                      onClick={() => setSelectedCompetition(competition)}
                    >
                      {competition.riderCount} lovas
                    </button>
                  </div>

                  {canDeleteCompetition(competition) && (
                    <div className="competition-card__actionsRight">
                      <button
                        type="button"
                        className="competition-actionBtn competition-actionBtn--danger"
                        onClick={() => handleSuspendCompetition(competition)}
                        disabled={deletingId === competition.verseny_id}
                      >
                        {deletingId === competition.verseny_id ? "Felfüggesztés..." : "Verseny felfüggesztése"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        {selectedCompetition && (
          <div className="competitionModalOverlay" onClick={() => setSelectedCompetition(null)}>
            <div className="competitionModal" onClick={(e) => e.stopPropagation()}>
              <div className="competitionModal__head">
                <div>
                  <p className="competitionModal__kicker">Jelentkezők</p>
                  <h2>{selectedCompetition.nev}</h2>
                </div>
                <button
                  type="button"
                  className="competitionModal__close"
                  onClick={() => setSelectedCompetition(null)}
                  aria-label="Bezárás"
                >
                  ×
                </button>
              </div>

              <div className="competitionModal__meta">
                <span className="competition-chip">{selectedCompetition.lovarda_nev}</span>
                <span className="competition-chip competition-chip--count">
                  {selectedCompetition.riderCount} lovas
                </span>
                <span className="competition-chip competition-chip--soft">
                  {formatDateHu(selectedCompetition.datum)}
                </span>
              </div>

              {selectedCompetition.riders.length === 0 ? (
                <p className="competitionModal__empty">Erre a versenyre még nincs jelentkező.</p>
              ) : (
                <ul className="competitionModal__list">
                  {selectedCompetition.riders.map((rider) => (
                    <li className="competitionModal__item" key={rider.felhasznalo_id}>
                      <div className="competitionModal__nameRow">
                        <div className="competitionModal__name">{rider.felhasznalo_nev}</div>
                        <div className="competitionModal__horseInline">
                          {rider.horses.length > 0 ? `Ló: ${rider.horses.join(", ")}` : "Ló: nincs megadva"}
                        </div>
                      </div>
                      <div className="competitionModal__email">{rider.email}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Competitions;