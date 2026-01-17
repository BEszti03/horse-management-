import Menu from "./Menu";

function Header() {
  return (
    <header style={styles.header}>
      <div>LOGO</div>
      <Menu />
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    borderBottom: "1px solid #ddd"
  }
};

export default Header;