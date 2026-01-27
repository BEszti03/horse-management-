import { useEffect, useState, useCallback } from "react";
import Header from "../components/Header";

function Horses() {
  const [horses, setHorses] = useState([]);

  const [nev, setNev] = useState("");
  const [fajta, setFajta] = useState("");
  const [szuletesiIdo, setSzuletesiIdo] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editNev, setEditNev] = useState("");
  const [editFajta, setEditFajta] = useState("");
  const [editSzuletesiIdo, setEditSzuletesiIdo] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchHorses = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/horses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Hiba a lovak lekérésekor.");
        return;
      }

      setHorses(data);
    } catch {
      setError("Nem sikerült kapcsolódni a szerverhez.");
    }
  }, [token]);

  useEffect(() => {
    fetchHorses();
  }, [fetchHorses]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/horses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nev,
          fajta,
          szuletesi_ido: szuletesiIdo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Hiba történt.");
        return;
      }

      setMessage("Ló sikeresen hozzáadva!");
      setNev("");
      setFajta("");
      setSzuletesiIdo("");
      fetchHorses();
    } catch {
      setError("Nem sikerült kapcsolódni a szerverhez.");
    }
  }

  function startEdit(lo) {
    setMessage("");
    setError("");
    setEditingId(lo.lo_id);
    setEditNev(lo.nev || "");
    setEditFajta(lo.fajta || "");
    setEditSzuletesiIdo(lo.szuletesi_ido ? lo.szuletesi_ido.slice(0, 10) : "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNev("");
    setEditFajta("");
    setEditSzuletesiIdo("");
  }

  async function handleUpdate(loId) {
    setError("");
    setMessage("");

    try {
      const res = await fetch(`http://localhost:5000/api/horses/${loId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nev: editNev,
          fajta: editFajta,
          szuletesi_ido: editSzuletesiIdo || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Hiba a mentéskor.");
        return;
      }

      setMessage("Ló sikeresen frissítve!");
      cancelEdit();
      fetchHorses();
    } catch {
      setError("Nem sikerült kapcsolódni a szerverhez.");
    }
  }

  async function handleDelete(loId) {
    setError("");
    setMessage("");

    const ok = window.confirm("Biztosan törlöd ezt a lovat?");
    if (!ok) return;

    try {
      const res = await fetch(`http://localhost:5000/api/horses/${loId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Hiba a törléskor.");
        return;
      }

      setMessage("Ló törölve!");
      if (editingId === loId) cancelEdit();
      fetchHorses();
    } catch {
      setError("Nem sikerült kapcsolódni a szerverhez.");
    }
  }

  return (
    <div>
      <Header />

      <main style={{ padding: "24px", maxWidth: "900px" }}>
        <h1>Ló adatok</h1>

        <section style={{ marginBottom: "32px" }}>
          <h2>Új ló felvétele</h2>

          <form onSubmit={handleCreate} style={{ display: "grid", gap: "10px" }}>
            <input
              type="text"
              placeholder="Ló neve"
              value={nev}
              onChange={(e) => setNev(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Fajta"
              value={fajta}
              onChange={(e) => setFajta(e.target.value)}
            />

            <input
              type="date"
              value={szuletesiIdo}
              onChange={(e) => setSzuletesiIdo(e.target.value)}
            />

            <button type="submit">Hozzáadás</button>
          </form>
        </section>

        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <section>
          <h2>Saját lovaim</h2>

          {horses.length === 0 ? (
            <p>Még nincs felvett ló.</p>
          ) : (
            <ul style={{ paddingLeft: "18px" }}>
              {horses.map((lo) => (
                <li key={lo.lo_id} style={{ marginBottom: "14px" }}>
                  {editingId === lo.lo_id ? (
                    <div style={{ display: "grid", gap: "8px" }}>
                      <input
                        type="text"
                        value={editNev}
                        onChange={(e) => setEditNev(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        value={editFajta}
                        onChange={(e) => setEditFajta(e.target.value)}
                      />
                      <input
                        type="date"
                        value={editSzuletesiIdo}
                        onChange={(e) => setEditSzuletesiIdo(e.target.value)}
                      />

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleUpdate(lo.lo_id)}>
                          Mentés
                        </button>
                        <button type="button" onClick={cancelEdit}>
                          Mégse
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        <strong>{lo.nev}</strong>
                        {lo.fajta ? ` – ${lo.fajta}` : ""}
                        {lo.szuletesi_ido
                          ? ` (${lo.szuletesi_ido.slice(0, 10)})`
                          : ""}
                      </span>

                      <button type="button" onClick={() => startEdit(lo)}>
                        Szerkesztés
                      </button>

                      <button type="button" onClick={() => handleDelete(lo.lo_id)}>
                        Törlés
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default Horses;
