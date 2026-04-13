import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const isCompetitionManager = isAdmin || user?.szerepkor === "lovarda_vezeto";

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

  function renderMenuItems(onItemClick) {
    return (
      <>
        <Link className="menu__item" to="/profile" onClick={onItemClick}>
          Felhasználó adatok
        </Link>

        <Link className="menu__item" to="/horses" onClick={onItemClick}>
          Ló adatok
        </Link>

        <Link className="menu__item" to="/notes" onClick={onItemClick}>
          Jegyzetek
        </Link>

        <Link className="menu__item" to="/calendar" onClick={onItemClick}>
          Naptár
        </Link>

        {isCompetitionManager && (
          <Link className="menu__item" to="/competitions" onClick={onItemClick}>
            Versenyek
          </Link>
        )}

        {isAdmin && (
          <Link className="menu__item" to="/admin" onClick={onItemClick}>
            Admin felület
          </Link>
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

      <button className="menu__button" onClick={() => setOpen((v) => !v)}>
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