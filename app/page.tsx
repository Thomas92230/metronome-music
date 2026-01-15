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

// --- TRADUCTIONS ---
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
  // --- ÉTATS ---
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = translations[lang];

  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [activeInstrument, setActiveInstrument] = useState("elec_1");
  const [seconds, setSeconds] = useState(0);
  const [totalMeasures, setTotalMeasures] = useState(0);
  const [flash, setFlash] = useState(false);
  const [memories, setMemories] = useState<(MetronomeSettings | null)[]>(new Array(10).fill(null));
  
  const [silentMode, setSilentMode] = useState({ enabled: false, audible: 2, silent: 2 });
  const [automation, setAutomation] = useState({
    enabled: false,
    targetBpm: 160,
    intervalValue: 4,
    step: 5,
  });

  const { currentBpm, beat } = useMetronome();
  const displayBpm = isPlaying ? Math.round(currentBpm) : bpm;
  const delayMs = (60000 / displayBpm).toFixed(2);

  // --- LOGIQUE ---
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

  const handlePreset = (slot: number, save: boolean) => {
    if (save) {
      const newMems = [...memories];
      newMems[slot] = { bpm, beatsPerBar, activeInstrument };
      setMemories(newMems);
    } else {
      const m = memories[slot];
      if (m) {
        updateBpm(m.bpm);
        setBeatsPerBar(m.beatsPerBar);
        setActiveInstrument(m.activeInstrument);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        toggleMetronome();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleMetronome]);

  useEffect(() => {
    if (isPlaying && beat === 0) {
      requestAnimationFrame(() => {
        setFlash(true);
        setTotalMeasures(prev => prev + 1);
        setTimeout(() => setFlash(false), 100);
        if (automation.enabled && totalMeasures > 0 && totalMeasures % automation.intervalValue === 0) {
          const nextBpm = bpm + automation.step;
          if (nextBpm <= 300) updateBpm(nextBpm);
        }
      });
    }
  }, [beat, isPlaying, automation, totalMeasures, bpm, updateBpm]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <main className={`flex items-center justify-center min-h-screen transition-colors duration-75 ${flash ? 'bg-cyan-500/15' : 'bg-[#121212]'} p-2 text-white font-sans`}>
      <div className="bg-[#1e1e1e] w-full max-w-5xl p-4 rounded-3xl shadow-2xl border border-white/5">
        
        {/* BARRE SUPÉRIEURE */}
        <div className="flex items-center justify-between mb-4 gap-4 bg-black/20 p-2 px-4 rounded-2xl border border-white/5">
          <div className="flex-1 max-w-xs">
            <input type="range" min="10" max="300" value={bpm} onChange={(e) => updateBpm(parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-400" />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex gap-2 text-xl">
              <button onClick={() => setLang("fr")} className={`transition-all hover:scale-110 ${lang === 'fr' ? 'opacity-100' : 'opacity-30 grayscale'}`} title="Français">🇫🇷</button>
              <button onClick={() => setLang("en")} className={`transition-all hover:scale-110 ${lang === 'en' ? 'opacity-100' : 'opacity-30 grayscale'}`} title="English">🇬🇧</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          
          {/* COLONNE GAUCHE : SONS */}
          <div className="col-span-3 bg-black/30 p-3 rounded-2xl border border-white/5">
            <h3 className="text-[9px] font-black uppercase text-zinc-500 mb-2 tracking-widest text-center">{t.sons}</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {instruments.map((inst) => (
                <button key={inst.id} onClick={() => { setActiveInstrument(inst.id); Engine.setSoundType(inst.id); }}
                  className={`p-2 rounded-lg border transition-all flex flex-col items-center ${activeInstrument === inst.id ? "border-cyan-500 bg-cyan-500/10" : "border-zinc-800 bg-zinc-900/50"}`}>
                  <span className="text-lg">{inst.icon}</span>
                  <span className="text-[6px] font-bold uppercase truncate w-full text-center">{inst.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* COLONNE CENTRALE : AFFICHAGE & PLAY */}
          <div className="col-span-6 flex flex-col gap-3">
            <div className="bg-black/40 p-6 rounded-[35px] border-2 border-zinc-800 text-center relative">
              <span className="text-[10px] text-cyan-500 font-black tracking-widest block mb-1 uppercase">{t.tempo}</span>
              <div className="text-8xl font-black font-mono text-cyan-400 leading-none">
                {displayBpm}
              </div>
              <div className="mt-2 text-cyan-400/60 font-mono text-[10px] uppercase tracking-tighter">
                {t.delai}: {delayMs}ms
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-zinc-900/60 p-3 rounded-2xl border border-white/5 text-center">
                  <span className="text-[8px] text-zinc-500 uppercase font-bold block">{t.temps}</span>
                  <div className="text-2xl font-mono text-green-400">{beat + 1}</div>
               </div>
               <div className="bg-zinc-900/60 p-3 rounded-2xl border border-white/5 text-center">
                  <span className="text-[8px] text-zinc-500 uppercase font-bold block">{t.mesures}</span>
                  <div className="text-2xl font-mono text-orange-400">{totalMeasures}</div>
               </div>
            </div>

            <button onClick={toggleMetronome} className={`w-full py-4 rounded-2xl transition-all active:scale-95 shadow-lg flex justify-center items-center ${isPlaying ? 'bg-red-600' : 'bg-green-600 hover:bg-green-500'}`}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white ml-1"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
          </div>

          {/* COLONNE DROITE : OUTILS */}
          <div className="col-span-3 space-y-3">
            <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800 text-center">
              <span className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">{t.chrono}</span>
              <div className="text-3xl font-mono text-white tracking-widest bg-zinc-900 rounded-lg py-1 border border-white/5">
                {Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <div className="bg-zinc-900/40 p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold text-green-500 uppercase">{t.silence}</span>
                <input type="checkbox" checked={silentMode.enabled} onChange={e => setSilentMode({...silentMode, enabled: e.target.checked})} className="scale-75 accent-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-1 text-center">
                <div className="bg-black/40 rounded p-1">
                  <span className="text-[6px] text-zinc-500 block uppercase">{t.jouees}</span>
                  <span className="text-[10px] font-bold">{silentMode.audible}</span>
                </div>
                <div className="bg-black/40 rounded p-1">
                  <span className="text-[6px] text-zinc-500 block uppercase">{t.muettes}</span>
                  <span className="text-[10px] font-bold">{silentMode.silent}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/40 p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold text-orange-500 uppercase">{t.automation}</span>
                <input type="checkbox" checked={automation.enabled} onChange={e => setAutomation({...automation, enabled: e.target.checked})} className="scale-75 accent-orange-500" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[7px] text-zinc-500 uppercase">{t.cible} : {automation.targetBpm} BPM</span>
                <input type="range" min="10" max="300" value={automation.targetBpm} onChange={e => setAutomation({...automation, targetBpm: parseInt(e.target.value)})} className="w-full h-1 accent-orange-500" />
              </div>
            </div>

            <VolumeControl onChange={(v) => Engine.setVolume(v)} />
          </div>
        </div>
      </div>
    </main>
  );
}