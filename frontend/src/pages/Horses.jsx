import { useEffect, useState, useCallback } from "react";
import Header from "../components/Header";
import { apiFetch } from "../utils/api";
import "./Horses.css";

function Horses() {
  const [horses, setHorses] = useState([]);
  const [activeSection, setActiveSection] = useState("my-horses");
  const token = localStorage.getItem("token");

  const [nev, setNev] = useState("");
  const [fajta, setFajta] = useState("");
  const [szuletesiIdo, setSzuletesiIdo] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editNev, setEditNev] = useState("");
  const [editFajta, setEditFajta] = useState("");
  const [editSzuletesiIdo, setEditSzuletesiIdo] = useState("");
  const [uploadingImageId, setUploadingImageId] = useState(null);
  const [deletingImageId, setDeletingImageId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function hasUploadedHorseImage(kepUrl) {
    return Boolean(kepUrl && String(kepUrl).startsWith("/uploads/horses/"));
  }

  const fetchHorses = useCallback(async () => {
    setError("");
    try {
      const data = await apiFetch("/api/horses");
      setHorses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Nem sikerült kapcsolódni a szerverhez.");
    }
  }, []);

  useEffect(() => {
    fetchHorses();
  }, [fetchHorses]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiFetch("/api/horses", {
        method: "POST",
        body: JSON.stringify({
          nev,
          fajta,
          szuletesi_ido: szuletesiIdo,
        }),
      });

      setMessage("Ló sikeresen hozzáadva!");
      setNev("");
      setFajta("");
      setSzuletesiIdo("");
      setActiveSection("my-horses");
      fetchHorses();
    } catch (err) {
      setError(err?.message || "Nem sikerült kapcsolódni a szerverhez.");
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
      await apiFetch(`/api/horses/${loId}`, {
        method: "PUT",
        body: JSON.stringify({
          nev: editNev,
          fajta: editFajta,
          szuletesi_ido: editSzuletesiIdo || null,
        }),
      });

      setMessage("Ló sikeresen frissítve!");
      cancelEdit();
      fetchHorses();
    } catch (err) {
      setError(err?.message || "Nem sikerült kapcsolódni a szerverhez.");
    }
  }

  async function handleDelete(loId) {
    setError("");
    setMessage("");

    const ok = window.confirm("Biztosan törlöd ezt a lovat?");
    if (!ok) return;

    try {
      await apiFetch(`/api/horses/${loId}`, { method: "DELETE" });

      setMessage("Ló törölve!");
      if (editingId === loId) cancelEdit();
      fetchHorses();
    } catch (err) {
      setError(err?.message || "Nem sikerült kapcsolódni a szerverhez.");
    }
  }

  async function handleHorseImageUpload(loId, e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setMessage("");
      setUploadingImageId(loId);

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`http://localhost:5000/api/horses/${loId}/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Sikertelen kép feltöltés.");
      }

      if (data?.lo) {
        setHorses((prev) => prev.map((h) => (h.lo_id === loId ? data.lo : h)));
      } else {
        fetchHorses();
      }

      setMessage("Lókép sikeresen feltöltve.");
    } catch (err) {
      setError(err?.message || "Nem sikerült feltölteni a képet.");
    } finally {
      setUploadingImageId(null);
      e.target.value = "";
    }
  }

  async function handleHorseImageDelete(loId) {
    const ok = window.confirm("Biztosan törlöd a képet?");
    if (!ok) return;

    try {
      setError("");
      setMessage("");
      setDeletingImageId(loId);

      const response = await fetch(`http://localhost:5000/api/horses/${loId}/image`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Sikertelen kép törlés.");
      }

      if (data?.lo) {
        setHorses((prev) => prev.map((h) => (h.lo_id === loId ? data.lo : h)));
      } else {
        fetchHorses();
      }

      setMessage(data.message || "Kép törölve.");
    } catch (err) {
      setError(err?.message || "Nem sikerült törölni a képet.");
    } finally {
      setDeletingImageId(null);
    }
  }

  return (
    <div className="horsesPage">
      <Header />

      <main className="horsesMain">
        <div className="horsesHeader">
          <h1 className="horsesTitle">Ló adatok</h1>
        </div>

        {message && <div className="horsesAlert horsesAlertSuccess">{message}</div>}
        {error && <div className="horsesAlert horsesAlertError">{error}</div>}

        <div className="horsesLayout">
          <aside className="horsesSidebar">
            <h3 className="horsesSidebarTitle">Műveletek</h3>
            <div className="horsesSidebarNav">
              <button
                className={`horsesSidebarItem ${activeSection === "my-horses" ? "is-active" : ""}`}
                onClick={() => setActiveSection("my-horses")}
                type="button"
              >
                Saját lovaim
              </button>
              <button
                className={`horsesSidebarItem ${activeSection === "create-horse" ? "is-active" : ""}`}
                onClick={() => setActiveSection("create-horse")}
                type="button"
              >
                Új ló felvitel
              </button>
            </div>
          </aside>

          <section className="horsesContent">
            {activeSection === "my-horses" ? (
              <section className="horsesCard">
                <div className="cardHeader">
                  <h2 className="cardTitle">Saját lovaim</h2>
                  <p className="cardHint">
                    A listában szerkesztheted az adatokat, vagy törölheted a lovat.
                  </p>
                </div>

                {horses.length === 0 ? (
                  <p className="horsesEmpty">Még nincs felvett ló.</p>
                ) : (
                  <ul className="horsesList">
                    {horses.map((lo) => {
                      const uploadedImage = hasUploadedHorseImage(lo.kep_url);
                      const horseImageSrc = uploadedImage
                        ? `http://localhost:5000${lo.kep_url}`
                        : "/default-horse.png";

                      return (
                        <li key={lo.lo_id} className="horseItem">
                          {editingId === lo.lo_id ? (
                            <div className="editBox">
                              <div className="horseImageSection">
                                <img className="horseAvatar" src={horseImageSrc} alt={`${lo.nev} képe`} />

                                <label className="btn btnSoft" htmlFor={`horse-image-${lo.lo_id}`}>
                                  {uploadingImageId === lo.lo_id ? "Feltöltés..." : "Kép feltöltése"}
                                </label>
                                <input
                                  id={`horse-image-${lo.lo_id}`}
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  disabled={uploadingImageId === lo.lo_id}
                                  onChange={(e) => handleHorseImageUpload(lo.lo_id, e)}
                                />

                                {uploadedImage ? (
                                  <button
                                    className="btn btnGhost"
                                    type="button"
                                    onClick={() => handleHorseImageDelete(lo.lo_id)}
                                    disabled={deletingImageId === lo.lo_id || uploadingImageId === lo.lo_id}
                                  >
                                    {deletingImageId === lo.lo_id ? "Törlés..." : "Kép törlése"}
                                  </button>
                                ) : null}
                              </div>

                              <div className="editGrid">
                                <label className="field">
                                  <span className="fieldLabel">Név</span>
                                  <input
                                    className="fieldInput"
                                    type="text"
                                    value={editNev}
                                    onChange={(e) => setEditNev(e.target.value)}
                                    required
                                  />
                                </label>

                                <label className="field">
                                  <span className="fieldLabel">Fajta</span>
                                  <input
                                    className="fieldInput"
                                    type="text"
                                    value={editFajta}
                                    onChange={(e) => setEditFajta(e.target.value)}
                                  />
                                </label>

                                <label className="field">
                                  <span className="fieldLabel">Születési dátum</span>
                                  <input
                                    className="fieldInput"
                                    type="date"
                                    value={editSzuletesiIdo}
                                    onChange={(e) => setEditSzuletesiIdo(e.target.value)}
                                  />
                                </label>
                              </div>

                              <div className="horsesActions horsesActionsSplit">
                                <button
                                  className="btn btnPrimary"
                                  type="button"
                                  onClick={() => handleUpdate(lo.lo_id)}
                                >
                                  Mentés
                                </button>
                                <button className="btn btnGhost" type="button" onClick={cancelEdit}>
                                  Mégse
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="horseRow">
                              <img className="horseThumb" src={horseImageSrc} alt={`${lo.nev} bélyegkép`} />

                              <div className="horseText">
                                <div className="horseName">
                                  {lo.nev}
                                  {lo.fajta ? <span className="horseMeta"> - {lo.fajta}</span> : null}
                                </div>
                                <div className="horseSub">
                                  {lo.szuletesi_ido ? (
                                    <span className="horseDate">{lo.szuletesi_ido.slice(0, 10)}</span>
                                  ) : (
                                    <span className="horseMuted">Nincs megadva születési dátum</span>
                                  )}
                                </div>
                              </div>

                              <div className="horseButtons">
                                <button className="btn btnSoft" type="button" onClick={() => startEdit(lo)}>
                                  Szerkesztés
                                </button>
                                <button
                                  className="btn btnDanger"
                                  type="button"
                                  onClick={() => handleDelete(lo.lo_id)}
                                >
                                  Törlés
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ) : (
              <section className="horsesCard">
                <div className="cardHeader">
                  <h2 className="cardTitle">Új ló felvétele</h2>
                  <p className="cardHint">Add meg a ló alapadatait, később bármikor módosíthatod.</p>
                </div>

                <form onSubmit={handleCreate} className="horsesForm">
                  <label className="field">
                    <span className="fieldLabel">Ló neve</span>
                    <input
                      className="fieldInput"
                      type="text"
                      placeholder="Pl. Csillag"
                      value={nev}
                      onChange={(e) => setNev(e.target.value)}
                      required
                    />
                  </label>

                  <label className="field">
                    <span className="fieldLabel">Fajta</span>
                    <input
                      className="fieldInput"
                      type="text"
                      placeholder="Pl. Magyar sportló"
                      value={fajta}
                      onChange={(e) => setFajta(e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span className="fieldLabel">Születési dátum</span>
                    <input
                      className="fieldInput"
                      type="date"
                      value={szuletesiIdo}
                      onChange={(e) => setSzuletesiIdo(e.target.value)}
                    />
                  </label>

                  <div className="horsesActions">
                    <button className="btn btnPrimary" type="submit">
                      Hozzáadás
                    </button>
                  </div>
                </form>
              </section>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Horses;
