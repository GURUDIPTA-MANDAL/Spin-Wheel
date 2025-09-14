import React, { useState, useRef, useEffect } from "react";

export default function SpinWheel() {
  const canvasRef = useRef(null);
  const tickSoundRef = useRef(null);
  const winSoundRef = useRef(null);

  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [confettiParticles, setConfettiParticles] = useState([]);

  const radius = 150;
  const colors = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#6A4C93", "#1A535C"];
  const sliceAngle = entries.length > 0 ? (2 * Math.PI) / entries.length : 0;
  const offset = -Math.PI / 2;

  useEffect(() => {
    tickSoundRef.current = new Audio(
      "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
    );
    winSoundRef.current = new Audio(
      "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"
    );
  }, []);

  useEffect(() => {
    drawWheel();
  }, [entries, rotation, winner, confettiParticles]);

  // Draw the wheel
  const drawWheel = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (entries.length === 0) return;

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(rotation);

    entries.forEach((entry, i) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, i * sliceAngle + offset, (i + 1) * sliceAngle + offset);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      if (winner === entry) {
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      const angle = i * sliceAngle + sliceAngle / 2 + offset;
      ctx.rotate(angle);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "black";
      ctx.font = "bold 16px Arial";
      ctx.fillText(entry, radius * 0.6, 0);
      ctx.restore();
    });

    // Center button
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, 2 * Math.PI);
    ctx.fillStyle = "#1A535C";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "white";
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(spinning ? "..." : "START", 0, 0);

    // Pointer
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(0, -radius + 5);
    ctx.lineTo(-10, -radius + 25);
    ctx.lineTo(10, -radius + 25);
    ctx.closePath();
    ctx.fill();

    // Draw confetti
    confettiParticles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.restore();
  };

  const handleAddEntry = () => {
    if (newEntry.trim() !== "") {
      setEntries([...entries, newEntry.trim()]);
      setNewEntry("");
    }
  };

  const handleRemoveEntry = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
  };

  const handleSpin = () => {
    if (spinning || entries.length === 0) return;
    setSpinning(true);
    setWinner(null);
    setConfettiParticles([]);

    const spins = 5;
    const randomIndex = Math.floor(Math.random() * entries.length);
    const targetRotation =
      spins * 2 * Math.PI + randomIndex * sliceAngle + sliceAngle / 2;

    let start = null;
    const duration = 6000;
    let lastTickSlice = -1;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRotation = targetRotation * eased;
      setRotation(currentRotation);

      const currentSlice = Math.floor(
        (((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / sliceAngle
      );
      if (currentSlice !== lastTickSlice) {
        if (tickSoundRef.current) {
          const tick = tickSoundRef.current.cloneNode();
          tick.play();
        }
        lastTickSlice = currentSlice;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setWinner(entries[randomIndex]);
        if (winSoundRef.current) {
          const win = winSoundRef.current.cloneNode();
          win.play();
        }
        launchConfetti();
      }
    };

    requestAnimationFrame(animate);
  };

  // Confetti effect
  const launchConfetti = () => {
    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: radius,
        y: radius,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * -6 - 2,
        gravity: 0.2,
        size: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setConfettiParticles(particles);
    animateConfetti(particles, 0);
  };

  const animateConfetti = (particles, frame) => {
    const updated = particles.map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + p.gravity,
    }));
    setConfettiParticles(updated);

    if (frame < 60) {
      requestAnimationFrame(() => animateConfetti(updated, frame + 1));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAddEntry();
  };

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - radius;
    const y = e.clientY - rect.top - radius;
    const distance = Math.sqrt(x * x + y * y);
    if (distance <= 40) handleSpin();
  };

  return (
    <div
      style={{
        background: "#222",
        color: "white",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px",
      }}
    >
      <h1>🎡 Spin the Wheel</h1>

      <div style={{ marginBottom: "10px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
        <input
          type="text"
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add entry..."
          style={{ padding: "5px", fontSize: "16px" }}
        />
        <button
          onClick={handleAddEntry}
          style={{
            padding: "6px 12px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </div>

      {/* Entries list */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>
        {entries.map((entry, index) => (
          <div
            key={index}
            style={{
              background: "#444",
              padding: "4px 8px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span>{entry}</span>
            <button
              onClick={() => handleRemoveEntry(index)}
              style={{
                background: "red",
                border: "none",
                color: "white",
                borderRadius: "3px",
                cursor: "pointer",
                padding: "2px 6px",
                fontSize: "12px",
              }}
            >
              X
            </button>
          </div>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={radius * 2}
        height={radius * 2}
        style={{ borderRadius: "50%", background: "#111", cursor: "pointer" }}
        onClick={handleCanvasClick}
      ></canvas>

      {winner && (
        <h2 style={{ animation: "pop 1s ease-out", marginTop: "15px" }}>
          🏆 Winner: {winner}
        </h2>
      )}

      <style>
        {`
          @keyframes pop {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
}
