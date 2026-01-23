import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

function Login({ embedded = false, onSwitchTab }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email és jelszó megadása kötelező.");
      return;
    }

    // MVP "login"
    localStorage.setItem("htm_logged_in", "true");
    navigate("/home");
  }

  const content = (
    <>
      <h2 className="auth__title">Bejelentkezés</h2>
      <p className="auth__subtitle">Lépj be a teendők kezeléséhez</p>

      {error && <div className="auth__error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth__form">
        <label className="auth__label">
          Email
          <input
            className="auth__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pl. anna@email.hu"
          />
        </label>

        <label className="auth__label">
          Jelszó
          <input
            className="auth__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <button className="auth__button" type="submit">
          Belépés
        </button>
      </form>

      <div className="auth__footer">
        Nincs még fiókod?{" "}
        {embedded ? (
          <button
            type="button"
            className="auth__linkButton"
            onClick={() => onSwitchTab?.("register")}
          >
            Regisztráció
          </button>
        ) : (
          <Link to="/register">Regisztráció</Link>
        )}
      </div>
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
