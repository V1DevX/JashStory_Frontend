import { useEffect, useRef } from "react";

const MOCK_CARDS = [
  { id: 1, color: "#E63946", label: "Карточка 1", sub: "Красная" },
  { id: 2, color: "#457B9D", label: "Карточка 2", sub: "Синяя" },
  { id: 3, color: "#2A9D8F", label: "Карточка 3", sub: "Бирюзовая" },
  { id: 4, color: "#E9C46A", label: "Карточка 4", sub: "Жёлтая" },
  { id: 5, color: "#F4A261", label: "Карточка 5", sub: "Оранжевая" },
  { id: 6, color: "#8338EC", label: "Карточка 6", sub: "Фиолетовая" },
];

// Slight individual tilt per card, как разбросанные фото
const CARD_TILTS = [-6, 4, -3, 7, -5, 3];

const CARD_W = 170;
const CARD_H = 220;
const RADIUS = 300;
const TILT_X = 18; // наклон всей карусели по X
const SPEED = 0.12; // градусов за кадр

const TestStyle = () => {
  const stageRef = useRef(null);
  const angleRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const animate = () => {
      angleRef.current -= SPEED;
      if (stageRef.current) {
        stageRef.current.style.transform =
          `rotateX(${TILT_X}deg) rotateY(${angleRef.current}deg)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const total = MOCK_CARDS.length;
  const angleStep = 360 / total;

  return (
    <div
      className="bg-GrayBg py-12 px-4 flex flex-col items-center overflow-hidden select-none"
    >
      <h2 className="text-white font-unbounded font-medium text-4xl md:text-5xl mb-14 self-start md:ml-10">
        СТАТЬИ
      </h2>

      {/* Perspective wrapper */}
      <div
        style={{
          perspective: "900px",
          width: "100%",
          height: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Вращающийся диск */}
        <div
          ref={stageRef}
          style={{
            position: "relative",
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `rotateX(${TILT_X}deg) rotateY(0deg)`,
          }}
        >
          {MOCK_CARDS.map((card, i) => {
            const angle = i * angleStep;
            const tiltZ = CARD_TILTS[i] ?? 0;
            return (
              <div
                key={card.id}
                style={{
                  position: "absolute",
                  width: CARD_W,
                  height: CARD_H,
                  left: -CARD_W / 2,
                  top: -CARD_H / 2,
                  transform: `rotateY(${angle}deg) translateZ(${RADIUS}px) rotateZ(${tiltZ}deg)`,
                  borderRadius: 12,
                  background: card.color,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                }}
              >
                <span style={{ fontSize: 36 }}>🃏</span>
                <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>
                  {card.label}
                </span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                  {card.sub}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestStyle;
