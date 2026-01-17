"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as Engine from "../audio/metronomeEngine";
import { useMetronome } from "../hooks/useMetronome";
import { VolumeControl } from "../components/Volume.Control";

// ==========================================================
// --- HOOK POUR LE DÉFILEMENT RAPIDE (LONG PRESS) ---
// Gère l'incrémentation continue quand on reste appuyé sur +/-
// ==========================================================
function useLongPress(callback: () => void, ms = 150) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    callback(); // Exécute une fois au clic immédiat
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        callback(); // Puis en boucle toutes les 50ms après un délai initial
      }, 50);
    }, 500);
  }, [callback]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return { onMouseDown: start, onMouseUp: stop, onMouseLeave: stop, onTouchStart: start, onTouchEnd: stop };
}

// ==========================================================
// --- MOTEUR DE RENDU DES ICÔNES SVG ---
// Génère visuellement les figures de notes (noires, croches, etc.)
// ==========================================================
const NoteIcon = ({ id, active }: { id: string; active: boolean }) => {
  const color = active ? "#f97316" : "#22d3ee"; 
  const strokeWidth = 2.5;
  return (
    <svg viewBox="0 0 40 40" className="w-8 h-8 transition-colors duration-200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {id === "quarter" && (
          <><path d="M22 10v18" /><ellipse cx="17" cy="28" rx="5" ry="4" fill={color} /></>
        )}
        {id === "eighth" && (
          <><path d="M12 10v18M28 10v18M12 10h16" /><ellipse cx="8" cy="28" rx="4" ry="3" fill={color} /><ellipse cx="24" cy="28" rx="4" ry="3" fill={color} /></>
        )}
        {id === "triplet" && (
          <><path d="M8 12v16M20 12v16M32 12v16M8 12h24" /><path d="M12 8q8-4 16 0" strokeWidth="1.5" /><text x="20" y="7" fill={color} fontSize="7" fontWeight="bold" textAnchor="middle" stroke="none">3</text><ellipse cx="5" cy="28" rx="3" ry="2.5" fill={color} /><ellipse cx="17" cy="28" rx="3" ry="2.5" fill={color} /><ellipse cx="29" cy="28" rx="3" ry="2.5" fill={color} /></>
        )}
        {id === "sixteenth" && (
          <><path d="M10 10v18M18 10v18M26 10v18M34 10v18M10 10h24M10 15h24" /><ellipse cx="7" cy="28" rx="3" ry="2" fill={color} /><ellipse cx="15" cy="28" rx="3" ry="2" fill={color} /><ellipse cx="23" cy="28" rx="3" ry="2" fill={color} /><ellipse cx="31" cy="28" rx="3" ry="2" fill={color} /></>
        )}
        {id === "1e2d" && (
          <><path d="M10 10v18M22 10v18M34 10v18M10 10h24M22 15h12" /><ellipse cx="7" cy="28" rx="3" ry="2.5" fill={color} /><ellipse cx="19" cy="28" rx="3" ry="2.5" fill={color} /><ellipse cx="31" cy="28" rx="3" ry="2.5" fill={color} /></>
        )}
        {id === "2d1e" && (
          <><path d="M10 10v18M22 10v18M34 10v18M10 10h24M10 15h12" /><ellipse cx="7" cy="28" rx="3" ry="2.5" fill={color} /><ellipse cx="19" cy="28" rx="3" ry="2.5" fill={color} /><ellipse cx="31" cy="28" rx="3" ry="2.5" fill={color} /></>
        )}
        {id === "shuffle" && (
          <><path d="M10 12v16M30 12v16M10 12h20" /><path d="M15 8q5-3 10 0" strokeWidth="1.5" /><text x="20" y="7" fill={color} fontSize="7" fontWeight="bold" textAnchor="middle" stroke="none">3</text><ellipse cx="7" cy="28" rx="3" ry="2.5" fill={color} /><path d="M18 20l4 4-4 4" strokeWidth="2" /><ellipse cx="27" cy="28" rx="3" ry="2.5" fill={color} /></>
        )}
        {id === "1-4-16" && (
          <><path d="M12 10v18M28 10v18M12 10h16" /><ellipse cx="8" cy="28" rx="4" ry="3" fill={color} /><circle cx="15" cy="28" r="1.5" fill={color} stroke="none" /><ellipse cx="24" cy="28" rx="4" ry="3" fill={color} /><path d="M28 10v6" strokeWidth="4" /></>
        )}
        {id === "offbeat" && (
          <><path d="M10 20l4 4-4 4" strokeWidth="2" /><path d="M28 10v18" /><ellipse cx="23" cy="28" rx="5" ry="4" fill={color} /></>
        )}
        {id === "2-4-16" && (
          <><path d="M10 20l3 3-3 3" /><path d="M22 10v18M34 10v18M22 10h12" /><ellipse cx="19" cy="28" rx="3" ry="2.5" fill={color} /><ellipse cx="31" cy="28" rx="3" ry="2.5" fill={color} /></>
        )}
        {id === "2-3-trip" && (
          <><path d="M10 20l3 3-3 3" /><path d="M20 12v16M32 12v16M20 12h12" /><text x="21" y="7" fill={color} fontSize="7" fontWeight="bold" stroke="none">3</text><ellipse cx="17" cy="28" rx="3" ry="2.5" fill={color} /><ellipse cx="29" cy="28" rx="3" ry="2.5" fill={color} /></>
        )}
        {id === "3-4-16" && (
          <><path d="M10 20l3 3-3 3" /><path d="M28 10v18" /><ellipse cx="24" cy="28" rx="4" ry="3" fill={color} /><path d="M28 10h6v6" strokeWidth="2" /></>
        )}
        {id === "quintolet" && (
          <><path d="M5 12v16M12 12v16M20 12v16M28 12v16M35 12v16M5 12h30M5 16h30" /><text x="20" y="7" fill={color} fontSize="7" fontWeight="bold" textAnchor="middle" stroke="none">5</text></>
        )}
        {id === "sextolet" && (
          <><path d="M5 12v16M11 12v16M17 12v16M23 12v16M29 12v16M35 12v16M5 12h30M5 16h30" /><text x="20" y="7" fill={color} fontSize="7" fontWeight="bold" textAnchor="middle" stroke="none">6</text></>
        )}
        {id === "septolet" && (
          <><path d="M4 12v16M9 12v16M14 12v16M20 12v16M26 12v16M31 12v16M36 12v16M4 12h32M4 16h32" /><text x="20" y="7" fill={color} fontSize="7" fontWeight="bold" textAnchor="middle" stroke="none">7</text></>
        )}
        {id === "trinaire" && (
          <><path d="M5 12v16M11 12v16M17 12v16M23 12v16M29 12v16M35 12v16M5 12h30M5 15h30M5 18h30" /><text x="20" y="7" fill={color} fontSize="7" fontWeight="bold" textAnchor="middle" stroke="none">6</text></>
        )}
      </g>
    </svg>
  );
};

