import { useNavigate } from "react-router-dom";
import Menu from "./Menu";
import "./Header.css";

function Header() {
  const navigate = useNavigate();

  function handleLogoClick() {
    navigate("/home");
  }

  return (
    <header className="header">
      <div className="logo" onClick={handleLogoClick}>
        LOGO
      </div>

      <Menu />
    </header>
  );
}

export default Header;
