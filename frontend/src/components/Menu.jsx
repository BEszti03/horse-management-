import { useState } from "react";

function Menu() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)}>
        Menü
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.item}>Felhasználó adatok</div>
          <div style={styles.item}>Ló adatok</div>
          <div style={styles.item}>Naptár</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  dropdown: {
    position: "absolute",
    top: "40px",
    right: 0,
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    width: "180px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    zIndex: 1000
  },
  item: {
    padding: "10px",
    cursor: "pointer",
    borderBottom: "1px solid #eee"
  }
};

export default Menu;