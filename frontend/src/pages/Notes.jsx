import { useEffect, useState, useCallback } from "react";
import Header from "../components/Header";
import "./Notes.css";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [cim, setCim] = useState("");
  const [szoveg, setSzoveg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setNotes(data);
      else setNotes([]);
    } catch {
      setNotes([]);
    }
  }, [token]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  function formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `http://localhost:5000/api/notes/${editingId}`
      : "http://localhost:5000/api/notes";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cim, szoveg }),
    });

    if (!res.ok) {
      setError("Mentés sikertelen.");
      return;
    }

    setCim("");
    setSzoveg("");
    setEditingId(null);
    setMessage(editingId ? "Jegyzet módosítva!" : "Jegyzet létrehozva!");
    fetchNotes();
  }

  function startEdit(n) {
    setEditingId(n.jegyzet_id);
    setCim(n.cim);
    setSzoveg(n.szoveg);
    setMessage("");
  }

  async function deleteNote(id) {
    if (!window.confirm("Biztosan törlöd ezt a jegyzetet?")) return;

    await fetch(`http://localhost:5000/api/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchNotes();
  }

  return (
    <div>
      <Header />

      <main className="notes">
        <section className="notes__form">
          <h2>{editingId ? "Jegyzet szerkesztése" : "Új jegyzet"}</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Cím"
              value={cim}
              onChange={(e) => setCim(e.target.value)}
              required
            />

            <textarea
              placeholder="Ide írhatod a jegyzeted…"
              value={szoveg}
              onChange={(e) => setSzoveg(e.target.value)}
              rows={5}
            />

            <button type="submit">
              {editingId ? "Mentés" : "Jegyzet hozzáadása"}
            </button>
          </form>

          {message && <p className="notes__success">{message}</p>}
          {error && <p className="notes__error">{error}</p>}
        </section>

        <section className="notes__list">
          {notes.length === 0 ? (
            <p className="notes__empty">Még nincs jegyzeted.</p>
          ) : (
            notes.map((n) => (
              <div className="note-card" key={n.jegyzet_id}>
                <div className="note-card__date">
                  {formatDate(n.mikor_irta)}
                </div>

                <h3>{n.cim}</h3>
                <p className="note-card__text">
                  {n.szoveg || <em>(nincs szöveg)</em>}
                </p>

                <div className="note-card__actions">
                  <button onClick={() => startEdit(n)}>✏️</button>
                  <button onClick={() => deleteNote(n.jegyzet_id)}>🗑</button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default Notes;
