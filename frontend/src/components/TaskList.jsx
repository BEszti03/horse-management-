import "./TaskList.css";

function TaskList() {
  const tasks = [
    "Teendő 1",
    "Teendő 2",
    "Teendő 3",
    "Teendő 4"
  ];

  return (
    <aside className="tasklist">
      <h3>Közelgő teendők:</h3>
      <ul>
        {tasks.map((task, index) => (
          <li key={index}>{task}</li>
        ))}
      </ul>
    </aside>
  );
}

export default TaskList;