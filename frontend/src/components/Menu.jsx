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

  return (
    <div className="menu" ref={containerRef}>
      <button className="menu__button" onClick={() => setOpen((v) => !v)}>
        Menü
      </button>

      {open && (
        <div className="menu__dropdown">
          <Link className="menu__item" to="/profile" onClick={() => setOpen(false)}>
            Felhasználó adatok
          </Link>

          <Link className="menu__item" to="/horses" onClick={() => setOpen(false)}>
            Ló adatok
          </Link>

          <Link className="menu__item" to="/notes" onClick={() => setOpen(false)}>
            Jegyzetek
          </Link>

          <Link className="menu__item" to="/calendar" onClick={() => setOpen(false)}>
            Naptár
          </Link>

          {user?.szerepkor === "admin" && (
            <Link className="menu__item" to="/admin" onClick={() => setOpen(false)}>
              Admin felület
            </Link>
          )}

          <button type="button" className="menu__item menu__logout" onClick={handleLogout}>
            Kijelentkezés
          </button>
        </div>
      )}
    </div>
  );
}

export default Menu;