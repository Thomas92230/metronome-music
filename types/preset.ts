export type TempoRamp = {
  enabled: boolean;
  targetBpm: number;
  step: number; // variation BPM
  everyBars: number; // toutes les X mesures
};

export type Preset = {
  name: string;
  bpm: number;
  beatsPerBar: number;
  subdivision: "quarter" | "eighth" | "triplet";
  tempoRamp?: TempoRamp;
};
