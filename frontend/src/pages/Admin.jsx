import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { apiFetch } from "../utils/api";
import "./Admin.css";

const ITEMS_PER_PAGE = 20;

function getRoleLabel(role) {
  const labels = {
    admin: "Admin",
    lovas: "Lovas",
    lovarda_vezeto: "Lovarda vezető",
    user: "Felhasználó",
  };

  return labels[role] || role;
}

function Admin() {
  const [users, setUsers] = useState([]);
  const [stables, setStables] = useState([]);
  const [horses, setHorses] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [activeSection, setActiveSection] = useState("users");
  const [userSearch, setUserSearch] = useState("");
  const [stableSearch, setStableSearch] = useState("");
  const [horseSearch, setHorseSearch] = useState("");
  const [competitionSearch, setCompetitionSearch] = useState("");
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [currentStablePage, setCurrentStablePage] = useState(1);
  const [currentHorsePage, setCurrentHorsePage] = useState(1);
  const [currentCompetitionPage, setCurrentCompetitionPage] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Szerkesztő  állapotok
  const [editingUser, setEditingUser] = useState(null);
  const [editingStable, setEditingStable] = useState(null);
  const [editingHorse, setEditingHorse] = useState(null);
  const [editingCompetition, setEditingCompetition] = useState(null);

  const [editForm, setEditForm] = useState({});
  const [usersList, setUsersList] = useState([]);

  const stableLeaderCandidates = useMemo(
    () => usersList.filter((u) => ["lovas", "lovarda_vezeto"].includes(u.szerepkor)),
    [usersList]
  );

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return users;

    return users.filter((u) => {
      const name = String(u.nev || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [users, userSearch]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const visibleUsers = useMemo(() => {
    const safePage = Math.min(currentUserPage, totalUserPages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;

    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentUserPage, filteredUsers, totalUserPages]);

  const filteredStables = useMemo(() => {
    const term = stableSearch.trim().toLowerCase();
    if (!term) return stables;

    return stables.filter((stable) => {
      const name = String(stable.nev || "").toLowerCase();
      const owner = String(stable.owner_nev || "").toLowerCase();
      return name.includes(term) || owner.includes(term);
    });
  }, [stables, stableSearch]);

  const totalStablePages = Math.max(1, Math.ceil(filteredStables.length / ITEMS_PER_PAGE));
  const visibleStables = useMemo(() => {
    const safePage = Math.min(currentStablePage, totalStablePages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;

    return filteredStables.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentStablePage, filteredStables, totalStablePages]);

  const filteredHorses = useMemo(() => {
    const term = horseSearch.trim().toLowerCase();
    if (!term) return horses;

    return horses.filter((horse) => {
      const name = String(horse.nev || "").toLowerCase();
      const breed = String(horse.fajta || "").toLowerCase();
      const owner = String(horse.tulajdonos_nev || "").toLowerCase();
      return name.includes(term) || breed.includes(term) || owner.includes(term);
    });
  }, [horseSearch, horses]);

  const totalHorsePages = Math.max(1, Math.ceil(filteredHorses.length / ITEMS_PER_PAGE));
  const visibleHorses = useMemo(() => {
    const safePage = Math.min(currentHorsePage, totalHorsePages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;

    return filteredHorses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentHorsePage, filteredHorses, totalHorsePages]);

  const filteredCompetitions = useMemo(() => {
    const term = competitionSearch.trim().toLowerCase();
    if (!term) return competitions;

    return competitions.filter((competition) => {
      const name = String(competition.nev || "").toLowerCase();
      const date = String(competition.datum || "").toLowerCase();
      const stable = String(competition.lovarda_nev || "").toLowerCase();
      return name.includes(term) || date.includes(term) || stable.includes(term);
    });
  }, [competitionSearch, competitions]);

  const totalCompetitionPages = Math.max(1, Math.ceil(filteredCompetitions.length / ITEMS_PER_PAGE));
  const visibleCompetitions = useMemo(() => {
    const safePage = Math.min(currentCompetitionPage, totalCompetitionPages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;

    return filteredCompetitions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentCompetitionPage, filteredCompetitions, totalCompetitionPages]);

  const sections = [
    { id: "users", label: "Felhasználók" },
    { id: "stables", label: "Lovardák" },
    { id: "horses", label: "Lovak" },
    { id: "competitions", label: "Versenyek" },
  ];

  async function loadAll() {
    try {
      setError("");

      const [usersData, stablesData, horsesData, competitionsData, usersListData] =
        await Promise.all([
          apiFetch("/api/admin/users"),
          apiFetch("/api/admin/stables"),
          apiFetch("/api/admin/horses"),
          apiFetch("/api/admin/competitions"),
          apiFetch("/api/admin/users-list"),
        ]);

      setUsers(usersData.users || []);
      setStables(stablesData.stables || []);
      setHorses(horsesData.horses || []);
      setCompetitions(competitionsData.competitions || []);
      setUsersList(usersListData.users || []);
    } catch (err) {
      setError(err.message || "Hiba történt.");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    setCurrentUserPage(1);
  }, [userSearch]);

  useEffect(() => {
    setCurrentStablePage(1);
  }, [stableSearch]);

  useEffect(() => {
    setCurrentHorsePage(1);
  }, [horseSearch]);

  useEffect(() => {
    setCurrentCompetitionPage(1);
  }, [competitionSearch]);

  useEffect(() => {
    if (currentUserPage > totalUserPages) {
      setCurrentUserPage(totalUserPages);
    }
  }, [currentUserPage, totalUserPages]);

  useEffect(() => {
    if (currentStablePage > totalStablePages) {
      setCurrentStablePage(totalStablePages);
    }
  }, [currentStablePage, totalStablePages]);

  useEffect(() => {
    if (currentHorsePage > totalHorsePages) {
      setCurrentHorsePage(totalHorsePages);
    }
  }, [currentHorsePage, totalHorsePages]);

  useEffect(() => {
    if (currentCompetitionPage > totalCompetitionPages) {
      setCurrentCompetitionPage(totalCompetitionPages);
    }
  }, [currentCompetitionPage, totalCompetitionPages]);

  // == FELHASZNÁLÓ MŰVELETEK ==
  function startEditUser(user) {
    setEditingUser(user);
    setEditForm({
      nev: user.nev,
      email: user.email,
      lovarda_id: user.lovarda_id,
      szerepkor: user.szerepkor,
    });
    setError("");
  }

  async function saveEditUser() {
    if (!editForm.nev || !editForm.email) {
      setError("Név és email szükséges.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiFetch(`/api/admin/users/${editingUser.felhasznalo_id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });

      setSuccess("Felhasználó frissítve.");
      setEditingUser(null);
      setEditForm({});
      loadAll();
    } catch (err) {
      setError(err.message || "Mentési hiba.");
    }
  }

  async function handleDeleteUser(userId, userName) {
    const confirmed = window.confirm(
      `Biztosan törölni szeretnéd ezt a felhasználót: "${userName}"?\n\nEz a művelet nem visszavonható.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const data = await apiFetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      setSuccess(data.message || "Felhasználó törölve.");
      loadAll();
    } catch (err) {
      setError(err.message || "Törlési hiba.");
    }
  }

  // == LOVARDA MŰVELETEK ==
  function startEditStable(stable) {
    setEditingStable(stable);
    setEditForm({
      nev: stable.nev,
      owner_user_id: stable.owner_id || null,
    });
    setError("");
  }

  async function saveEditStable() {
    if (!editForm.nev) {
      setError("Lovarda neve szükséges.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiFetch(`/api/admin/stables/${editingStable.lovarda_id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });

      setSuccess("Lovarda frissítve.");
      setEditingStable(null);
      setEditForm({});
      loadAll();
    } catch (err) {
      setError(err.message || "Mentési hiba.");
    }
  }

  async function handleDeleteStable(stableId, stableName) {
    const confirmed = window.confirm(
      `Biztosan törölni szeretnéd ezt a lovardát: "${stableName}"?\n\nA lovarda vezetője törlődik. A lovasok megmaradnak, és később másik lovardához csatlakozhatnak.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const data = await apiFetch(`/api/admin/stables/${stableId}`, {
        method: "DELETE",
      });

      setSuccess(data.message || "Lovarda sikeresen törölve.");
      loadAll();
    } catch (err) {
      setError(err.message || "Törlési hiba.");
    }
  }

  // == LÓ MŰVELETEK ==
  function startEditHorse(horse) {
    setEditingHorse(horse);
    setEditForm({
      nev: horse.nev,
      fajta: horse.fajta || "",
      szuletesi_ido: horse.szuletesi_ido || "",
      felhasznalo_id: horse.felhasznalo_id,
    });
    setError("");
  }

  async function saveEditHorse() {
    if (!editForm.nev) {
      setError("Ló neve szükséges.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiFetch(`/api/admin/horses/${editingHorse.lo_id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });

      setSuccess("Ló frissítve.");
      setEditingHorse(null);
      setEditForm({});
      loadAll();
    } catch (err) {
      setError(err.message || "Mentési hiba.");
    }
  }

  async function handleDeleteHorse(horseId, horseName) {
    const confirmed = window.confirm(
      `Biztosan törölni szeretnéd ezt a lovat: "${horseName}"?\n\nEz a művelet nem visszavonható.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const data = await apiFetch(`/api/admin/horses/${horseId}`, {
        method: "DELETE",
      });

      setSuccess(data.message || "Ló törölve.");
      loadAll();
    } catch (err) {
      setError(err.message || "Törlési hiba.");
    }
  }

  // == VERSENY MŰVELETEK ==
  function startEditCompetition(competition) {
    setEditingCompetition(competition);
    setEditForm({
      nev: competition.nev,
      datum: competition.datum,
      lovarda_id: competition.lovarda_id,
    });
    setError("");
  }

  async function saveEditCompetition() {
    if (!editForm.nev || !editForm.datum) {
      setError("Verseny neve és dátuma szükséges.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiFetch(`/api/admin/competitions/${editingCompetition.verseny_id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });

      setSuccess("Verseny frissítve.");
      setEditingCompetition(null);
      setEditForm({});
      loadAll();
    } catch (err) {
      setError(err.message || "Mentési hiba.");
    }
  }

  async function handleDeleteCompetition(competitionId, competitionName) {
    const confirmed = window.confirm(
      `Biztosan törölni szeretnéd ezt a versenyt: "${competitionName}"?\n\nEz a művelet nem visszavonható.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const data = await apiFetch(`/api/admin/competitions/${competitionId}`, {
        method: "DELETE",
      });

      setSuccess(data.message || "Verseny törölve.");
      loadAll();
    } catch (err) {
      setError(err.message || "Törlési hiba.");
    }
  }

  function closeModals() {
    setEditingUser(null);
    setEditingStable(null);
    setEditingHorse(null);
    setEditingCompetition(null);
    setEditForm({});
  }

  return (
    <div className="adminPage">
      <Header />

      <main className="adminMain">
        <div className="adminHeader">
          <h1 className="adminTitle">Admin felület</h1>
          <p className="adminSubtitle">Felhasználók, lovardák, lovak és versenyek kezelése</p>
        </div>

        {success && <div className="adminAlert adminAlertSuccess">{success}</div>}
        {error && <div className="adminAlert adminAlertError">{error}</div>}
        <div className="adminLayout">
          <aside className="adminSidebar">
            <div className="adminSidebarTitle">Szekciók</div>

            <nav className="adminSidebarNav" aria-label="Admin szekciók">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`adminSidebarItem ${activeSection === section.id ? "is-active" : ""}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="adminContent">
            {activeSection === "users" && (
              <section className="adminCard">
                <div className="adminSectionHeaderRow">
                  <h2 className="adminSectionTitle">Felhasználók</h2>

                  <div className="adminSearchWrap">
                    <input
                      type="text"
                      className="adminSearchInput"
                      placeholder="Keresés"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="adminList adminList--spacedTop">
                  {visibleUsers.map((u) => (
                    <div key={u.felhasznalo_id} className="adminRowCard adminRowInline">
                      <div>
                        <div className="adminNameWithBadge">
                          <p className="adminPrimaryText">{u.nev}</p>
                          <span className="adminBadge">{getRoleLabel(u.szerepkor)}</span>
                          <p className="adminSecondaryText">{u.email}</p>
                        </div>
                      </div>

                      <div className="adminUserActions">
                        <div className="adminRowBottomActions">
                          <button
                            type="button"
                            className="adminEditButton"
                            onClick={() => startEditUser(u)}
                          >
                            Szerkesztés
                          </button>

                          <button
                            type="button"
                            className="adminDeleteButton"
                            onClick={() => handleDeleteUser(u.felhasznalo_id, u.nev)}
                          >
                            Törlés
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="adminPagination">
                  <button
                    type="button"
                    className="adminPaginationButton"
                    onClick={() => setCurrentUserPage((page) => Math.max(1, page - 1))}
                    disabled={currentUserPage <= 1}
                  >
                    Előző
                  </button>

                  <span className="adminPaginationInfo">
                    {currentUserPage} / {totalUserPages}
                  </span>

                  <button
                    type="button"
                    className="adminPaginationButton"
                    onClick={() => setCurrentUserPage((page) => Math.min(totalUserPages, page + 1))}
                    disabled={currentUserPage >= totalUserPages}
                  >
                    Következő
                  </button>
                </div>
              </section>
            )}

            {activeSection === "stables" && (
              <section className="adminCard">
                <div className="adminSectionHeaderRow">
                  <h2 className="adminSectionTitle">Lovardák</h2>

                  <div className="adminSearchWrap">
                    <input
                      type="text"
                      className="adminSearchInput"
                      placeholder="Keresés"
                      value={stableSearch}
                      onChange={(e) => setStableSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="adminList">
                  {visibleStables.map((s) => (
                    <div key={s.lovarda_id} className="adminRowCard adminRowInline">
                      <div>
                        <p className="adminPrimaryText">{s.nev}</p>
                        {s.owner_nev && (
                          <p className="adminSecondaryText">Vezető: {s.owner_nev}</p>
                        )}
                      </div>

                      <div className="adminRowBottomActions">
                        <button
                          type="button"
                          className="adminEditButton"
                          onClick={() => startEditStable(s)}
                        >
                          Szerkesztés
                        </button>

                        <button
                          type="button"
                          className="adminDeleteButton"
                          onClick={() => handleDeleteStable(s.lovarda_id, s.nev)}
                        >
                          Törlés
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="adminPagination">
                  <button
                    type="button"
                    className="adminPaginationButton"
                    onClick={() => setCurrentStablePage((page) => Math.max(1, page - 1))}
                    disabled={currentStablePage <= 1}
                  >
                    Előző
                  </button>

                  <span className="adminPaginationInfo">
                    {currentStablePage} / {totalStablePages}
                  </span>

                  <button
                    type="button"
                    className="adminPaginationButton"
                    onClick={() => setCurrentStablePage((page) => Math.min(totalStablePages, page + 1))}
                    disabled={currentStablePage >= totalStablePages}
                  >
                    Következő
                  </button>
                </div>
              </section>
            )}

            {activeSection === "horses" && (
              <section className="adminCard">
                <div className="adminSectionHeaderRow">
                  <h2 className="adminSectionTitle">Lovak</h2>

                  <div className="adminSearchWrap">
                    <input
                      type="text"
                      className="adminSearchInput"
                      placeholder="Keresés"
                      value={horseSearch}
                      onChange={(e) => setHorseSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="adminList">
                  {visibleHorses.map((h) => (
                    <div key={h.lo_id} className="adminRowCard adminRowInline">
                      <div>
                        <p className="adminPrimaryText">{h.nev}</p>
                        <p className="adminSecondaryText">
                          {h.fajta || "nincs fajta"} • tulajdonos: {h.tulajdonos_nev}
                        </p>
                      </div>

                      <div className="adminRowBottomActions">
                        <button
                          type="button"
                          className="adminEditButton"
                          onClick={() => startEditHorse(h)}
                        >
                          Szerkesztés
                        </button>

                        <button
                          type="button"
                          className="adminDeleteButton"
                          onClick={() => handleDeleteHorse(h.lo_id, h.nev)}
                        >
                          Törlés
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="adminPagination">
                  <button
                    type="button"
                    className="adminPaginationButton"
                    onClick={() => setCurrentHorsePage((page) => Math.max(1, page - 1))}
                    disabled={currentHorsePage <= 1}
                  >
                    Előző
                  </button>

                  <span className="adminPaginationInfo">
                    {currentHorsePage} / {totalHorsePages}
                  </span>

                  <button
                    type="button"
                    className="adminPaginationButton"
                    onClick={() => setCurrentHorsePage((page) => Math.min(totalHorsePages, page + 1))}
                    disabled={currentHorsePage >= totalHorsePages}
                  >
                    Következő
                  </button>
                </div>
              </section>
            )}

            {activeSection === "competitions" && (
              <section className="adminCard">
                <div className="adminSectionHeaderRow">
                  <h2 className="adminSectionTitle">Versenyek</h2>

                  <div className="adminSearchWrap">
                    <input
                      type="text"
                      className="adminSearchInput"
                      placeholder="Keresés"
                      value={competitionSearch}
                      onChange={(e) => setCompetitionSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="adminList">
                  {visibleCompetitions.map((c) => (
                    <div key={c.verseny_id} className="adminRowCard adminRowInline">
                      <div>
                        <p className="adminPrimaryText">{c.nev}</p>
                        <p className="adminSecondaryText">
                          {c.datum} • {c.lovarda_nev || "nincs lovarda"}
                        </p>
                      </div>

                      <div className="adminRowBottomActions">
                        <button
                          type="button"
                          className="adminEditButton"
                          onClick={() => startEditCompetition(c)}
                        >
                          Szerkesztés
                        </button>

                        <button
                          type="button"
                          className="adminDeleteButton"
                          onClick={() => handleDeleteCompetition(c.verseny_id, c.nev)}
                        >
                          Törlés
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="adminPagination">
                  <button
                    type="button"
                    className="adminPaginationButton"
                    onClick={() => setCurrentCompetitionPage((page) => Math.max(1, page - 1))}
                    disabled={currentCompetitionPage <= 1}
                  >
                    Előző
                  </button>

                  <span className="adminPaginationInfo">
                    {currentCompetitionPage} / {totalCompetitionPages}
                  </span>

                  <button
                    type="button"
                    className="adminPaginationButton"
                    onClick={() => setCurrentCompetitionPage((page) => Math.min(totalCompetitionPages, page + 1))}
                    disabled={currentCompetitionPage >= totalCompetitionPages}
                  >
                    Következő
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* FELHASZNÁLÓ SZERKESZTÉSE */}
      {editingUser && (
        <div className="adminModalOverlay" onClick={closeModals}>
          <div className="adminModal" onClick={(e) => e.stopPropagation()}>
            <div className="adminModalHeader">
              <h3 className="adminModalTitle">Felhasználó szerkesztése</h3>
              <button
                type="button"
                className="adminModalClose"
                onClick={closeModals}
              >
                ✕
              </button>
            </div>

            <div className="adminModalBody">
              <div className="adminFormGroup">
                <label className="adminFormLabel">Név</label>
                <input
                  type="text"
                  className="adminFormInput"
                  value={editForm.nev || ""}
                  onChange={(e) => setEditForm({ ...editForm, nev: e.target.value })}
                />
              </div>

              <div className="adminFormGroup">
                <label className="adminFormLabel">Email</label>
                <input
                  type="email"
                  className="adminFormInput"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div className="adminFormGroup">
                <label className="adminFormLabel">Lovarda</label>
                <select
                  className="adminFormInput"
                  value={editForm.lovarda_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, lovarda_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">-- Nincs lovarda --</option>
                  {stables.map((s) => (
                    <option key={s.lovarda_id} value={s.lovarda_id}>
                      {s.nev}
                    </option>
                  ))}
                </select>
              </div>

              <div className="adminFormGroup">
                <label className="adminFormLabel">Szerepkör</label>
                <select
                  className="adminFormInput"
                  value={editForm.szerepkor || ""}
                  onChange={(e) => setEditForm({ ...editForm, szerepkor: e.target.value })}
                >
                  <option value="lovas">Lovas</option>
                  <option value="lovarda_vezeto">Lovarda vezető</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="adminModalFooter">
              <button
                type="button"
                className="adminButtonCancel"
                onClick={closeModals}
              >
                Mégse
              </button>
              <button
                type="button"
                className="adminButtonSave"
                onClick={saveEditUser}
              >
                Mentés
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOVARDA SZERKESZTÉSE */}
      {editingStable && (
        <div className="adminModalOverlay" onClick={closeModals}>
          <div className="adminModal" onClick={(e) => e.stopPropagation()}>
            <div className="adminModalHeader">
              <h3 className="adminModalTitle">Lovarda szerkesztése</h3>
              <button
                type="button"
                className="adminModalClose"
                onClick={closeModals}
              >
                ✕
              </button>
            </div>

            <div className="adminModalBody">
              <div className="adminFormGroup">
                <label className="adminFormLabel">Lovarda neve</label>
                <input
                  type="text"
                  className="adminFormInput"
                  value={editForm.nev || ""}
                  onChange={(e) => setEditForm({ ...editForm, nev: e.target.value })}
                />
              </div>

              <div className="adminFormGroup">
                <label className="adminFormLabel">Lovarda vezető (lovas)</label>
                <select
                  className="adminFormInput"
                  value={editForm.owner_user_id || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      owner_user_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                >
                  <option value="">-- Nincs kijelölve --</option>
                  {stableLeaderCandidates.map((u) => (
                    <option key={u.felhasznalo_id} value={u.felhasznalo_id}>
                      {u.nev} ({getRoleLabel(u.szerepkor)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="adminModalFooter">
              <button
                type="button"
                className="adminButtonCancel"
                onClick={closeModals}
              >
                Mégse
              </button>
              <button
                type="button"
                className="adminButtonSave"
                onClick={saveEditStable}
              >
                Mentés
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LÓ SZERKESZTÉSE */}
      {editingHorse && (
        <div className="adminModalOverlay" onClick={closeModals}>
          <div className="adminModal" onClick={(e) => e.stopPropagation()}>
            <div className="adminModalHeader">
              <h3 className="adminModalTitle">Ló szerkesztése</h3>
              <button
                type="button"
                className="adminModalClose"
                onClick={closeModals}
              >
                ✕
              </button>
            </div>

            <div className="adminModalBody">
              <div className="adminFormGroup">
                <label className="adminFormLabel">Ló neve</label>
                <input
                  type="text"
                  className="adminFormInput"
                  value={editForm.nev || ""}
                  onChange={(e) => setEditForm({ ...editForm, nev: e.target.value })}
                />
              </div>

              <div className="adminFormGroup">
                <label className="adminFormLabel">Fajta</label>
                <input
                  type="text"
                  className="adminFormInput"
                  value={editForm.fajta || ""}
                  onChange={(e) => setEditForm({ ...editForm, fajta: e.target.value })}
                />
              </div>

              <div className="adminFormGroup">
                <label className="adminFormLabel">Születési idő</label>
                <input
                  type="date"
                  className="adminFormInput"
                  value={editForm.szuletesi_ido || ""}
                  onChange={(e) => setEditForm({ ...editForm, szuletesi_ido: e.target.value })}
                />
              </div>

              <div className="adminFormGroup">
                <label className="adminFormLabel">Tulajdonos</label>
                <select
                  className="adminFormInput"
                  value={editForm.felhasznalo_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, felhasznalo_id: Number(e.target.value) })}
                >
                  <option value="">-- Kérem válassz --</option>
                  {usersList.map((u) => (
                    <option key={u.felhasznalo_id} value={u.felhasznalo_id}>
                      {u.nev}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="adminModalFooter">
              <button
                type="button"
                className="adminButtonCancel"
                onClick={closeModals}
              >
                Mégse
              </button>
              <button
                type="button"
                className="adminButtonSave"
                onClick={saveEditHorse}
              >
                Mentés
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERSENY SZERKESZTÉSE */}
      {editingCompetition && (
        <div className="adminModalOverlay" onClick={closeModals}>
          <div className="adminModal" onClick={(e) => e.stopPropagation()}>
            <div className="adminModalHeader">
              <h3 className="adminModalTitle">Verseny szerkesztése</h3>
              <button
                type="button"
                className="adminModalClose"
                onClick={closeModals}
              >
                ✕
              </button>
            </div>

            <div className="adminModalBody">
              <div className="adminFormGroup">
                <label className="adminFormLabel">Verseny neve</label>
                <input
                  type="text"
                  className="adminFormInput"
                  value={editForm.nev || ""}
                  onChange={(e) => setEditForm({ ...editForm, nev: e.target.value })}
                />
              </div>

              <div className="adminFormGroup">
                <label className="adminFormLabel">Dátum</label>
                <input
                  type="date"
                  className="adminFormInput"
                  value={editForm.datum || ""}
                  onChange={(e) => setEditForm({ ...editForm, datum: e.target.value })}
                />
              </div>

              <div className="adminFormGroup">
                <label className="adminFormLabel">Lovarda</label>
                <select
                  className="adminFormInput"
                  value={editForm.lovarda_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, lovarda_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">-- Nincs lovarda --</option>
                  {stables.map((s) => (
                    <option key={s.lovarda_id} value={s.lovarda_id}>
                      {s.nev}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="adminModalFooter">
              <button
                type="button"
                className="adminButtonCancel"
                onClick={closeModals}
              >
                Mégse
              </button>
              <button
                type="button"
                className="adminButtonSave"
                onClick={saveEditCompetition}
              >
                Mentés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;