// ==========================================================
// --- DONNÉES ET CONFIGURATION ---
// Traductions, listes d'instruments et subdivisions
// ==========================================================
interface SavedTrack { id: number; name: string; bpm: number; instrument: string; }

const translations = {
  fr: {
    sons: "SONS", tempo: "TEMPO", delai: "Délai", temps: "TEMPS",
    mesures: "MESURES", chrono: "CHRONO", silence: "SILENCE",
    jouees: "JOUÉES", muettes: "MUETTES", automation: "AUTOMATION",
    cible: "CIBLE", saveTitle: "ENREGISTRER LA PISTE", 
    placeholder: "Nom de la piste...", cancel: "ANNULER", save: "VALIDER",
    pistes: "MES PISTES", notes: "NOTES"
  },
  en: {
    sons: "SOUNDS", tempo: "TEMPO", delai: "Delay", temps: "BEAT",
    mesures: "MEASURES", chrono: "TIMER", silence: "SILENCE",
    jouees: "PLAYED", muettes: "MUTED", automation: "AUTOMATION",
    cible: "TARGET", saveTitle: "SAVE TRACK", 
    placeholder: "Track name...", cancel: "CANCEL", save: "SAVE",
    pistes: "MY TRACKS", notes: "NOTES"
  }
};

const instruments = [
  { id: "elec_1", name: "E1", icon: "📟" }, { id: "elec_2", name: "E2", icon: "📟" },
  { id: "elec_3", name: "E3", icon: "📟" }, { id: "elec_4", name: "E4", icon: "📟" },
  { id: "mech_1", name: "M1", icon: "⏳" }, { id: "mech_2", name: "M2", icon: "⏳" },
  { id: "cowbell", name: "Clo", icon: "🔔" }, { id: "conga", name: "Con", icon: "🪘" },
  { id: "woodblock", name: "Woo", icon: "🪵" }, { id: "clave", name: "Cla", icon: "🥢" },
  { id: "sticks", name: "Bag", icon: "🥢" }, { id: "kick", name: "Kic", icon: "🥁" },
];

