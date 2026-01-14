"use client";

import React, { useState, useEffect } from "react";

export function VolumeControl({ onChange }: { onChange: (v: number) => void }) {
  // On initialise à 50 (soit 0.5 pour le moteur)
  const [vol, setVol] = useState(50);

  // Correction : Envoyer la valeur initiale au moteur au démarrage du composant
  useEffect(() => {
    onChange(vol / 100);
  }, []); 

  const updateVolume = (value: number) => {
    setVol(value);
    onChange(value / 100);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Visualisation des barres cliquables pour une meilleure interactivité */}
      <div className="flex items-end gap-[2px] h-12 cursor-pointer">
        {[...Array(10)].map((_, i) => {
          const barValue = (i + 1) * 10;
          return (
            <div 
              key={i}
              onClick={() => updateVolume(barValue)}
              className={`w-2 rounded-t-sm transition-all duration-200 ${
                vol >= barValue 
                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' 
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
              style={{ height: `${barValue}%` }}
            />
          );
        })}
      </div>

      <input 
        type="range" 
        min="0" 
        max="100" 
        value={vol} 
        onChange={(e) => updateVolume(Number(e.target.value))}
        className="w-24 accent-cyan-400 cursor-pointer"
      />

      <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
        Volume
      </span>
    </div>
  );
}