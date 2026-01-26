import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Register({ embedded = false, onSwitchTab }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // mezőnkénti hibák
  const [errors, setErrors] = useState({});

  function validate() {
    const nextErrors = {};

    if (!name.trim()) nextErrors.name = "A név megadása kötelező.";
    if (!email.trim()) nextErrors.email = "Az email megadása kötelező.";
    if (!password.trim()) nextErrors.password = "A jelszó megadása kötelező.";
    if (!password2.trim()) nextErrors.password2 = "A jelszó megerősítése kötelező.";

    if (password && password2 && password !== password2) {
      nextErrors.password = "A két jelszó nem egyezik.";
    }

    return nextErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    // MVP "register" (később backend)
    if (embedded) {
      onSwitchTab?.("login");
    } else {
      navigate("/login");
    }
  }

  const content = (
    <>
      <h2 className="auth__title">Regisztráció</h2>
      <p className="auth__subtitle">Hozd létre fiókod</p>

      <form onSubmit={handleSubmit} className="auth__form">
        <label className="auth__label">
          Név
          <input
            className={`auth__input ${errors.name ? "auth__input--error" : ""}`}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="pl. Kovács Anna"
          />
          {errors.name && <div className="auth__fieldError">{errors.name}</div>}
        </label>

        <label className="auth__label">
          Email
          <input
            className={`auth__input ${errors.email ? "auth__input--error" : ""}`}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            placeholder="pl. anna@email.hu"
          />
          {errors.email && <div className="auth__fieldError">{errors.email}</div>}
        </label>

        <label className="auth__label">
          Jelszó
          <input
            className={`auth__input ${errors.password ? "auth__input--error" : ""}`}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder="••••••••"
          />
          {errors.password && <div className="auth__fieldError">{errors.password}</div>}
        </label>

        <label className="auth__label">
          Jelszó megerősítése
          <input
            className={`auth__input ${errors.password2 ? "auth__input--error" : ""}`}
            type="password"
            value={password2}
            onChange={(e) => {
              setPassword2(e.target.value);
              setErrors((prev) => ({ ...prev, password2: "" }));
            }}
            placeholder="••••••••"
          />
          {errors.password2 && <div className="auth__fieldError">{errors.password2}</div>}
        </label>

        <button className="auth__button" type="submit">
          Regisztráció
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

export default Register;