const noteSubdivisions = [
  { id: "quarter" }, { id: "eighth" }, { id: "triplet" }, { id: "sixteenth" },
  { id: "1e2d" }, { id: "2d1e" }, { id: "shuffle" }, { id: "1-4-16" },
  { id: "offbeat" }, { id: "2-4-16" }, { id: "2-3-trip" }, { id: "3-4-16" },
  { id: "quintolet" }, { id: "sextolet" }, { id: "septolet" }, { id: "trinaire" },
] as const;

type SubdivisionId = typeof noteSubdivisions[number]["id"];

// ==========================================================
// --- COMPOSANT PRINCIPAL ---
// ==========================================================
export default function MetronomePro() {
  // --- ÉTATS (STATE) ---
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = translations[lang];

  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [activeInstrument, setActiveInstrument] = useState("elec_1");
  const [activeSub, setActiveSub] = useState<SubdivisionId>("quarter");
  const [seconds, setSeconds] = useState(0);
  const [totalMeasures, setTotalMeasures] = useState(0);
  const [flash, setFlash] = useState(false); // Effet visuel au temps 1
  const [currentBeatState, setCurrentBeatState] = useState(0);
  
  // Paramètres modes spéciaux
  const [silentMode, setSilentMode] = useState({ enabled: false, audible: 2, silent: 2 });
  const [automation, setAutomation] = useState({ enabled: false, targetBpm: 160, intervalValue: 4, step: 5 });

  // Gestion des pistes sauvegardées
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [savedTracks, setSavedTracks] = useState<SavedTrack[]>([]);

  // Hook externe pour la logique audio synchronisée
  const { currentBpm } = useMetronome();
  const displayBpm = isPlaying ? Math.round(currentBpm) : bpm;
  const delayMs = (60000 / displayBpm).toFixed(2);

  // --- HANDLERS DÉFILEMENT (Long Press sur les boutons +/-) ---
  const handleAudiblePlus = useLongPress(() => setSilentMode(s => ({...s, audible: s.audible + 1})));
  const handleAudibleMinus = useLongPress(() => setSilentMode(s => ({...s, audible: Math.max(1, s.audible - 1)})));
  const handleSilentPlus = useLongPress(() => setSilentMode(s => ({...s, silent: s.silent + 1})));
  const handleSilentMinus = useLongPress(() => setSilentMode(s => ({...s, silent: Math.max(1, s.silent - 1)})));
  
  const handleTargetPlus = useLongPress(() => setAutomation(a => ({...a, targetBpm: Math.min(300, a.targetBpm + 1)})));
  const handleTargetMinus = useLongPress(() => setAutomation(a => ({...a, targetBpm: Math.max(10, a.targetBpm - 1)})));
  const handleStepPlus = useLongPress(() => setAutomation(a => ({...a, step: a.step + 1})));
  const handleStepMinus = useLongPress(() => setAutomation(a => ({...a, step: Math.max(1, a.step - 1)})));
  const handleIntervalPlus = useLongPress(() => setAutomation(a => ({...a, intervalValue: a.intervalValue + 1})));
  const handleIntervalMinus = useLongPress(() => setAutomation(a => ({...a, intervalValue: Math.max(1, a.intervalValue - 1)})));

  // --- EFFETS (SIDE EFFECTS) ---
  
  // Écoute les événements du moteur audio (Beat / Flash)
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
    return () => unsubscribe();
  }, []);

  // Met à jour le tempo dans le moteur audio
  const updateBpm = useCallback((val: number) => {
    const newBpm = Math.min(Math.max(val, 10), 300);
    setBpm(newBpm);
    Engine.setTempo(newBpm);
  }, []);

  // Démarre / Arrête le métronome
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

  // Sauvegarde une configuration de piste
  const handleConfirmSave = () => {
    if (trackName.trim()) {
      const newTrack = { id: Date.now(), name: trackName, bpm: bpm, instrument: activeInstrument };
      setSavedTracks([newTrack, ...savedTracks]);
      setIsModalOpen(false); 
      setTrackName("");
    }
  };

  const deleteTrack = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedTracks(savedTracks.filter(t => t.id !== id));
  };

  // Synchronise l'automation avec le moteur audio
  useEffect(() => {
    Engine.setTempoRamp({ 
      enabled: automation.enabled, 
      targetBpm: automation.targetBpm, 
      step: automation.step, 
      everyBars: automation.intervalValue 
    });
  }, [automation]);

  // Gestion du chrono (Timer)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) { 
      interval = setInterval(() => setSeconds(s => s + 1), 1000); 
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying]);

  return (
    <main className={`flex items-center justify-center min-h-screen transition-all duration-100 ${flash ? 'bg-cyan-500/20' : 'bg-[#121212]'} p-4 text-white font-sans`}>
      
      {/* --- STYLES CSS LOCAUX --- */}
      <style jsx global>{`
        .tempo-slider { -webkit-appearance: none; width: 100%; height: 10px; background: #00bcd4; border-radius: 5px; outline: none; }
        .tempo-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 40px; height: 22px; background: #00e5ff; border-radius: 10px; cursor: pointer; box-shadow: 0 0 15px #00e5ff; transition: transform 0.1s; }
        .tempo-slider::-webkit-slider-thumb:hover { transform: scale(1.1); }
        .btn-tempo { background: #1a1a1a; border: 1px solid #333; border-radius: 15px; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: #00e5ff; transition: all 0.2s; }
        .btn-tempo:hover { background: #222; border-color: #00e5ff; transform: translateY(-2px); }
        .btn-mini { @apply bg-black/40 hover:bg-white/10 text-white w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all active:scale-90; }
        .tracks-scrollbar::-webkit-scrollbar { height: 6px; }
        .tracks-scrollbar::-webkit-scrollbar-thumb { background: #00bcd4; border-radius: 10px; }
      `}</style>

      {/* --- MODALE DE SAUVEGARDE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-white/10 p-8 rounded-[30px] w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black mb-6 text-cyan-400 text-center uppercase tracking-widest">{t.saveTitle}</h2>
            <input type="text" value={trackName} onChange={(e) => setTrackName(e.target.value)} placeholder={t.placeholder} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 mb-6 outline-none focus:border-cyan-500 text-white" />
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl border border-white/5 font-bold hover:bg-white/5 transition-colors">{t.cancel}</button>
              <button onClick={handleConfirmSave} className="flex-1 py-4 rounded-2xl bg-cyan-500 text-black font-black hover:bg-cyan-400 transition-colors">{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- INTERFACE PRINCIPALE --- */}
      <div className="bg-[#1e1e1e] w-full max-w-5xl p-6 rounded-[40px] shadow-2xl border border-white/10">
        
        {/* Barre du haut : Slider Tempo + Langues */}
        <div className="flex items-center justify-between mb-6 gap-6 bg-black/40 p-3 px-6 rounded-2xl border border-white/5">
          <div className="px-4 mt-6 w-1/2 ml-[20%]">
             <input type="range" min="10" max="300" value={bpm} onChange={(e) => updateBpm(parseInt(e.target.value))} className="tempo-slider" />
          </div>
          <div className="flex gap-3 text-2xl">
            <button onClick={() => setLang("fr")} className={`transition-all hover:scale-110 ${lang === 'fr' ? 'opacity-100' : 'opacity-20'}`}>🇫🇷</button>
            <button onClick={() => setLang("en")} className={`transition-all hover:scale-110 ${lang === 'en' ? 'opacity-100' : 'opacity-20'}`}>🇬🇧</button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* COLONNE GAUCHE : SONS & NOTES */}
          <div className="col-span-3 flex flex-col gap-4">
            <div className="bg-black/30 p-4 rounded-3xl border border-white/5">
              <h3 className="text-[10px] font-black uppercase text-zinc-300 mb-4 tracking-widest text-center">{t.sons}</h3>
              <div className="grid grid-cols-4 gap-2">
                {instruments.map((inst) => (
                  <button key={inst.id} onClick={() => { setActiveInstrument(inst.id); Engine.setSoundType(inst.id); }} className={`p-1 rounded-lg border transition-all hover:scale-105 flex flex-col items-center justify-center aspect-square ${activeInstrument === inst.id ? "border-cyan-500 bg-cyan-500/20" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"}`}>
                    <span className="text-sm">{inst.icon}</span>
                    <span className="text-[6px] font-black uppercase truncate text-zinc-400">{inst.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-black/30 p-4 rounded-3xl border border-white/5 flex-1">
              <h3 className="text-[10px] font-black uppercase text-zinc-300 mb-4 tracking-widest text-center">{t.notes}</h3>
              <div className="grid grid-cols-4 gap-2">
                {noteSubdivisions.map((sub) => (
                  <button key={sub.id} onClick={() => { setActiveSub(sub.id); Engine.setSubdivision(sub.id as Parameters<typeof Engine.setSubdivision>[0]); }} className={`p-1 rounded-lg border transition-all hover:scale-105 flex items-center justify-center aspect-square ${activeSub === sub.id ? "border-orange-500 bg-orange-500/20" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"}`}>
                    <NoteIcon id={sub.id} active={activeSub === sub.id} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLONNE CENTRALE : AFFICHAGE BPM & CONTRÔLES PRINCIPAUX */}
          <div className="col-span-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {/* Écran Tempo */}
              <div className="flex-1 bg-black/60 p-8 rounded-[50px] border-2 border-zinc-800 text-center shadow-inner overflow-hidden">
                <span className="text-[11px] text-cyan-500 font-black tracking-[0.3em] block mb-2 uppercase">{t.tempo}</span>
                <div className="text-[110px] font-black font-mono text-cyan-400 leading-none">{displayBpm}</div>
                <div className="mt-4 text-cyan-400/70 font-mono text-xs">{t.delai} <span className="text-white">{delayMs}</span> ms</div>
              </div>
              <div className="flex flex-col gap-4">
                <button onClick={() => updateBpm(bpm + 1)} className="btn-tempo">＋</button>
                <button onClick={() => updateBpm(bpm - 1)} className="btn-tempo">－</button>
              </div>
            </div>

            {/* Compteurs de temps et mesures */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/80 p-4 rounded-3xl border border-white/5 text-center">
                  <span className="text-[10px] text-zinc-300 uppercase font-black block mb-1">{t.temps}</span>
                  <div className="text-4xl font-mono font-black text-green-400">{currentBeatState + 1}</div>
                </div>
                <div className="bg-zinc-900/80 p-4 rounded-3xl border border-white/5 text-center">
                  <span className="text-[10px] text-zinc-300 uppercase font-black block mb-1">{t.mesures}</span>
                  <div className="text-4xl font-mono font-black text-orange-400">{totalMeasures}</div>
                </div>
            </div>

            {/* Boutons Play & Save */}
            <div className="flex gap-4">
              <button onClick={toggleMetronome} className={`flex-1 py-6 rounded-[30px] flex justify-center items-center transition-all hover:brightness-110 active:scale-95 ${isPlaying ? 'bg-red-600 shadow-lg shadow-red-900/20' : 'bg-green-600 shadow-lg shadow-green-900/20'}`}>
                {isPlaying ? <div className="w-10 h-10 bg-white rounded-lg" /> : <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-white ml-2"><path d="M8 5v14l11-7z" /></svg>}
              </button>
              <button onClick={() => setIsModalOpen(true)} className="flex-1 py-6 rounded-[30px] bg-cyan-400 flex justify-center items-center transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-cyan-900/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-12 h-12"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              </button>
            </div>

            {/* Liste des pistes sauvegardées */}
            <div className="mt-2 bg-black/20 rounded-3xl p-4 border border-white/5">
              <span className="text-[9px] font-black text-zinc-500 uppercase block mb-3 pl-2">{t.pistes}</span>
              <div className="flex gap-3 overflow-x-visible tracks-scrollbar pb-3 px-2">
                {savedTracks.length === 0 ? <div className="w-full text-center py-4 text-zinc-600 text-[10px] uppercase italic tracking-widest">Aucune piste...</div> : savedTracks.map((track) => (
                  <button key={track.id} onClick={() => updateBpm(track.bpm)} className="relative flex-shrink-0 bg-zinc-900/80 border border-white/10 rounded-2xl p-3 min-w-[120px] transition-all hover:border-cyan-500/50 hover:bg-zinc-800 isolate overflow-visible">
                    <div 
                      onClick={(e) => deleteTrack(track.id, e)} 
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xl hover:bg-red-500 hover:scale-125 hover:rotate-90 transition-all duration-300 z-50 cursor-pointer pointer-events-auto"
                    >
                      ✕
                    </div>
                    <div className="text-[10px] font-black text-cyan-400 truncate uppercase">{track.name}</div>
                    <div className="text-lg font-mono font-black text-white">{track.bpm} <span className="text-[10px] opacity-40">BPM</span></div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : CHRONO, SILENCE & AUTOMATION */}
          <div className="col-span-3 space-y-4">
            {/* Chrono & Volume */}
            <div className="bg-black/50 p-5 rounded-3xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-300 uppercase font-black block mb-2">{t.chrono}</span>
              <div className="text-4xl font-mono text-white bg-zinc-900 rounded-2xl py-2">{Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}</div>
              <div className="pt-2"><VolumeControl onChange={(v) => Engine.setVolume(v)} /></div>
            </div>
            
            {/* Mode Silence (Audible / Muet) */}
            <div className="bg-zinc-900/60 p-4 rounded-3xl border border-white/5">
              <div className="flex justify-between items-center mb-4"><span className="text-[11px] font-black text-green-400 uppercase">{t.silence}</span><button onClick={() => setSilentMode(s => ({...s, enabled: !s.enabled}))} className={`w-10 h-5 rounded-full relative transition-colors ${silentMode.enabled ? 'bg-green-500' : 'bg-zinc-700'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${silentMode.enabled ? 'left-6' : 'left-1'}`} /></button></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/40 rounded-xl p-2 relative">
                  <span className="text-[8px] text-zinc-400 block font-black uppercase">{t.jouees}</span>
                  <div className="flex items-center justify-between mt-1">
                    <button {...handleAudibleMinus} className="btn-mini">－</button>
                    <span className="text-xs font-mono text-white mx-1">{silentMode.audible}</span>
                    <button {...handleAudiblePlus} className="btn-mini">＋</button>
                  </div>
                </div>
                <div className="bg-black/40 rounded-xl p-2 relative">
                  <span className="text-[8px] text-zinc-400 block font-black uppercase">{t.muettes}</span>
                  <div className="flex items-center justify-between mt-1">
                    <button {...handleSilentMinus} className="btn-mini">－</button>
                    <span className="text-xs font-mono text-white mx-1">{silentMode.silent}</span>
                    <button {...handleSilentPlus} className="btn-mini">＋</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mode Automation (Ramp) */}
            <div className="bg-zinc-900/60 p-4 rounded-3xl border border-white/5">
              <div className="flex justify-between items-center mb-4"><span className="text-[11px] font-black text-orange-400 uppercase">{t.automation}</span><button onClick={() => setAutomation(a => ({...a, enabled: !a.enabled}))} className={`w-10 h-5 rounded-full relative transition-colors ${automation.enabled ? 'bg-orange-500' : 'bg-zinc-700'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${automation.enabled ? 'left-6' : 'left-1'}`} /></button></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 rounded-xl p-2">
                  <span className="text-[8px] font-black uppercase text-zinc-500 block">Initial</span>
                  <div className="text-xs font-mono text-center text-white mt-1">{bpm}</div>
                </div>
                <div className="bg-black/40 rounded-xl p-2">
                  <span className="text-[8px] font-black uppercase text-zinc-500 block">Cible</span>
                  <div className="flex items-center justify-between mt-1">
                    <button {...handleTargetMinus} className="btn-mini">－</button>
                    <span className="text-xs font-mono text-cyan-400 mx-1">{automation.targetBpm}</span>
                    <button {...handleTargetPlus} className="btn-mini">＋</button>
                  </div>
                </div>
                <div className="bg-black/40 rounded-xl p-2">
                  <span className="text-[8px] font-black uppercase text-zinc-500 block">Palier</span>
                  <div className="flex items-center justify-between mt-1">
                    <button {...handleStepMinus} className="btn-mini">－</button>
                    <span className="text-xs font-mono text-white mx-1">{automation.step}</span>
                    <button {...handleStepPlus} className="btn-mini">＋</button>
                  </div>
                </div>
                <div className="bg-black/40 rounded-xl p-2">
                  <span className="text-[8px] font-black uppercase text-zinc-500 block">Mesures</span>
                  <div className="flex items-center justify-between mt-1">
                    <button {...handleIntervalMinus} className="btn-mini">－</button>
                    <span className="text-xs font-mono text-white mx-1">{automation.intervalValue}</span>
                    <button {...handleIntervalPlus} className="btn-mini">＋</button>
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