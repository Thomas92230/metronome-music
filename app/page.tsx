"use client";

import { useState, useEffect, useCallback } from "react";
import * as Engine from "../audio/metronomeEngine";
import { useMetronome } from "../hooks/useMetronome";
import { VolumeControl } from "../components/Volume.Control";

interface MetronomeSettings {
  bpm: number;
  beatsPerBar: number;
  activeInstrument: string;
}

const translations = {
  fr: {
    sons: "SONS", tempo: "TEMPO", delai: "Délai", temps: "TEMPS",
    mesures: "MESURES", chrono: "CHRONO", silence: "SILENCE",
    jouees: "JOUÉES", muettes: "MUETTES", automation: "AUTOMATION",
    cible: "CIBLE"
  },
  en: {
    sons: "SOUNDS", tempo: "TEMPO", delai: "Delay", temps: "BEAT",
    mesures: "MEASURES", chrono: "TIMER", silence: "SILENCE",
    jouees: "PLAYED", muettes: "MUTED", automation: "AUTOMATION",
    cible: "TARGET"
  }
};

const instruments = [
  { id: "elec_1", name: "Elec 1", icon: "📟" }, { id: "elec_2", name: "Elec 2", icon: "📟" },
  { id: "elec_3", name: "Elec 3", icon: "📟" }, { id: "elec_4", name: "Elec 4", icon: "📟" },
  { id: "mech_1", name: "Mech 1", icon: "⏳" }, { id: "mech_2", name: "Mech 2", icon: "⏳" },
  { id: "cowbell", name: "Cloche", icon: "🔔" }, { id: "conga", name: "Conga", icon: "🪘" },
  { id: "woodblock", name: "Wood", icon: "🪵" }, { id: "clave", name: "Clave", icon: "🥢" },
  { id: "sticks", name: "Baguettes", icon: "🥢" }, { id: "kick", name: "Kick", icon: "🥁" },
];

