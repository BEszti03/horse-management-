import { useEffect, useState } from "react";
import Header from "../components/Header";
import { apiFetch } from "../utils/api";
import "./Admin.css";

function Admin() {
  const [users, setUsers] = useState([]);
  const [stables, setStables] = useState([]);
  const [horses, setHorses] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

        <section className="adminCard">
          <h2 className="adminSectionTitle">Felhasználók</h2>

          <div className="adminList">
            {users.map((u) => (
              <div key={u.felhasznalo_id} className="adminRowCard">
                <div className="adminRowTop">
                  <div>
                    <p className="adminPrimaryText">{u.nev}</p>
                    <p className="adminSecondaryText">{u.email}</p>
                  </div>

                  <span className="adminBadge">{u.szerepkor}</span>
                </div>

                <div className="adminRowBottom">
                  <select
                    className="adminSelect"
                    value={u.szerepkor}
                    onChange={(e) => handleRoleChange(u.felhasznalo_id, e.target.value)}
                  >
                    <option value="lovas">lovas</option>
                    <option value="lovarda_vezeto">lovarda_vezeto</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>

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

        <section className="adminCard">
          <h2 className="adminSectionTitle">Lovak</h2>

          <div className="adminList">
            {horses.map((h) => (
              <div key={h.lo_id} className="adminRowCard">
                <p className="adminPrimaryText">{h.nev}</p>
                <p className="adminSecondaryText">
                  {h.fajta || "nincs fajta"} • tulajdonos: {h.tulajdonos_nev}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="adminCard">
          <h2 className="adminSectionTitle">Versenyek</h2>

          <div className="adminList">
            {competitions.map((c) => (
              <div key={c.verseny_id} className="adminRowCard">
                <p className="adminPrimaryText">{c.nev}</p>
                <p className="adminSecondaryText">
                  {c.datum} • {c.lovarda_nev || "nincs lovarda"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Admin;