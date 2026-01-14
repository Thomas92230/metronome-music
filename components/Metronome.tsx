"use client";

import { useState } from "react";
import {
  startMetronome,
  stopMetronome,
  setTempo,
  setSubdivision,
  setTimeSignature,
} from "../audio/metronomeEngine";
import { loadPresets, savePresets } from "../utils/presets";
import { Preset } from "../types/preset";

// Définition stricte du type pour correspondre au moteur audio
type SubdivisionType = "quarter" | "eighth" | "triplet";

export default function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [subdivision, setSubdivisionUI] = useState<SubdivisionType>("quarter");
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets());

  const toggleMetronome = () => {
    if (isPlaying) stopMetronome();
    else startMetronome(bpm);
    setIsPlaying((p) => !p);
  };

  const handleBpmChange = (value: number) => {
    setBpm(value);
    setTempo(value);
  };

  const handleSubdivisionChange = (value: SubdivisionType) => {
    setSubdivisionUI(value);
    setSubdivision(value); // Plus besoin de 'as any' car le type est cohérent
  };

  const saveCurrentPreset = () => {
    const name = prompt("Nom du preset ?");
    if (!name) return;

    const newPreset: Preset = { 
      name, 
      bpm, 
      beatsPerBar: 4, 
      subdivision, 
      countInMeasures: 0 
    };

    const updated: Preset[] = [...presets, newPreset];
    setPresets(updated);
    savePresets(updated);
  };

  const deletePreset = (index: number) => {
    const updated = presets.filter((_, i) => i !== index);
    setPresets(updated);
    savePresets(updated);
  };

  const loadPreset = (preset: Preset) => {
    // On s'assure que la valeur du preset est bien une SubdivisionType valide
    const presetSub = preset.subdivision as SubdivisionType;

    setBpm(preset.bpm);
    setSubdivisionUI(presetSub);
    setTempo(preset.bpm);
    setSubdivision(presetSub); // Utilisation d'une variable typée au lieu de 'as any'
    setTimeSignature(preset.beatsPerBar);

    if (isPlaying) {
      stopMetronome();
      startMetronome(preset.bpm);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-black p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <h1 className="mb-6 text-center text-3xl font-bold dark:text-white">Métronome 🎵</h1>

        <div className="flex flex-col gap-6">
          <div className="text-center text-6xl font-mono font-bold dark:text-white">
            {bpm} <span className="text-xl font-sans text-zinc-400">BPM</span>
          </div>

          <input
            type="range"
            min={40}
            max={220}
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
          />

          <select
            value={subdivision}
            className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white outline-none focus:ring-2 focus:ring-black"
            onChange={(e) => handleSubdivisionChange(e.target.value as SubdivisionType)}
          >
            <option value="quarter">Noires (1/4)</option>
            <option value="eighth">Croches (1/8)</option>
            <option value="triplet">Triolets (1/12)</option>
          </select>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={toggleMetronome}
              className={`p-4 rounded-xl font-bold transition-all ${
                isPlaying ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-black text-white shadow-lg"
              }`}
            >
              {isPlaying ? "⏸ STOP" : "▶ PLAY"}
            </button>
            <button
              onClick={saveCurrentPreset}
              className="p-4 rounded-xl border border-zinc-300 dark:border-zinc-600 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors dark:text-white"
            >
              💾 Sauver
            </button>
          </div>

          {presets.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest font-bold text-zinc-400 mb-4">Tes Favoris</p>
              
              <div className="flex gap-6 overflow-x-auto overflow-y-visible pt-6 pb-4 px-2 -mx-2">
                {presets.map((preset, i) => (
                  <div key={`preset-${i}`} className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreset(i);
                      }}
                      className="absolute -top-3 -right-3 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl z-[999] hover:bg-red-700 transition-transform active:scale-90 border-2 border-white dark:border-zinc-900"
                    >
                      ✕
                    </button>

                    <div
                      onClick={() => loadPreset(preset)}
                      className="min-w-[120px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 cursor-pointer bg-white dark:bg-zinc-800 hover:border-black dark:hover:border-white transition-all shadow-sm"
                    >
                      <div className="text-sm font-bold truncate dark:text-white">{preset.name}</div>
                      <div className="text-xs text-zinc-500 font-mono">{preset.bpm} BPM</div>
                    </div>
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