import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

function Register({ embedded = false, onSwitchTab }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim() || !password2.trim()) {
      setError("Minden mező kitöltése kötelező.");
      return;
    }

    if (password !== password2) {
      setError("A két jelszó nem egyezik.");
      return;
    }

    // MVP "register" (később backend)
    // Siker után: vissza loginra
    if (embedded) {
      onSwitchTab?.("login");
    } else {
      navigate("/login");
    }
  }

  const content = (
    <>
      <h2 className="auth__title">Regisztráció</h2>
      <p className="auth__subtitle">Hozz létre fiókot a használathoz</p>

      {error && <div className="auth__error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth__form">
        <label className="auth__label">
          Név
          <input
            className="auth__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="pl. Kovács Anna"
          />
        </label>

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

        <label className="auth__label">
          Jelszó megerősítése
          <input
            className="auth__input"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <button className="auth__button" type="submit">
          Regisztráció
        </button>
      </form>

      <div className="auth__footer">
        Van már fiókod?{" "}
        {embedded ? (
          <button
            type="button"
            className="auth__linkButton"
            onClick={() => onSwitchTab?.("login")}
          >
            Bejelentkezés
          </button>
        ) : (
          <Link to="/login">Bejelentkezés</Link>
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

export default Register;
