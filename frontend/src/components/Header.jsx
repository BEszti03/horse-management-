import { useNavigate } from "react-router-dom";
import Menu from "./Menu";
import "./Header.css";
import logo from "../assets/logo.png";

function Header() {
  const navigate = useNavigate();

  function handleLogoClick() {
    navigate("/home");
  }

  return (
    <header className="header">
      <div className="logo" onClick={handleLogoClick}>
        <img src={logo} alt="Horse-Time Management logo" />
      </div>

      <Menu />
    </header>
  );
}

export default Header;
