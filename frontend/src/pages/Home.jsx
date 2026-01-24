import { useEffect, useState } from "react";
import Header from "../components/Header";
import TaskList from "../components/TaskList";
import "./Home.css";

function Home() {
  const [backendMessage, setBackendMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/hello")
      .then((res) => res.json())
      .then((data) => setBackendMessage(data.message))
      .catch(() => setBackendMessage("Backend nem elérhető"));
  }, []);

  return (
    <div>
      <Header />

      <main className="main-layout">
        <TaskList />

        <section className="content">
          <h1>Hello Felhasználó!</h1>

          {/* Backend státusz – teszteléshez */}
          {backendMessage && (
            <p className="backend-status">
              {backendMessage}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;
