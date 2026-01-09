"use client";

import { useState, useEffect } from "react";
import * as Engine from "../audio/metronomeEngine";
import { loadPresets, savePresets } from "../utils/presets";
import { Preset } from "../types/preset";

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [subdivision] = useState<"quarter" | "eighth" | "triplet">("quarter");

  const [presets, setPresets] = useState<Preset[]>(() => {
    if (typeof window !== "undefined") {
      return loadPresets();
    }
    return [];
  });

  const [rampEnabled, setRampEnabled] = useState(false);
  const [targetBpm, setTargetBpm] = useState(160);
  const [step] = useState(5);
  const [everyBars, setEveryBars] = useState(4);

  useEffect(() => {
    Engine.setTempoRamp({
      enabled: rampEnabled,
      targetBpm,
      step,
      everyBars,
    });
  }, [rampEnabled, targetBpm, step, everyBars]);

  const toggleMetronome = () => {
    if (isPlaying) {
      Engine.stopMetronome();
    } else {
      Engine.startMetronome(bpm);
    }
    setIsPlaying((prev) => !prev);
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
      tempoRamp: rampEnabled
        ? { enabled: true, targetBpm, step, everyBars }
        : undefined,
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
    <main className="flex items-center justify-center px-4 py-10">
      <div className="app-main w-full max-w-md p-8 shadow-2xl border border-white/20">
        <h1 className="mb-8 text-center text-sm font-bold tracking-widest text-black uppercase">
          Métronome Pro MVP
        </h1>

        <div className="flex flex-col gap-8">
          <div className="text-center">
            <div className="text-8xl font-black font-mono tracking-tighter text-black">
              {bpm}
            </div>
            <div className="text-black/60 font-medium uppercase text-xs">
              BPM
            </div>
          </div>

          <input
            type="range"
            min={40}
            max={220}
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black"
          />

          <div className="p-5 rounded-2xl border border-zinc-200 bg-white/60 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-black">
                Progression Auto
              </label>
              <input
                type="checkbox"
                checked={rampEnabled}
                onChange={(e) => setRampEnabled(e.target.checked)}
                className="w-5 h-5 accent-black cursor-pointer"
              />
            </div>

            {rampEnabled && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200">
                <div>
                  {/* LABEL ET INPUT CIBLE BPM EN NOIR */}
                  <label className="text-[10px] font-bold text-black/60 uppercase">
                    Cible BPM
                  </label>
                  <input
                    type="number"
                    value={targetBpm}
                    onChange={(e) => setTargetBpm(Number(e.target.value))}
                    className="w-full bg-transparent text-lg font-bold outline-none text-black"
                  />
                </div>

                <div>
                  {/* LABEL ET INPUT PALIERS EN NOIR */}
                  <label className="text-[10px] font-bold text-black/60 uppercase">
                    Paliers (Mesures)
                  </label>
                  <input
                    type="number"
                    value={everyBars}
                    onChange={(e) => setEveryBars(Number(e.target.value))}
                    className="w-full bg-transparent text-lg font-bold outline-none text-black"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={toggleMetronome}
              className={`py-5 rounded-2xl font-bold text-xl transition-all active:scale-95 shadow-lg ${
                isPlaying
                  ? "bg-red-500 text-white"
                  : "bg-black text-white hover:bg-zinc-800"
              }`}
            >
              {isPlaying ? "STOP" : "START"}
            </button>

            <button
              onClick={saveCurrentPreset}
              className="py-5 rounded-2xl border border-zinc-300 font-bold hover:bg-zinc-100 transition-colors text-black"
            >
              💾 Save
            </button>
          </div>

          {presets.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-bold text-black uppercase mb-3">
                Mes Favoris
              </p>

              <div className="flex gap-4 overflow-x-auto overflow-y-visible px-3 -mx-3 pt-3 pb-6">
                {presets.map((p, i) => (
                  <div key={i} className="relative min-w-[120px]">
                    <button
                      onClick={() => handleBpmChange(p.bpm)}
                      className="w-full p-4 rounded-xl border border-zinc-200 text-left hover:border-black transition-all bg-white/80 backdrop-blur-sm"
                    >
                      <div className="text-xs font-bold truncate text-black">
                        {p.name}
                      </div>
                      <div className="text-lg font-mono font-black text-black">
                        {p.bpm}
                      </div>
                    </button>

                    <button
                      onClick={(e) => deletePreset(i, e)}
                      className="absolute -top-3 -right-3 bg-red-500 text-white w-7 h-7 rounded-full text-xs flex items-center justify-center border border-white shadow-lg transition-all hover:bg-red-600"
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