// hooks/useMetronome.ts
import { useEffect, useState } from "react";
import { onBeat } from "../audio/metronomeEngine";

export function useMetronome() {
  const [beat, setBeat] = useState(0);
  const [isAccent, setIsAccent] = useState(false);
  const [currentBpm, setCurrentBpm] = useState(120);

  useEffect(() => {
    // On stocke la fonction de nettoyage renvoyée par onBeat
    const unsubscribe = onBeat((newBeat, accent, bpm) => {
      setBeat(newBeat);
      setIsAccent(accent);
      setCurrentBpm(bpm); // ✅ Permet de mettre à jour l'UI quand le tempo change tout seul
    });

    // On s'assure de retourner une fonction void (Destructor)
    return () => {
      unsubscribe();
    };
  }, []); // [] signifie que l'abonnement ne se fait qu'une fois au montage

  return { beat, isAccent, currentBpm };
}