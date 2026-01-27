import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Proxy nélkül is biztos
  const API_BASE = "http://localhost:5000";

  const [user, setUser] = useState(null);
  const [stables, setStables] = useState([]);

  const [editMode, setEditMode] = useState(false);
  const [nev, setNev] = useState("");
  const [lovardaId, setLovardaId] = useState("");

  const [showAddStable, setShowAddStable] = useState(false);
  const [newStableName, setNewStableName] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function safeJson(res) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `Nem JSON válasz érkezett (${res.status}). Első 60 karakter: ${text.slice(0, 60)}`
      );
    }
  }

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

        const meRes = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await safeJson(meRes);
        if (!meRes.ok) throw new Error(meData.message || "Nem sikerült lekérni a profilt.");

        setUser(meData.user);
        setNev(meData.user.nev || "");
        setLovardaId(meData.user.lovarda_id ?? "");

        const stablesRes = await fetch(`${API_BASE}/api/stables`);
        const stablesData = await safeJson(stablesRes);
        if (!stablesRes.ok) throw new Error(stablesData.message || "Nem sikerült lekérni a lovardákat.");

        setStables(stablesData.stables || []);
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

      const res = await fetch(`${API_BASE}/api/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nev,
          lovarda_id: lovardaId === "" ? null : Number(lovardaId),
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Mentés sikertelen.");

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

      const res = await fetch(`${API_BASE}/api/stables`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newStableName.trim() }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Lovarda felvitel sikertelen.");

      setNewStableName("");
      setShowAddStable(false);
      setSuccess("Lovarda hozzáadva.");

      const listRes = await fetch(`${API_BASE}/api/stables`);
      const listData = await safeJson(listRes);
      setStables(listData.stables || []);

      if (data?.stable?.stable_id) setLovardaId(String(data.stable.stable_id));
    } catch (err) {
      setError(err.message || "Lovarda felvitel hiba.");
    }
  }

  return (
    <div>
      <Header />
      <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
        <h1>Profil</h1>

        {loading && <p>Betöltés...</p>}

        {success && <div style={{ background: "#d4edda", padding: 12 }}>{success}</div>}
        {error && <div style={{ background: "#ffe6e6", padding: 12 }}>{error}</div>}

        {!loading && user && (
          <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 12 }}>
            {!editMode ? (
              <>
                <p><b>Név:</b> {user.nev}</p>
                <p><b>Email:</b> {user.email}</p>
                <p><b>Szerepkör:</b> {user.szerepkor}</p>
                <p><b>Lovarda:</b> {user.lovarda_nev || "Nincs beállítva"}</p>

                <button onClick={() => setEditMode(true)}>Profil szerkesztése</button>
              </>
            ) : (
              <>
                <label>
                  Név
                  <input value={nev} onChange={(e) => setNev(e.target.value)} />
                </label>

                <label>
                  Lovarda
                  <select value={lovardaId} onChange={(e) => setLovardaId(e.target.value)}>
                    <option value="">— nincs —</option>
                    {stables.map((s) => (
                      <option key={s.stable_id} value={s.stable_id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>

                <button onClick={() => setShowAddStable(!showAddStable)}>
                  Új lovarda felvitele
                </button>

                {showAddStable && (
                  <>
                    <input
                      placeholder="Lovarda neve"
                      value={newStableName}
                      onChange={(e) => setNewStableName(e.target.value)}
                    />
                    <button onClick={handleAddStable}>Hozzáadás</button>
                  </>
                )}

                <div style={{ marginTop: 12 }}>
                  <button onClick={handleSave}>Mentés</button>
                  <button onClick={() => setEditMode(false)}>Mégse</button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Profile;
