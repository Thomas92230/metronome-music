"use client";

import { useState, useEffect, useCallback } from "react";
import * as Engine from "../audio/metronomeEngine";
import { useMetronome } from "../hooks/useMetronome";
import { VolumeControl } from "../components/Volume.Control";

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [volume, setVolume] = useState(0.5);
  const [activeInstrument, setActiveInstrument] = useState("mechanical");
  const [seconds, setSeconds] = useState(0);

  const { currentBpm, beat } = useMetronome();

  const displayBpm = isPlaying ? Math.round(currentBpm) : bpm;
  const delayMs = (60000 / displayBpm).toFixed(2);

  // Initialisation du volume au montage et à chaque changement
  useEffect(() => {
    Engine.setVolume(volume);
  }, [volume]); // Ajout de volume en dépendance pour corriger l'alerte jaune

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, "0");
    const secs = (s % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const updateBpm = useCallback((val: number) => {
    const newBpm = Math.min(Math.max(val, 1), 300);
    setBpm(newBpm);
    Engine.setTempo(newBpm);
  }, []);

  const updateBeats = useCallback((val: number) => {
    const newBeats = Math.min(Math.max(val, 1), 16);
    setBeatsPerBar(newBeats);
    Engine.setTimeSignature(newBeats);
  }, []);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    Engine.setVolume(newVol);
  };

  const toggleMetronome = async () => {
    if (isPlaying) {
      Engine.stopMetronome();
      setIsPlaying(false);
    } else {
      setSeconds(0);
      await Engine.startMetronome(bpm);
      setIsPlaying(true);
    }
  };

  // Automation Tempo Ramp
  const [rampEnabled, setRampEnabled] = useState(false);
  const [targetBpm, setTargetBpm] = useState(160);
  const [step] = useState(5);
  const [everyBars, setEveryBars] = useState(4);

  useEffect(() => {
    Engine.setTempoRamp({ enabled: rampEnabled, targetBpm, step, everyBars });
  }, [rampEnabled, targetBpm, step, everyBars]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-[#1a1a1a] p-4 font-sans">
      <div className="bg-[#2a2a2a] w-full max-w-5xl p-10 rounded-[40px] shadow-2xl border border-white/5 text-white">
        
        {/* BARRE DE PROGRESSION TEMPO (HAUT) */}
        <div className="w-full mb-12 px-2">
          <div className="flex justify-between text-[10px] mb-3 font-black text-zinc-500 uppercase tracking-widest">
            <span>0 BPM</span>
            <span className="text-cyan-400">Target: {bpm}</span>
            <span>300 BPM</span>
          </div>
          <input 
            type="range" min="1" max="300" value={bpm} 
            onChange={(e) => updateBpm(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-400"
            style={{
              background: `linear-gradient(to right, #22d3ee ${(bpm/300)*100}%, #27272a ${(bpm/300)*100}%)`
            }}
          />
        </div>

        {/* SECTION CENTRALE : TAP | DISPLAY | BOUTONS | VOLUME */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12 items-center">
          
          {/* BOUTON TAP */}
          <div className="md:col-span-2 flex justify-center">
            <button className="h-28 w-28 rounded-full bg-zinc-800/30 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500 shadow-lg hover:text-cyan-400 transition-colors">
              TAP TEMPO
            </button>
          </div>

          {/* AFFICHEUR ET BOUTONS +/- */}
          <div className="md:col-span-7 flex items-center justify-center gap-6">
            <div className="bg-black/40 p-8 rounded-[40px] border-2 border-zinc-800 min-w-[260px] text-center shadow-2xl relative">
              <span className="text-[11px] text-cyan-500 font-black tracking-[0.4em] block mb-2 uppercase">Tempo</span>
              <div className="text-8xl font-black font-mono text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                {displayBpm}
              </div>
              <div className="mt-4 py-2 px-5 bg-zinc-900/90 rounded-full border border-white/5 inline-flex items-center gap-3">
                <span className="text-cyan-700 text-[10px] font-black uppercase italic tracking-tighter">Délai</span>
                <span className="text-cyan-400 text-sm font-mono">{delayMs}ms</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button onClick={() => updateBpm(bpm + 1)} className="w-16 h-16 bg-zinc-800 border-2 border-zinc-700 rounded-2xl flex items-center justify-center text-4xl font-bold text-cyan-400 shadow-xl hover:border-cyan-500 transition-all active:scale-90">+</button>
              <button onClick={() => updateBpm(bpm - 1)} className="w-16 h-16 bg-zinc-800 border-2 border-zinc-700 rounded-2xl flex items-center justify-center text-4xl font-bold text-cyan-400 shadow-xl hover:border-cyan-500 transition-all active:scale-90">-</button>
            </div>
          </div>

          {/* COMPOSANT VOLUME */}
          <div className="md:col-span-3 flex justify-center items-center h-full">
            <VolumeControl onChange={handleVolumeChange} />
          </div>
        </div>

        {/* SECTION BAS : INSTRUMENTS | CONTROLES START | RAMPE & TIMER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          <div className="bg-zinc-900/30 p-6 rounded-[35px] border border-white/5">
            <h3 className="text-[11px] font-black uppercase mb-6 text-zinc-600 tracking-[0.2em] text-center">Sound Engine</h3>
            <div className="grid grid-cols-2 gap-4">
              {[{ id: "mechanical", name: "Click", icon: "⏲️" }, { id: "conga", name: "Conga", icon: "🪘" }, { id: "woodblock", name: "Wood", icon: "🪵" }, { id: "clave", name: "Clave", icon: "🥢" }].map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => { setActiveInstrument(inst.id); Engine.setSoundType(inst.id); }}
                  className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${activeInstrument === inst.id ? "border-orange-500 bg-orange-500/10" : "border-zinc-800 bg-zinc-800/40 hover:border-zinc-700"}`}
                >
                  <span className="text-3xl">{inst.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{inst.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-black/40 p-6 rounded-3xl border border-zinc-800 text-center">
                <span className="text-[10px] text-green-500 font-black uppercase tracking-widest block mb-2">Temps</span>
                <div className="text-6xl font-black font-mono text-green-500">{beat + 1}</div>
              </div>
              <div className="bg-black/40 p-6 rounded-3xl border border-zinc-800 text-center">
                <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest block mb-2">Mesure</span>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => updateBeats(beatsPerBar - 1)} className="text-zinc-600 hover:text-white">-</button>
                  <span className="text-6xl font-black font-mono text-orange-400">{beatsPerBar}</span>
                  <button onClick={() => updateBeats(beatsPerBar + 1)} className="text-zinc-600 hover:text-white">+</button>
                </div>
              </div>
            </div>
            <button onClick={toggleMetronome} className={`w-full py-12 rounded-[40px] text-5xl font-black shadow-2xl transition-all active:scale-95 ${isPlaying ? "bg-red-600 shadow-red-900/30" : "bg-green-600 shadow-green-900/30"}`}>
              {isPlaying ? "STOP" : "START"}
            </button>
          </div>

          <div className="bg-zinc-900/30 p-8 rounded-[35px] border border-white/5 flex flex-col gap-8">
            <div className="bg-zinc-900/60 p-6 rounded-[32px] border border-white/5 text-center shadow-inner">
               <span className="text-[10px] text-zinc-500 font-black block mb-2 tracking-widest uppercase">Chronomètre</span>
               <div className="text-5xl font-mono text-white/90 font-light">{formatTimer(seconds)}</div>
            </div>

            <div className="mt-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">Tempo Ramp</h3>
                <div onClick={() => setRampEnabled(!rampEnabled)} className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-colors ${rampEnabled ? 'bg-orange-500' : 'bg-zinc-800'}`}>
                  <div className={`bg-white w-5 h-5 rounded-full transition-transform ${rampEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                </div>
              </div>
              <input type="range" min="40" max="250" value={targetBpm} onChange={(e) => setTargetBpm(parseInt(e.target.value))} className="w-full accent-orange-500 mb-3" />
              <div className="text-center font-mono text-sm text-orange-400 tracking-tighter">Target: {targetBpm} BPM</div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}