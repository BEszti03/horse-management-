import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Auth.css";

function Login({
  embedded = false,
  onSwitchTab,
  embeddedSuccessMsg = "",
  clearEmbeddedSuccessMsg,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  //nem-embedded success (route state-ből)
  useEffect(() => {
    if (location.state?.successMsg) {
      setSuccessMsg(location.state.successMsg);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  //embedded success (MainPage flash-ből)
  useEffect(() => {
    if (embeddedSuccessMsg) {
      setSuccessMsg(embeddedSuccessMsg);
      clearEmbeddedSuccessMsg?.();
    }
  }, [embeddedSuccessMsg, clearEmbeddedSuccessMsg]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email.trim() || !password.trim()) {
      setError("Email és jelszó megadása kötelező.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          jelszo: password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Sikertelen bejelentkezés.");
        return;
      }

      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

      localStorage.setItem("htm_logged_in", "true");

      navigate("/home");
    } catch (err) {
      setError("Nem érem el a backendet. Fut a backend a 5000-es porton?");
    } finally {
      setLoading(false);
    }
  }

  const content = (
    <>
      <h2 className="auth__title">Bejelentkezés</h2>
      <p className="auth__subtitle">Lépj be a teendők kezeléséhez</p>

      {successMsg && <div className="auth__success">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="auth__form">
        <label className="auth__label">
          Email
          <input
            className="auth__input"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
              setSuccessMsg("");
            }}
            placeholder="pl. anna@email.hu"
          />
        </label>

        <label className="auth__label">
          Jelszó
          <input
            className="auth__input"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
              setSuccessMsg("");
            }}
            placeholder="••••••••"
          />
        </label>

        {error && <div className="auth__error">{error}</div>}

        <button className="auth__button" type="submit" disabled={loading}>
          {loading ? "Beléptetés..." : "Belépés"}
        </button>
      </form>
    </>
  );

  if (embedded) return content;

  return (
    <div className="auth">
      <div className="auth__card">{content}</div>
    </div>
  );
}

export default Login;