export default function MetronomePro() {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = translations[lang];

  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [activeInstrument, setActiveInstrument] = useState("elec_1");
  const [seconds, setSeconds] = useState(0);
  const [totalMeasures, setTotalMeasures] = useState(0);
  const [flash, setFlash] = useState(false);
  const [currentBeatState, setCurrentBeatState] = useState(0);
  const [memories] = useState<(MetronomeSettings | null)[]>(new Array(10).fill(null));
  
  const [silentMode, setSilentMode] = useState({ enabled: false, audible: 2, silent: 2 });
  const [automation, setAutomation] = useState({
    enabled: false,
    targetBpm: 160,
    intervalValue: 4,
    step: 5,
  });

  const { currentBpm } = useMetronome();
  const displayBpm = isPlaying ? Math.round(currentBpm) : bpm;
  const delayMs = (60000 / displayBpm).toFixed(2);

  useEffect(() => {
    const unsubscribe = Engine.onBeat((beat, isAccent) => {
      setCurrentBeatState(beat);
      if (isAccent) {
        requestAnimationFrame(() => {
          setFlash(true);
          setTotalMeasures(prev => prev + 1);
          setTimeout(() => setFlash(false), 100);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateBpm = useCallback((val: number) => {
    const newBpm = Math.min(Math.max(val, 10), 300);
    setBpm(newBpm);
    Engine.setTempo(newBpm);
  }, []);

  const toggleMetronome = useCallback(async () => {
    if (isPlaying) {
      Engine.stopMetronome();
      setIsPlaying(false);
    } else {
      setTotalMeasures(0);
      setSeconds(0);
      await Engine.startMetronome(bpm);
      setIsPlaying(true);
    }
  }, [isPlaying, bpm]);

  useEffect(() => {
    Engine.setTempoRamp({
      enabled: automation.enabled,
      targetBpm: automation.targetBpm,
      step: automation.step,
      everyBars: automation.intervalValue
    });
  }, [automation]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  return (
    <main className={`flex items-center justify-center min-h-screen transition-all duration-100 ${flash ? 'bg-cyan-500/20' : 'bg-[#121212]'} p-4 text-white font-sans`}>
      
      <style jsx global>{`
        .tempo-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 10px;
          background: #00bcd4;
          border-radius: 5px;
          outline: none;
          box-shadow: 0 0 10px rgba(0, 188, 212, 0.5);
        }
        .tempo-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 40px;
          height: 22px;
          background: #00e5ff;
          border-radius: 10px;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 
            0 0 15px #00e5ff, 
            inset 0 0 8px rgba(255, 255, 255, 0.8);
        }
        .btn-tempo {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 15px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          color: #00e5ff;
          transition: all 0.2s;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        }
        .btn-tempo:active {
          transform: scale(0.95);
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
        }
      `}</style>

      <div className="bg-[#1e1e1e] w-full max-w-5xl p-6 rounded-[40px] shadow-2xl border border-white/10">
        
        {/* BARRE SUPÉRIEURE */}
        <div className="flex items-center justify-between mb-6 gap-6 bg-black/40 p-3 px-6 rounded-2xl border border-white/5">
          <div className="px-4 mt-6 w-1/2 ml-[20%]">
             <input 
                  type="range" 
                  min="10" 
                  max="300" 
                  value={bpm}
                  onChange={(e) => updateBpm(parseInt(e.target.value))}
                  className="tempo-slider"
                />
              </div>

          <div className="flex gap-3 text-2xl">
            <button onClick={() => setLang("fr")} className={`transition-all hover:scale-110 ${lang === 'fr' ? 'opacity-100' : 'opacity-20'}`}>🇫🇷</button>
            <button onClick={() => setLang("en")} className={`transition-all hover:scale-110 ${lang === 'en' ? 'opacity-100' : 'opacity-20'}`}>🇬🇧</button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* COLONNE GAUCHE */}
          <div className="col-span-3 bg-black/30 p-4 rounded-3xl border border-white/5">
            <h3 className="text-[10px] font-black uppercase text-zinc-300 mb-4 tracking-widest text-center">{t.sons}</h3>
            <div className="grid grid-cols-3 gap-2">
              {instruments.map((inst) => (
                <button 
                  key={inst.id} 
                  onClick={() => { setActiveInstrument(inst.id); Engine.setSoundType(inst.id); }}
                  className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${activeInstrument === inst.id ? "border-cyan-500 bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"}`}
                >
                  <span className="text-xl">{inst.icon}</span>
                  <span className="text-[7px] font-black uppercase truncate text-zinc-300">{inst.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* COLONNE CENTRALE */}
          <div className="col-span-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-black/60 p-8 rounded-[50px] border-2 border-zinc-800 text-center relative shadow-inner overflow-hidden">
                <span className="text-[11px] text-cyan-500 font-black tracking-[0.3em] block mb-2 uppercase">{t.tempo}</span>
                <div className="text-[110px] font-black font-mono text-cyan-400 leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                  {displayBpm}
                </div>
                <div className="mt-4 text-cyan-400/70 font-mono text-xs font-bold tracking-widest">
                  {t.delai} <span className="text-white font-mono">{delayMs}</span> ms
                </div>
              </div>
              
              {/* BOUTONS + ET - */}
              <div className="flex flex-col gap-4">
                <button onClick={() => updateBpm(bpm + 1)} className="btn-tempo">＋</button>
                <button onClick={() => updateBpm(bpm - 1)} className="btn-tempo">－</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-zinc-900/80 p-4 rounded-3xl border border-white/5 text-center">
                  <span className="text-[10px] text-zinc-300 uppercase font-black block mb-1">{t.temps}</span>
                  <div className="text-4xl font-mono font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                    {currentBeatState + 1}
                  </div>
               </div>
               <div className="bg-zinc-900/80 p-4 rounded-3xl border border-white/5 text-center">
                  <span className="text-[10px] text-zinc-300 uppercase font-black block mb-1">{t.mesures}</span>
                  <div className="text-4xl font-mono font-black text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.3)]">
                    {totalMeasures}
                  </div>
               </div>
            </div>

            <button onClick={toggleMetronome} className={`w-full py-6 rounded-[30px] transition-all shadow-2xl flex justify-center items-center ${isPlaying ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-green-600 hover:bg-green-500 shadow-green-500/20'}`}>
              {isPlaying ? (
                <div className="w-10 h-10 bg-white rounded-lg shadow-inner" />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-white ml-2 drop-shadow-md">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* COLONNE DROITE */}
          <div className="col-span-3 space-y-4">
            <div className="bg-black/50 p-5 rounded-3xl border border-zinc-800 text-center shadow-xl">
              <span className="text-[10px] text-zinc-300 uppercase font-black block mb-2 tracking-widest">{t.chrono}</span>
              <div className="text-4xl font-mono text-white tracking-tighter bg-zinc-900 rounded-2xl py-2 border border-white/5 shadow-inner">
                {Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}
              </div>
               <div className="pt-2">
              <VolumeControl onChange={(v) => Engine.setVolume(v)} />
            </div>
            </div>

            <div className="bg-zinc-900/60 p-4 rounded-3xl border border-white/5 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-black text-green-400 uppercase tracking-widest">{t.silence}</span>
                <button 
                  onClick={() => setSilentMode(s => ({...s, enabled: !s.enabled}))} 
                  className={`w-10 h-5 rounded-full relative transition-all border border-white/10 ${silentMode.enabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${silentMode.enabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-black/40 rounded-xl p-2 border border-white/5">
                  <span className="text-[8px] text-zinc-400 block font-black uppercase mb-1">{t.jouees}</span>
                  <span className="text-lg font-mono font-black text-white">{silentMode.audible}</span>
                </div>
                <div className="bg-black/40 rounded-xl p-2 border border-white/5">
                  <span className="text-[8px] text-zinc-400 block font-black uppercase mb-1">{t.muettes}</span>
                  <span className="text-lg font-mono font-black text-white">{silentMode.silent}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/60 p-4 rounded-3xl border border-white/5 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-black text-orange-400 uppercase tracking-widest">{t.automation}</span>
                <button 
                  onClick={() => setAutomation(a => ({...a, enabled: !a.enabled}))}
                  className={`w-10 h-5 rounded-full relative transition-all border border-white/10 ${automation.enabled ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${automation.enabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-300 font-black uppercase block tracking-tighter">Initial</span>
                  <div className="flex items-center justify-between bg-black/60 rounded-xl p-2 border border-white/10 shadow-inner">
                    <button onClick={() => updateBpm(bpm - 1)} className="text-zinc-500 hover:text-white px-1 font-bold">-</button>
                    <span className="text-xs font-mono font-black text-white">{bpm}</span>
                    <button onClick={() => updateBpm(bpm + 1)} className="text-zinc-500 hover:text-white px-1 font-bold">+</button>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-300 font-black uppercase block tracking-tighter">{t.cible}</span>
                  <div className="flex items-center justify-between bg-black/60 rounded-xl p-2 border border-cyan-500/40 shadow-inner">
                    <button onClick={() => setAutomation(a => ({...a, targetBpm: Math.max(10, a.targetBpm - 1)}))} className="text-zinc-500 hover:text-white px-1 font-bold">-</button>
                    <span className="text-xs font-mono font-black text-cyan-400">{automation.targetBpm}</span>
                    <button onClick={() => setAutomation(a => ({...a, targetBpm: Math.min(300, a.targetBpm + 1)}))} className="text-zinc-500 hover:text-white px-1 font-bold">+</button>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-300 font-black uppercase block tracking-tighter">Paliers</span>
                  <div className="flex items-center justify-between bg-black/60 rounded-xl p-2 border border-white/10 shadow-inner">
                    <button onClick={() => setAutomation(a => ({...a, step: Math.max(1, a.step - 1)}))} className="text-zinc-500 hover:text-white px-1 font-bold">-</button>
                    <span className="text-xs font-mono font-black text-white">{automation.step}</span>
                    <button onClick={() => setAutomation(a => ({...a, step: a.step + 1}))} className="text-zinc-500 hover:text-white px-1 font-bold">+</button>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-300 font-black uppercase block tracking-tighter">Mesures</span>
                  <div className="flex items-center justify-between bg-black/60 rounded-xl p-2 border border-white/10 shadow-inner">
                    <button onClick={() => setAutomation(a => ({...a, intervalValue: Math.max(1, a.intervalValue - 1)}))} className="text-zinc-500 hover:text-white px-1 font-bold">-</button>
                    <span className="text-xs font-mono font-black text-white">{automation.intervalValue}</span>
                    <button onClick={() => setAutomation(a => ({...a, intervalValue: a.intervalValue + 1}))} className="text-zinc-500 hover:text-white px-1 font-bold">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}