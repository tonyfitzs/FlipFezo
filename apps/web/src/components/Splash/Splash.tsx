import React, { useEffect, useMemo, useState } from "react";
import "./splash.css";

type Step =
  | "BLACK"
  | "DIAMOND_IN"
  | "HALO_IN"
  | "LINES_IN"
  | "DOLLAR_IN"
  | "PROCESS_IN"
  | "IDLE";

export default function Splash() {
  const [step, setStep] = useState<Step>("BLACK");
  const [activeNode, setActiveNode] = useState<number>(0);

  // Timeline aligned to your spec:
  // 0–100ms black
  // 100–900ms diamond fades in
  // 1150–1450ms halo fades in (250ms after diamond fully exposed)
  // then lines + dollar
  // then process nodes
  const timeline = useMemo(
    () => [
      { at: 0, step: "BLACK" as const },
      { at: 100, step: "DIAMOND_IN" as const },
      { at: 1150, step: "HALO_IN" as const },
      { at: 1450, step: "LINES_IN" as const },
      { at: 1600, step: "DOLLAR_IN" as const },
      { at: 2150, step: "PROCESS_IN" as const },
      { at: 2750, step: "IDLE" as const },
    ],
    []
  );

  useEffect(() => {
    const timers: number[] = [];
    timeline.forEach((t) => {
      timers.push(
        window.setTimeout(() => setStep(t.step), t.at)
      );
    });
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [timeline]);

  // Loop pulse: Fezo → $ → Upgrade → Profit → Fezo ...
  useEffect(() => {
    if (step !== "IDLE") return;
    const id = window.setInterval(() => {
      setActiveNode((n) => (n + 1) % 4);
    }, 2000);
    return () => window.clearInterval(id);
  }, [step]);

  return (
    <div className={`splash ${step}`}>
      {/* Layer stack */}
      <div className="stack">
        <img className="layer diamond" src="/splash/diamond.png" alt="" />
        <img className="layer halo screen" src="/splash/halo.png" alt="" />
        <img className="layer lines screen" src="/splash/lines.png" alt="" />
        <img className="layer dollar" src="/splash/dollar.png" alt="" />
      </div>

      {/* Process row */}
      <div className="process">
        <div className={`node ${step === "PROCESS_IN" || step === "IDLE" ? "in" : ""} ${activeNode === 0 ? "active" : ""}`}>
          <span className="icon">Fezo</span>
        </div>
        <div className={`node ${step === "PROCESS_IN" || step === "IDLE" ? "in" : ""} ${activeNode === 1 ? "active" : ""}`}>
          <span className="icon">$</span>
        </div>
        <div className={`node ${step === "PROCESS_IN" || step === "IDLE" ? "in" : ""} ${activeNode === 2 ? "active" : ""}`}>
          <span className="icon">Upgrade</span>
        </div>
        <div className={`node ${step === "PROCESS_IN" || step === "IDLE" ? "in" : ""} ${activeNode === 3 ? "active" : ""}`}>
          <span className="icon">Profit</span>
        </div>
      </div>
    </div>
  );
}
