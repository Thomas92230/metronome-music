"use client";

import { useEffect, useState } from "react";
import { onBeat } from "../audio/metronomeEngine";

const BEATS_PER_BAR = 4;

export default function BeatVisualizer() {
  const [beat, setBeat] = useState<number | null>(null);

  useEffect(() => {
    // Correction : suppression de _isAccent qui générait une erreur ESLint
    const unsubscribe = onBeat((currentBeat) => {
      if (process.env.NODE_ENV === "development") {
        performance.mark("beat-ui");
      }

      setBeat(currentBeat);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 🔒 Rien n'est rendu avant le premier beat réel
  if (beat === null) return null;

  return (
    <div className="flex justify-center py-6">
      <div className="relative w-40 h-40">
        {Array.from({ length: BEATS_PER_BAR }).map((_, i) => {
          const angle = (i / BEATS_PER_BAR) * 360;
          const active = i === beat;

          return (
            <div
              key={i}
              className={`
                absolute top-1/2 left-1/2
                w-4 h-4 rounded-full
                transition-all
                ${active ? "bg-red-500 scale-150" : "bg-zinc-400"}
              `}
              style={{
                transform: `
                  rotate(${angle}deg)
                  translate(70px)
                  rotate(-${angle}deg)
                `,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}