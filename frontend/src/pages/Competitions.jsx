import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { apiFetch } from "../utils/api";
import "./Competitions.css";

function formatDateHu(dateString) {
  if (!dateString) return "Nincs megadva";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Nincs megadva";

  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

function groupCompetitionEntries(entries) {
  const byUser = new Map();

  entries.forEach((entry) => {
    const riderId = entry?.felhasznalo_id;
    if (riderId == null) return;

    if (!byUser.has(riderId)) {
      byUser.set(riderId, {
        felhasznalo_id: riderId,
        felhasznalo_nev: entry?.felhasznalo_nev || "Ismeretlen",
        email: entry?.email || "",
        profilkep_url: entry?.profilkep_url || "",
        horses: new Set(),
      });
    }

    if (entry?.lo_nev) {
      byUser.get(riderId).horses.add(entry.lo_nev);
    }
  });

  return Array.from(byUser.values())
    .map((rider) => ({
      ...rider,
      horses: Array.from(rider.horses),
    }))
    .sort((a, b) => a.felhasznalo_nev.localeCompare(b.felhasznalo_nev, "hu"));
}

function getProfileImageUrl(profilePath) {
  if (!profilePath) return "/default-avatar.png";
  return String(profilePath).startsWith("/uploads/")
    ? `http://localhost:5000${profilePath}`
    : String(profilePath);
}

function toDateAtMidnight(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function isFutureOrToday(competition) {
  const date = toDateAtMidnight(competition?.datum);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function getCompetitionYear(competition) {
  const date = new Date(competition?.datum);
  if (Number.isNaN(date.getTime())) return null;
  return date.getFullYear();
}

function Competitions() {
  const [activeSection, setActiveSection] = useState("all");
  const [allCompetitions, setAllCompetitions] = useState([]);
  const [joinedCompetitions, setJoinedCompetitions] = useState([]);
  const [managedCompetitions, setManagedCompetitions] = useState([]);
  const [horses, setHorses] = useState([]);
  const [horseSelectionByCompetition, setHorseSelectionByCompetition] = useState({});
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [allStatusFilter, setAllStatusFilter] = useState("all");
  const [loadingLists, setLoadingLists] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const role = user?.szerepkor;
  const canManageCompetitions = role !== "lovas";
  const yearOptions = useMemo(() => {
    const years = new Set();
    allCompetitions.forEach((competition) => {
      const year = getCompetitionYear(competition);
      if (year) years.add(year);
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [allCompetitions]);

  const filteredAllCompetitions = useMemo(() => {
    return allCompetitions.filter((competition) => {
      const year = getCompetitionYear(competition);
      if (year !== selectedYear) return false;

      if (allStatusFilter === "future") return isFutureOrToday(competition);
      if (allStatusFilter === "past") return !isFutureOrToday(competition);
      return true;
    });
  }, [allCompetitions, selectedYear, allStatusFilter]);

  const activeCompetitions = useMemo(() => {
    if (activeSection === "all") return filteredAllCompetitions;
    if (activeSection === "managed") return managedCompetitions;
    return joinedCompetitions;
  }, [activeSection, filteredAllCompetitions, joinedCompetitions, managedCompetitions]);

  const activeTitle = useMemo(() => {
    if (activeSection === "all") return "Összes verseny";
    if (activeSection === "managed") return "Általad rendezett versenyek";
    return "Versenyek, amire jelentkeztél";
  }, [activeSection]);

  const activeHint = useMemo(() => {
    if (activeSection === "all") {
      return "Az adott év versenyei, ahol szűrhetsz múltbeli és jövőbeli eseményekre.";
    }
    if (activeSection === "managed") {
      return "Itt a saját rendezésű versenyeidet kezeled, és a jelentkezőket is megnézheted.";
    }
    return "Itt azokat a versenyeket látod, amelyekre már jelentkeztél.";
  }, [activeSection]);

  const loadCompetitions = useCallback(async () => {
    try {
      setLoadingLists(true);
      setError("");

      const allData = await apiFetch("/api/competitions");
      const all = Array.isArray(allData) ? allData : [];
      const joined = all.filter((competition) => competition?.jelentkezett);

      setAllCompetitions(all);
      setJoinedCompetitions(joined);

      if (canManageCompetitions) {
        const managedData = await apiFetch("/api/competitions/managed");
        setManagedCompetitions(Array.isArray(managedData) ? managedData : []);
      } else {
        setManagedCompetitions([]);
      }
    } catch (err) {
      setError(err?.message || "Nem sikerült betölteni a versenyeket.");
      setAllCompetitions([]);
      setJoinedCompetitions([]);
      setManagedCompetitions([]);
    } finally {
      setLoadingLists(false);
    }
  }, [canManageCompetitions]);

  useEffect(() => {
    async function loadHorses() {
      try {
        const horseData = await apiFetch("/api/horses");
        setHorses(Array.isArray(horseData) ? horseData : []);
      } catch {
        setHorses([]);
      }
    }

    loadHorses();
  }, []);

  useEffect(() => {
    loadCompetitions();
  }, [loadCompetitions]);

  useEffect(() => {
    if (!yearOptions.includes(selectedYear)) {
      setSelectedYear(yearOptions[0] || new Date().getFullYear());
    }
  }, [yearOptions, selectedYear]);

  useEffect(() => {
    setSelectedCompetitionId(null);
    setSelectedCompetition(null);
    setDetailError("");
  }, [activeSection]);

  function canDeleteCompetition(competition) {
    if (role === "admin") return true;
    if (role === "lovarda_vezeto") {
      return String(competition?.lovarda_id ?? "") === String(user?.lovarda_id ?? "");
    }
    return false;
  }

  async function handleDeleteCompetition(competition) {
    if (!competition?.verseny_id) return;

    const confirmed = window.confirm(`Biztosan törlöd ezt a versenyt?\n\n${competition.nev}`);

    if (!confirmed) return;

    setDeletingId(competition.verseny_id);
    setError("");
    setDetailError("");

    try {
      await apiFetch(`/api/competitions/${competition.verseny_id}`, {
        method: "DELETE",
      });

      setJoinedCompetitions((prev) =>
        prev.filter((item) => item.verseny_id !== competition.verseny_id)
      );
      setManagedCompetitions((prev) =>
        prev.filter((item) => item.verseny_id !== competition.verseny_id)
      );

      if (selectedCompetitionId === competition.verseny_id) {
        setSelectedCompetitionId(null);
        setSelectedCompetition(null);
      }
    } catch (err) {
      setError(err?.message || "Nem sikerült törölni a versenyt.");
    } finally {
      setDeletingId(null);
    }
  }

  async function openCompetitionDetails(competition) {
    if (!competition?.verseny_id) return;

    const competitionId = competition.verseny_id;
    if (selectedCompetitionId === competitionId && selectedCompetition) {
      return;
    }

    setSelectedCompetitionId(competitionId);
    setDetailLoading(true);
    setDetailError("");

    try {
      const data = await apiFetch(`/api/competitions/${competitionId}`);
      setSelectedCompetition({
        competition: data?.competition || null,
        entries: Array.isArray(data?.entries) ? data.entries : [],
      });
    } catch (err) {
      setSelectedCompetition(null);
      setDetailError(err?.message || "Nem sikerült betölteni a verseny részleteit.");
    } finally {
      setDetailLoading(false);
    }
  }

  function getSelectedHorseId(competitionId) {
    const selectedValue = horseSelectionByCompetition[String(competitionId)] || "";
    return selectedValue ? Number(selectedValue) : null;
  }

  function handleHorseSelectionChange(competitionId, value) {
    setHorseSelectionByCompetition((prev) => ({
      ...prev,
      [String(competitionId)]: value,
    }));
  }

  async function signupForCompetition(competition) {
    if (!competition?.verseny_id || !isFutureOrToday(competition)) return;

    setActionLoadingId(competition.verseny_id);
    setError("");

    try {
      const selectedHorseId = getSelectedHorseId(competition.verseny_id);

      await apiFetch(`/api/competitions/${competition.verseny_id}/signup`, {
        method: "POST",
        body: JSON.stringify({ lo_id: selectedHorseId }),
      });

      await loadCompetitions();

      if (selectedCompetitionId === competition.verseny_id) {
        const detailData = await apiFetch(`/api/competitions/${competition.verseny_id}`);
        setSelectedCompetition({
          competition: detailData?.competition || null,
          entries: Array.isArray(detailData?.entries) ? detailData.entries : [],
        });
      }
    } catch (err) {
      setError(err?.message || "Nem sikerült jelentkezni a versenyre.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function withdrawFromCompetition(competition) {
    if (!competition?.verseny_id || !isFutureOrToday(competition)) return;

    const confirmed = window.confirm(`Biztosan lejelentkezel erről a versenyről?\n\n${competition.nev}`);
    if (!confirmed) return;

    setActionLoadingId(competition.verseny_id);
    setError("");

    try {
      await apiFetch(`/api/competitions/${competition.verseny_id}/signup`, {
        method: "DELETE",
      });

      await loadCompetitions();

      if (selectedCompetitionId === competition.verseny_id) {
        const detailData = await apiFetch(`/api/competitions/${competition.verseny_id}`);
        setSelectedCompetition({
          competition: detailData?.competition || null,
          entries: Array.isArray(detailData?.entries) ? detailData.entries : [],
        });
      }
    } catch (err) {
      setError(err?.message || "Nem sikerült lejelentkezni a versenyről.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleCompetitionKeyDown(event, competition) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCompetitionDetails(competition);
    }
  }

  const selectedCompetitionInfo = selectedCompetition?.competition || null;
  const selectedEntries = useMemo(
    () => groupCompetitionEntries(selectedCompetition?.entries || []),
    [selectedCompetition]
  );
  const selectedIsFuture = isFutureOrToday(selectedCompetitionInfo);

  return (
    <div className="competitionsPage">
      <Header />

      <main className="competitionsMain">
        <div className="competitionsHeader">
          <h1 className="competitionsTitle">Versenyek</h1>
          <p className="competitionsSubtitle">
            Nézd át a saját jelentkezéseidet, vagy kezeld a rendezett versenyeidet és a jelentkezőket.
          </p>
        </div>

        {error && <div className="competitionsAlert competitionsAlertError">{error}</div>}

        <div className="competitionsLayout">
          <aside className="competitionsSidebar">
            <h3 className="competitionsSidebarTitle">Nézetek</h3>
            <div className="competitionsSidebarNav">
              <button
                type="button"
                className={`competitionsSidebarItem ${activeSection === "all" ? "is-active" : ""}`}
                onClick={() => setActiveSection("all")}
              >
                Összes verseny
              </button>

              <button
                type="button"
                className={`competitionsSidebarItem ${activeSection === "joined" ? "is-active" : ""}`}
                onClick={() => setActiveSection("joined")}
              >
                Versenyek, amire jelentkeztél
              </button>

              <button
                type="button"
                className={`competitionsSidebarItem ${activeSection === "managed" ? "is-active" : ""} ${
                  !canManageCompetitions ? "is-disabled" : ""
                }`}
                onClick={() => {
                  if (!canManageCompetitions) return;
                  setActiveSection("managed");
                }}
                disabled={!canManageCompetitions}
                title={!canManageCompetitions ? "Ez a nézet lovasok számára nem elérhető." : ""}
              >
                Általad rendezett versenyek
              </button>
            </div>
          </aside>

          <section className="competitionsContent">
            <section className="competitionsListCard">
              <div className="competitionsCardHeader">
                <div>
                  <h2 className="competitionsCardTitle">{activeTitle}</h2>
                  <p className="competitionsCardHint">{activeHint}</p>
                </div>

                <span className="competitionsCountBadge">{activeCompetitions.length} db</span>
              </div>

              {activeSection === "all" && (
                <div className="competitionsFilters">
                  <label className="competitionsFilterField">
                    <span>Év</span>
                    <select
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(Number(event.target.value))}
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="competitionsFilterTabs" role="tablist" aria-label="Verseny szűrés állapot szerint">
                    <button
                      type="button"
                      className={`competitionsFilterTab ${allStatusFilter === "all" ? "is-active" : ""}`}
                      onClick={() => setAllStatusFilter("all")}
                    >
                      Minden
                    </button>
                    <button
                      type="button"
                      className={`competitionsFilterTab ${allStatusFilter === "future" ? "is-active" : ""}`}
                      onClick={() => setAllStatusFilter("future")}
                    >
                      Jövőbeli
                    </button>
                    <button
                      type="button"
                      className={`competitionsFilterTab ${allStatusFilter === "past" ? "is-active" : ""}`}
                      onClick={() => setAllStatusFilter("past")}
                    >
                      Már megrendezett
                    </button>
                  </div>
                </div>
              )}

              {loadingLists ? (
                <p className="competitionsEmpty">Versenyek betöltése...</p>
              ) : activeCompetitions.length === 0 ? (
                <div className="competitionsEmptyBox">
                  <h3>Nincs megjeleníthető verseny.</h3>
                  <p>
                    {activeSection === "all"
                      ? "A kiválasztott szűrőkkel nincs találat."
                      : activeSection === "joined"
                      ? "Ha jelentkezel egy versenyre, itt fog megjelenni."
                      : canManageCompetitions
                        ? "Ha létrehozol versenyt, itt fog megjelenni."
                        : "A rendezői nézet lovasok számára nem elérhető."}
                  </p>
                </div>
              ) : (
                <ul className="competitionsList">
                  {activeCompetitions.map((competition) => {
                    const isSelected = selectedCompetitionId === competition.verseny_id;
                    const competitionIsFuture = isFutureOrToday(competition);

                    return (
                      <li key={competition.verseny_id} className="competitionsListItemWrap">
                        <article
                          className={`competitionListItem ${isSelected ? "is-selected" : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => openCompetitionDetails(competition)}
                          onKeyDown={(event) => handleCompetitionKeyDown(event, competition)}
                        >
                          <div className="competitionListItem__top">
                            <div>
                              <p className="competitionListItem__label">Verseny</p>
                              <h3 className="competitionListItem__title">{competition.nev}</h3>
                            </div>

                            <div className="competitionListItem__date">{formatDateHu(competition.datum)}</div>
                          </div>

                          <div className="competitionListItem__meta">
                            <span className="competitionChip">
                              {competition.lovarda_nev || "Ismeretlen lovarda"}
                            </span>
                            <span
                              className={`competitionChip ${
                                competitionIsFuture ? "competitionChip--future" : "competitionChip--past"
                              }`}
                            >
                              {competitionIsFuture ? "Jövőbeli" : "Már megrendezett"}
                            </span>
                            {activeSection === "joined" ? (
                              <span className="competitionChip competitionChip--accent">Jelentkezve</span>
                            ) : activeSection === "all" && competition?.jelentkezett ? (
                              <span className="competitionChip competitionChip--accent">Már jelentkeztél</span>
                            ) : null}
                          </div>

                          {activeSection === "all" && competitionIsFuture && !competition?.jelentkezett && (
                            <div className="competitionListItem__actions">
                              <label
                                className="competitionInlineField"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <span>Ló (opcionális)</span>
                                <select
                                  value={horseSelectionByCompetition[String(competition.verseny_id)] || ""}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) =>
                                    handleHorseSelectionChange(
                                      competition.verseny_id,
                                      event.target.value
                                    )
                                  }
                                >
                                  <option value="">— nincs kiválasztva —</option>
                                  {horses.map((horse) => (
                                    <option key={horse.lo_id} value={String(horse.lo_id)}>
                                      {horse.nev}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <button
                                type="button"
                                className="competitionPrimaryBtn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  signupForCompetition(competition);
                                }}
                                disabled={actionLoadingId === competition.verseny_id}
                              >
                                {actionLoadingId === competition.verseny_id ? "Jelentkezés..." : "Jelentkezés"}
                              </button>
                            </div>
                          )}

                          {activeSection === "joined" && competitionIsFuture && (
                            <div className="competitionListItem__actions">
                              <button
                                type="button"
                                className="competitionGhostBtn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  withdrawFromCompetition(competition);
                                }}
                                disabled={actionLoadingId === competition.verseny_id}
                              >
                                {actionLoadingId === competition.verseny_id
                                  ? "Lejelentkezés..."
                                  : "Lejelentkezés"}
                              </button>
                            </div>
                          )}

                          {activeSection === "managed" && canDeleteCompetition(competition) && (
                            <div className="competitionListItem__actions">
                              <button
                                type="button"
                                className="competitionDangerBtn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeleteCompetition(competition);
                                }}
                                disabled={deletingId === competition.verseny_id}
                              >
                                {deletingId === competition.verseny_id ? "Törlés..." : "Verseny törlése"}
                              </button>
                            </div>
                          )}
                        </article>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="competitionsDetailCard">
              <div className="competitionsCardHeader">
                <div>
                  <h2 className="competitionsCardTitle">Verseny részletei</h2>
                  <p className="competitionsCardHint">
                    Az információk itt jelennek meg, miután rákattintasz egy versenyre.
                  </p>
                </div>
              </div>

              {detailLoading ? (
                <p className="competitionsEmpty">Részletek betöltése...</p>
              ) : detailError ? (
                <div className="competitionsEmptyBox">
                  <h3>Hiba történt</h3>
                  <p>{detailError}</p>
                </div>
              ) : selectedCompetitionInfo ? (
                <>
                  <div className="competitionDetailHero">
                    <div>
                      <p className="competitionListItem__label">Kiválasztott verseny</p>
                      <h3 className="competitionDetailTitle">{selectedCompetitionInfo.nev}</h3>
                    </div>

                    <span className="competitionCountPill">
                      {groupCompetitionEntries(selectedCompetition?.entries || []).length} jelentkező
                    </span>
                  </div>

                  <div className="competitionDetailMeta">
                    <span className="competitionChip">
                      {selectedCompetitionInfo.lovarda_nev || "Ismeretlen lovarda"}
                    </span>
                    <span className="competitionChip competitionChip--soft">
                      Rendező: {selectedCompetitionInfo.rendezo_nev || "Nincs megadva"}
                    </span>
                    <span className="competitionChip competitionChip--soft">
                      Időpont: {formatDateHu(selectedCompetitionInfo.datum)}
                    </span>
                    <span className="competitionChip competitionChip--soft">
                      Jelentkezők: {selectedCompetitionInfo.jelentkezok_szama ?? selectedEntries.length}
                    </span>
                    <span
                      className={`competitionChip ${
                        selectedIsFuture ? "competitionChip--future" : "competitionChip--past"
                      }`}
                    >
                      {selectedIsFuture ? "Jövőbeli verseny" : "Már megrendezett verseny"}
                    </span>
                    {selectedCompetitionInfo.jelentkezett ? (
                      <span className="competitionChip competitionChip--accent">Te is jelentkeztél</span>
                    ) : null}
                  </div>

                  <div className="competitionDetailSection">
                    <h4>Jelentkezők</h4>

                    {selectedEntries.length === 0 ? (
                      <p className="competitionsEmpty">Erre a versenyre még nincs jelentkező.</p>
                    ) : (
                      <ul className="competitionDetailList">
                        {selectedEntries.map((rider) => (
                          <li key={rider.felhasznalo_id} className="competitionDetailItem">
                            <div className="competitionDetailItem__top">
                              <div className="competitionDetailParticipant">
                                <img
                                  className="competitionDetailAvatar"
                                  src={getProfileImageUrl(rider.profilkep_url)}
                                  alt={rider.felhasznalo_nev}
                                />

                                <div>
                                  <div className="competitionDetailName">{rider.felhasznalo_nev}</div>
                                  <div className="competitionDetailEmail">{rider.email}</div>
                                </div>
                              </div>

                              <div className="competitionDetailHorse">
                                {rider.horses.length > 0
                                  ? `Ló: ${rider.horses.join(", ")}`
                                  : "Ló: nincs megadva"}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="competitionDetailActions">
                    {activeSection === "all" && selectedIsFuture && !selectedCompetitionInfo.jelentkezett && (
                      <>
                        <label className="competitionInlineField">
                          <span>Ló (opcionális)</span>
                          <select
                            value={horseSelectionByCompetition[String(selectedCompetitionInfo.verseny_id)] || ""}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) =>
                              handleHorseSelectionChange(
                                selectedCompetitionInfo.verseny_id,
                                event.target.value
                              )
                            }
                          >
                            <option value="">— nincs kiválasztva —</option>
                            {horses.map((horse) => (
                              <option key={horse.lo_id} value={String(horse.lo_id)}>
                                {horse.nev}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="button"
                          className="competitionPrimaryBtn"
                          onClick={() => signupForCompetition(selectedCompetitionInfo)}
                          disabled={actionLoadingId === selectedCompetitionInfo.verseny_id}
                        >
                          {actionLoadingId === selectedCompetitionInfo.verseny_id
                            ? "Jelentkezés..."
                            : "Jelentkezés erre a versenyre"}
                        </button>
                      </>
                    )}

                    {activeSection === "joined" && selectedIsFuture && selectedCompetitionInfo.jelentkezett && (
                      <button
                        type="button"
                        className="competitionGhostBtn"
                        onClick={() => withdrawFromCompetition(selectedCompetitionInfo)}
                        disabled={actionLoadingId === selectedCompetitionInfo.verseny_id}
                      >
                        {actionLoadingId === selectedCompetitionInfo.verseny_id
                          ? "Lejelentkezés..."
                          : "Lejelentkezés"}
                      </button>
                    )}

                    {activeSection === "managed" && canDeleteCompetition(selectedCompetitionInfo) && (
                      <button
                        type="button"
                        className="competitionDangerBtn"
                        onClick={() => handleDeleteCompetition(selectedCompetitionInfo)}
                        disabled={deletingId === selectedCompetitionInfo.verseny_id}
                      >
                        {deletingId === selectedCompetitionInfo.verseny_id ? "Törlés..." : "Verseny törlése"}
                      </button>
                    )}
                  </div>
                </>
              ) : null}
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Competitions;