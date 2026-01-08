"use client";

import { useState, useEffect } from "react";
import * as Engine from "../audio/metronomeEngine";
import { loadPresets, savePresets } from "../utils/presets";
import { Preset } from "../types/preset";

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [subdivision] = useState<"quarter" | "eighth" | "triplet">("quarter");

  // ✅ CORRECTION : Initialisation directe pour éviter le setState dans useEffect
  const [presets, setPresets] = useState<Preset[]>(() => {
    // Cette fonction ne s'exécute qu'une seule fois au démarrage
    if (typeof window !== "undefined") {
      return loadPresets();
    }
    return [];
  });

  const [rampEnabled, setRampEnabled] = useState(false);
  const [targetBpm, setTargetBpm] = useState(160);
  const [step] = useState(5);
  const [everyBars, setEveryBars] = useState(4);

  // Synchronisation de la rampe avec le moteur (Pas de setState ici, donc pas d'erreur)
  useEffect(() => {
    Engine.setTempoRamp({
      enabled: rampEnabled,
      targetBpm: targetBpm,
      step: step,
      everyBars: everyBars,
    });
  }, [rampEnabled, targetBpm, step, everyBars]);

  const toggleMetronome = () => {
    if (isPlaying) {
      Engine.stopMetronome();
    } else {
      Engine.startMetronome(bpm);
    }
    setIsPlaying(!isPlaying);
  };

  const handleBpmChange = (value: number) => {
    setBpm(value);
    Engine.setTempo(value);
  };

  const saveCurrentPreset = () => {
    const name = prompt("Nom du preset ?");
    if (!name) return;

    const newPreset: Preset = {
      name,
      bpm,
      beatsPerBar: 4,
      subdivision,
      tempoRamp: rampEnabled ? { enabled: true, targetBpm, step, everyBars } : undefined
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    savePresets(updated);
  };

  const deletePreset = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.filter((_, i) => i !== index);
    setPresets(updated);
    savePresets(updated);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <h1 className="mb-8 text-center text-sm font-bold tracking-widest text-zinc-400 uppercase">
          Métronome Pro MVP
        </h1>

        <div className="flex flex-col gap-8">
          <div className="text-center">
            <div className="text-8xl font-black font-mono tracking-tighter">
              {bpm}
            </div>
            <div className="text-zinc-400 font-medium uppercase text-xs">BPM</div>
          </div>

          <input
            type="range" min={40} max={220} value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black"
          />

          {/* Section Progression */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold">Progression Auto</label>
              <input 
                type="checkbox" checked={rampEnabled} 
                onChange={(e) => setRampEnabled(e.target.checked)}
                className="w-5 h-5 accent-black cursor-pointer"
              />
            </div>

            {rampEnabled && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-600">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Cible BPM</label>
                  <input type="number" value={targetBpm} onChange={(e) => setTargetBpm(Number(e.target.value))}
                    className="w-full bg-transparent text-lg font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Paliers (Mesures)</label>
                  <input type="number" value={everyBars} onChange={(e) => setEveryBars(Number(e.target.value))}
                    className="w-full bg-transparent text-lg font-bold outline-none" />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={toggleMetronome}
              className={`py-5 rounded-2xl font-bold text-xl transition-all active:scale-95 shadow-lg ${
                isPlaying ? "bg-red-500 text-white" : "bg-black text-white"
              }`}>
              {isPlaying ? "STOP" : "START"}
            </button>
            <button onClick={saveCurrentPreset}
              className="py-5 rounded-2xl border border-zinc-200 font-bold hover:bg-zinc-50 dark:border-zinc-700 transition-colors">
              💾 SAUVER
            </button>
          </div>

          {/* Favoris */}
          {presets.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-bold text-zinc-400 uppercase mb-3">Mes Favoris</p>
              <div className="flex gap-3 overflow-x-auto pb-4">
                {presets.map((p, i) => (
                  <div key={i} className="relative min-w-[120px]">
                    <button 
                      onClick={() => handleBpmChange(p.bpm)}
                      className="w-full p-4 rounded-xl border border-zinc-200 text-left hover:border-black dark:border-zinc-700 transition-all bg-white dark:bg-zinc-800"
                    >
                      <div className="text-xs font-bold truncate">{p.name}</div>
                      <div className="text-lg font-mono font-black">{p.bpm}</div>
                    </button>
                    <button 
                      onClick={(e) => deletePreset(i, e)}
                      className="absolute -top-2 -right-2 bg-white dark:bg-zinc-700 text-red-500 w-6 h-6 rounded-full text-xs flex items-center justify-center border shadow-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}