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
  const [email, setEmail] = useState("");
  const [lovardaId, setLovardaId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const [showAddStable, setShowAddStable] = useState(false);
  const [newStableName, setNewStableName] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
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
        setEmail(meData.user.email || "");
        setLovardaId(meData.user.lovarda_id ?? "");

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

      const wantsPasswordChange = Boolean(newPassword);
      if (wantsPasswordChange && newPassword !== newPasswordConfirm) {
        setError("Az új jelszó és a megerősítés nem egyezik.");
        return;
      }

      const data = await apiFetch("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({
          nev,
          email,
          lovarda_id: lovardaId === "" ? null : Number(lovardaId),
          current_password: wantsPasswordChange ? currentPassword : "",
          new_password: wantsPasswordChange ? newPassword : "",
        }),
      });

      setUser(data.user);
      setNev(data.user?.nev || "");
      setEmail(data.user?.email || "");
      setLovardaId(data.user?.lovarda_id ?? "");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setSuccess("Sikeres mentés!");
      setEditMode(false);

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsedUser,
              ...data.user,
            })
          );
        } catch {
          // nincs teendő
        }
      }
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

      if (data?.stable?.stable_id) {
        setLovardaId(String(data.stable.stable_id));
      }

      if (data?.user) {
        setUser((prev) => ({
          ...prev,
          ...data.user,
          lovarda_nev: data?.stable?.name || prev?.lovarda_nev,
        }));
        setNev(data.user.nev || "");
        setLovardaId(data.user.lovarda_id ?? "");
      }

      if (data?.token) {
        localStorage.setItem("token", data.token);
      }

      if (data?.user) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...data.user,
            lovarda_nev: data?.stable?.name || data?.user?.lovarda_nev || null,
          })
        );
      }
    } catch (err) {
      setError(err.message || "Lovarda felvitel hiba.");
    }
  }

  async function handleProfileImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("http://localhost:5000/api/users/profile/image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Sikertelen képfeltöltés.");
      }

      setUser((prev) => ({
        ...prev,
        profilkep_url: data.profilkep_url,
      }));

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsedUser,
              profilkep_url: data.profilkep_url,
            })
          );
        } catch {
          // nincs teendő
        }
      }

      setSuccess("Profilkép sikeresen feltöltve.");
    } catch (err) {
      setError(err.message || "Hiba történt a profilkép feltöltésekor.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  async function handleProfileImageDelete() {
    if (!user?.profilkep_url) return;

    const ok = window.confirm("Biztosan törlöd a profilképet?");
    if (!ok) return;

    try {
      setDeletingImage(true);
      setError("");
      setSuccess("");

      const response = await fetch("http://localhost:5000/api/users/profile/image", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Sikertelen profilkép törlés.");
      }

      setUser((prev) => ({
        ...prev,
        profilkep_url: null,
      }));

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsedUser,
              profilkep_url: null,
            })
          );
        } catch {
          // nincs teendő
        }
      }

      setSuccess(data.message || "Profilkép törölve.");
    } catch (err) {
      setError(err.message || "Hiba történt a profilkép törlésekor.");
    } finally {
      setDeletingImage(false);
    }
  }

  function roleLabel(r) {
    if (r === "admin") return "Admin";
    if (r === "lovarda_vezeto") return "Lovarda vezető";
    if (r === "lovas") return "Lovas";
    return r || "Nincs megadva";
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
            <div className="profileImageSection">
              <img
                className="profileAvatar"
                src={
                  user.profilkep_url
                    ? `http://localhost:5000${user.profilkep_url}`
                    : "/default-avatar.png"
                }
                alt="Profilkép"
              />

              {editMode ? (
                <>
                  <label className="btn btnSoft profileUploadButton">
                    {uploadingImage ? "Feltöltés..." : "Profilkép feltöltése"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      hidden
                    />
                  </label>

                  {user.profilkep_url ? (
                    <button
                      className="btn btnGhost"
                      type="button"
                      onClick={handleProfileImageDelete}
                      disabled={deletingImage || uploadingImage}
                    >
                      {deletingImage ? "Törlés..." : "Profilkép törlése"}
                    </button>
                  ) : null}
                </>
              ) : (
                <span className="fieldHint">Profilkép módosításához kattints a Profil szerkesztése gombra.</span>
              )}
            </div>

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
                    <span className="fieldLabel">Email</span>
                    <input
                      className="fieldInput"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Add meg az emailed"
                      autoComplete="email"
                    />
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
                    <strong>Jelszó módosítása</strong>
                  </div>

                  <label className="field">
                    <span className="fieldLabel">Jelenlegi jelszó</span>
                    <input
                      className="fieldInput"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Csak jelszóváltás esetén kötelező"
                      autoComplete="current-password"
                    />
                  </label>

                  <label className="field">
                    <span className="fieldLabel">Új jelszó</span>
                    <input
                      className="fieldInput"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 karakter"
                      autoComplete="new-password"
                    />
                  </label>

                  <label className="field">
                    <span className="fieldLabel">Új jelszó megerősítése</span>
                    <input
                      className="fieldInput"
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder="Írd be újra az új jelszót"
                      autoComplete="new-password"
                    />
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
                      setEmail(user.email || "");
                      setLovardaId(user.lovarda_id ?? "");
                      setCurrentPassword("");
                      setNewPassword("");
                      setNewPasswordConfirm("");
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