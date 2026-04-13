import { useEffect, useState, useCallback } from "react";
import Header from "../components/Header";
import "./Notes.css";
import { apiFetch } from "../utils/api";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [cim, setCim] = useState("");
  const [szoveg, setSzoveg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchNotes = useCallback(async () => {
    try {
      const data = await apiFetch("/api/notes");
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotes([]);
      setError(err?.message || "Nem sikerült betölteni a jegyzeteket.");
    }
  }, []);

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

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/notes/${editingId}` : "/api/notes";

      await apiFetch(url, {
        method,
        body: JSON.stringify({ cim, szoveg }),
      });
    } catch (err) {
      setError(err?.message || "Mentés sikertelen.");
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

    try {
      await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
      fetchNotes();
    } catch (err) {
      setError(err?.message || "Törlés sikertelen.");
    }
  }

  return (
    <div className="notesPage">
      <Header />

      <main className="notes">
        <section className="notes__intro">
          <h1 className="notes__title">Jegyzetek</h1>
        </section>

        <section className="notes__form">
          <h2 className="notes__formTitle">{editingId ? "Jegyzet szerkesztése" : "Új jegyzet"}</h2>

          <form className="notes__formBody" onSubmit={handleSubmit}>
            <label className="notes__label" htmlFor="notes-cim">Cím</label>
            <input
              id="notes-cim"
              type="text"
              placeholder="Cím"
              value={cim}
              onChange={(e) => setCim(e.target.value)}
              required
            />

            <label className="notes__label" htmlFor="notes-szoveg">Leírás</label>
            <textarea
              id="notes-szoveg"
              placeholder="Ide írhatod a jegyzeted…"
              value={szoveg}
              onChange={(e) => setSzoveg(e.target.value)}
              rows={5}
            />

            <div className="notes__formActions">
              <button className="notes__btn notes__btn--primary" type="submit">
                {editingId ? "Mentés" : "Jegyzet hozzáadása"}
              </button>

              {editingId && (
                <button
                  className="notes__btn notes__btn--secondary"
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setCim("");
                    setSzoveg("");
                    setMessage("");
                    setError("");
                  }}
                >
                  Mégse
                </button>
              )}
            </div>
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
                <div className="note-card__top">
                  <h3>{n.cim}</h3>
                  <div className="note-card__date">{formatDate(n.mikor_irta)}</div>
                </div>

                <p className="note-card__text">
                  {n.szoveg || <em>(nincs szöveg)</em>}
                </p>

                <div className="note-card__actions">
                  <button className="note-card__action" onClick={() => startEdit(n)}>Szerkesztés</button>
                  <button className="note-card__action note-card__action--danger" onClick={() => deleteNote(n.jegyzet_id)}>
                    Törlés
                  </button>
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
