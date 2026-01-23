import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Menu.css";


function Menu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Kattintás a menün kívül -> zárjon be
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
  // ESC lenyomása -> zárjon be
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
          <Link className="menu__item" to="/calendar" onClick={() => setOpen(false)}>
            Naptár
          </Link>
        </div>
      )}
    </div>
  );
}

export default Menu;
