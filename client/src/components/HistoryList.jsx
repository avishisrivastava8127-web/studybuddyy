export default function HistoryList({ history, onOpen }) {
  if (!history || history.length === 0) return null; // render nothing at all

  return (
    <div className="card">
      <div className="card-head">
        <h2>Recent sessions</h2>
      </div>
      <ul className="history">
        {history.map((item) => (
          <li key={item.id}>
            <button className="history-item" onClick={() => onOpen(item)}>
              <span>{item.title}</span>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
