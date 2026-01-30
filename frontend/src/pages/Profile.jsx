import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { apiFetch } from "../utils/api";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(null);
  const [stables, setStables] = useState([]);

  const [editMode, setEditMode] = useState(false);
  const [nev, setNev] = useState("");
  const [lovardaId, setLovardaId] = useState("");
  const [szerepkor, setSzerepkor] = useState("lovas");

  const [showAddStable, setShowAddStable] = useState(false);
  const [newStableName, setNewStableName] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const meData = await apiFetch("/api/users/me");

        setUser(meData.user);
        setNev(meData.user.nev || "");
        setLovardaId(meData.user.lovarda_id ?? "");
        setSzerepkor(meData.user.szerepkor || "lovas");

        const stablesData = await apiFetch("/api/stables", {
          headers: { "Content-Type": "application/json" },
        });
        setStables(stablesData?.stables || []);
      } catch (err) {
        setError(err.message || "Hiba történt.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate, token]);

  async function handleSave() {
    try {
      setError("");
      setSuccess("");

      const data = await apiFetch("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({
          nev,
          lovarda_id: lovardaId === "" ? null : Number(lovardaId),
          szerepkor,
        }),
      });

      setUser(data.user);
      setSuccess("Sikeres mentés!");
      setEditMode(false);
    } catch (err) {
      setError(err.message || "Mentési hiba.");
    }
  }

  async function handleAddStable() {
    if (!newStableName.trim()) {
      setError("A lovarda neve kötelező.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const data = await apiFetch("/api/stables", {
        method: "POST",
        body: JSON.stringify({ name: newStableName.trim() }),
      });

      setNewStableName("");
      setShowAddStable(false);
      setSuccess("Lovarda hozzáadva.");

      const listData = await apiFetch("/api/stables", {
        headers: { "Content-Type": "application/json" },
      });
      setStables(listData?.stables || []);

      if (data?.stable?.stable_id) setLovardaId(String(data.stable.stable_id));
    } catch (err) {
      setError(err.message || "Lovarda felvitel hiba.");
    }
  }

  function roleLabel(r) {
    if (r === "lovarda_vezeto") return "Lovarda vezető";
    return "Lovas";
  }

  return (
    <div className="profilePage">
      <Header />

      <main className="profileMain">
        <div className="profileHeader">
          <h1 className="profileTitle">Profil</h1>
          <p className="profileSubtitle">Személyes adatok és lovarda beállítások</p>
        </div>

        {loading && <p className="profileLoading">Betöltés...</p>}

        {success && <div className="profileAlert profileAlertSuccess">{success}</div>}
        {error && <div className="profileAlert profileAlertError">{error}</div>}

        {!loading && user && (
          <section className="profileCard">
            {!editMode ? (
              <>
                <div className="profileInfoGrid">
                  <div className="profileInfoRow">
                    <span className="profileLabel">Név</span>
                    <span className="profileValue">{user.nev}</span>
                  </div>
                  <div className="profileInfoRow">
                    <span className="profileLabel">Email</span>
                    <span className="profileValue">{user.email}</span>
                  </div>
                  <div className="profileInfoRow">
                    <span className="profileLabel">Szerepkör</span>
                    <span className="profileValue">{roleLabel(user.szerepkor)}</span>
                  </div>
                  <div className="profileInfoRow">
                    <span className="profileLabel">Lovarda</span>
                    <span className="profileValue">
                      {user.lovarda_nev || <span className="profileMuted">Nincs beállítva</span>}
                    </span>
                  </div>
                </div>

                <div className="profileActions">
                  <button className="btn btnPrimary" onClick={() => setEditMode(true)}>
                    Profil szerkesztése
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="profileForm">
                  <label className="field">
                    <span className="fieldLabel">Név</span>
                    <input
                      className="fieldInput"
                      value={nev}
                      onChange={(e) => setNev(e.target.value)}
                      placeholder="Add meg a neved"
                      autoComplete="name"
                    />
                  </label>

                  <label className="field">
                    <span className="fieldLabel">Szerepkör</span>
                    <select
                      className="fieldSelect"
                      value={szerepkor}
                      onChange={(e) => setSzerepkor(e.target.value)}
                    >
                      <option value="lovas">Lovas</option>
                      <option value="lovarda_vezeto">Lovarda vezető</option>
                    </select>
                  </label>

                  <label className="field">
                    <span className="fieldLabel">Lovarda</span>
                    <select
                      className="fieldSelect"
                      value={lovardaId}
                      onChange={(e) => setLovardaId(e.target.value)}
                    >
                      <option value="">— nincs —</option>
                      {stables.map((s) => (
                        <option key={s.stable_id} value={s.stable_id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <span className="fieldHint">
                      Tipp: ha a lovardád nincs a listában, fel tudod venni.
                    </span>
                  </label>

                  <div className="profileDivider" />

                  <div className="profileInlineRow">
                    <button
                      className="btn btnSoft"
                      onClick={() => setShowAddStable(!showAddStable)}
                      type="button"
                    >
                      Új lovarda felvitele
                    </button>
                  </div>

                  {showAddStable && (
                    <div className="addStableBox">
                      <div className="addStableRow">
                        <input
                          className="fieldInput"
                          placeholder="Lovarda neve"
                          value={newStableName}
                          onChange={(e) => setNewStableName(e.target.value)}
                        />
                        <button className="btn btnPrimary" onClick={handleAddStable} type="button">
                          Hozzáadás
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="profileActions profileActionsSplit">
                  <button className="btn btnPrimary" onClick={handleSave} type="button">
                    Mentés
                  </button>

                  <button
                    className="btn btnGhost"
                    onClick={() => {
                      setEditMode(false);
                      setNev(user.nev || "");
                      setLovardaId(user.lovarda_id ?? "");
                      setSzerepkor(user.szerepkor || "lovas");
                      setShowAddStable(false);
                      setNewStableName("");
                      setError("");
                      setSuccess("");
                    }}
                    type="button"
                  >
                    Mégse
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default Profile;
