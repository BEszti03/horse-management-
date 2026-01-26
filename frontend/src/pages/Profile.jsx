import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data?.message || "Nem sikerült lekérni a profil adatokat.");
          setUser(null);
          return;
        }

        setUser(data.user);

        // opcionális: frissítjük a localStorage-ben lévő user-t is
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (e) {
        setError("Nem érem el a backendet. Fut a backend a 5000-es porton?");
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, [navigate]);

  return (
    <div>
      <Header />
      <main style={{ padding: "24px", maxWidth: 720, margin: "0 auto" }}>
        <h1>Felhasználó adatok</h1>

        {loading && <p>Betöltés...</p>}

        {error && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#ffe6e6" }}>
            {error}
          </div>
        )}

        {!loading && !error && user && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 12, border: "1px solid #ddd" }}>
            <p>
              <b>Név:</b> {user.nev}
            </p>
            <p>
              <b>Email:</b> {user.email}
            </p>
            <p>
              <b>Lovarda:</b> {user.lovarda_nev ? user.lovarda_nev : "Nincs beállítva"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Profile;
