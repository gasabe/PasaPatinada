const RING = "A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z".split(" ");

export default function Letters() {
  return (
    <div className="letters-wrap">
      <div className="letters-inner">
        {RING.map((L, i) => (
          <button
            key={L}
            className={`key ${i === 0 ? "key--active" : ""}`} // A activa a modo demo
            type="button"
          >
            {L}
          </button>
        ))}
      </div>
      <div className="baseline" />
    </div>
  );
}
