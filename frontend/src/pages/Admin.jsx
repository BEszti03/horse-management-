import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { apiFetch } from "../utils/api";
import "./Admin.css";

function Admin() {
  const [users, setUsers] = useState([]);
  const [stables, setStables] = useState([]);
  const [horses, setHorses] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [activeSection, setActiveSection] = useState("users");
  const [userSearch, setUserSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return users;

    return users.filter((u) => {
      const name = String(u.nev || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [users, userSearch]);

  const sections = [
    { id: "users", label: "Felhasználók" },
    { id: "stables", label: "Lovardák" },
    { id: "horses", label: "Lovak" },
    { id: "competitions", label: "Versenyek" },
  ];

  async function loadAll() {
    try {
      setError("");

      const [usersData, stablesData, horsesData, competitionsData] =
        await Promise.all([
          apiFetch("/api/admin/users"),
          apiFetch("/api/admin/stables"),
          apiFetch("/api/admin/horses"),
          apiFetch("/api/admin/competitions"),
        ]);

      setUsers(usersData.users || []);
      setStables(stablesData.stables || []);
      setHorses(horsesData.horses || []);
      setCompetitions(competitionsData.competitions || []);
    } catch (err) {
      setError(err.message || "Hiba történt.");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleRoleChange(userId, szerepkor) {
    try {
      setError("");
      setSuccess("");

      await apiFetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ szerepkor }),
      });

      setSuccess("Szerepkör frissítve.");
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

async function handleDeleteStable(stableId, stableName) {
  const confirmed = window.confirm(
    `Biztosan törölni szeretnéd ezt a lovardát: "${stableName}"?\n\nA felhasználók megmaradnak, csak a lovarda kapcsolat fog megszűnni náluk.`
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
                  {filteredUsers.map((u) => (
                    <div key={u.felhasznalo_id} className="adminRowCard">
                      <div className="adminRowTop">
                        <div>
                          <p className="adminPrimaryText">{u.nev}</p>
                          <p className="adminSecondaryText">{u.email}</p>
                        </div>

                        <span className="adminBadge">{u.szerepkor}</span>
                      </div>

                      <div className="adminRowBottom">
                        <div className="adminRowBottomActions">
                          <select
                            className="adminSelect"
                            value={u.szerepkor}
                            onChange={(e) => handleRoleChange(u.felhasznalo_id, e.target.value)}
                          >
                            <option value="lovas">lovas</option>
                            <option value="lovarda_vezeto">lovarda_vezeto</option>
                            <option value="admin">admin</option>
                          </select>

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
              </section>
            )}

            {activeSection === "stables" && (
              <section className="adminCard">
                <h2 className="adminSectionTitle">Lovardák</h2>

                <div className="adminList">
                  {stables.map((s) => (
                    <div key={s.lovarda_id} className="adminRowCard adminRowInline">
                      <div>
                        <p className="adminPrimaryText">{s.nev}</p>
                      </div>

                      <button
                        type="button"
                        className="adminDeleteButton"
                        onClick={() => handleDeleteStable(s.lovarda_id, s.nev)}
                      >
                        Törlés
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "horses" && (
              <section className="adminCard">
                <h2 className="adminSectionTitle">Lovak</h2>

                <div className="adminList">
                  {horses.map((h) => (
                    <div key={h.lo_id} className="adminRowCard adminRowInline">
                      <div>
                        <p className="adminPrimaryText">{h.nev}</p>
                        <p className="adminSecondaryText">
                          {h.fajta || "nincs fajta"} • tulajdonos: {h.tulajdonos_nev}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="adminDeleteButton"
                        onClick={() => handleDeleteHorse(h.lo_id, h.nev)}
                      >
                        Törlés
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "competitions" && (
              <section className="adminCard">
                <h2 className="adminSectionTitle">Versenyek</h2>

                <div className="adminList">
                  {competitions.map((c) => (
                    <div key={c.verseny_id} className="adminRowCard adminRowInline">
                      <div>
                        <p className="adminPrimaryText">{c.nev}</p>
                        <p className="adminSecondaryText">
                          {c.datum} • {c.lovarda_nev || "nincs lovarda"}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="adminDeleteButton"
                        onClick={() => handleDeleteCompetition(c.verseny_id, c.nev)}
                      >
                        Törlés
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Admin;