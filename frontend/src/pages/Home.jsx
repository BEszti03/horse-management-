import Header from "../components/Header";
import TaskList from "../components/TaskList";
import "./Home.css";

function Home() {
  return (
    <div>
      <Header />

      <main className="main-layout">
        <TaskList />

        <section className="content">
          <h1>Hello Felhasználó!</h1>
        </section>
      </main>
    </div>
  );
}

export default Home;