import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Menu.css";

function Menu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  const isAdmin = user?.szerepkor === "admin";
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("htm_logged_in");

    setOpen(false);
    navigate("/", { replace: true });
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEsc(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  function getMenuItemClassName({ isActive }) {
    return isActive ? "menu__item menu__item--active" : "menu__item";
  }

  function renderMenuItems(onItemClick) {
    return (
      <>
        <NavLink className={getMenuItemClassName} to="/profile" onClick={onItemClick}>
          Felhasználó adatok
        </NavLink>

        <NavLink className={getMenuItemClassName} to="/horses" onClick={onItemClick}>
          Ló adatok
        </NavLink>

        <NavLink className={getMenuItemClassName} to="/notes" onClick={onItemClick}>
          Jegyzetek
        </NavLink>

        <NavLink className={getMenuItemClassName} to="/calendar" onClick={onItemClick}>
          Naptár
        </NavLink>

        <NavLink className={getMenuItemClassName} to="/competitions" onClick={onItemClick}>
          Versenyek
        </NavLink>

        {isAdmin && (
          <NavLink className={getMenuItemClassName} to="/admin" onClick={onItemClick}>
            Admin felület
          </NavLink>
        )}

        <button type="button" className="menu__item menu__logout" onClick={handleLogout}>
          Kijelentkezés
        </button>
      </>
    );
  }

  return (
    <div className="menu" ref={containerRef}>
      <nav className="menu__inline" aria-label="Fő navigáció">
        {renderMenuItems()}
      </nav>

      <button
        className="menu__button"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menü megnyitása"
      >
        Menü
      </button>

      {open && (
        <div className="menu__dropdown">
          {renderMenuItems(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export default Menu;