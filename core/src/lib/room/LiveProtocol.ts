/** Public broadcast data only: never include player auth, connection or room secrets. */
export interface LiveDisc {
    x: number; y: number; radius: number; color: number;
}
export interface LiveStadium {
    approximate?: boolean;
    name: string; width: number; height: number;
    bg?: { type?: string; width?: number; height?: number; color?: string | number; kickOffRadius?: number; cornerRadius?: number; goalLine?: number };
    vertexes?: { x: number; y: number }[];
    segments?: { v0: number; v1: number; vis?: boolean; color?: string | number; curve?: number; curveF?: number }[];
    goals?: { p0: number[]; p1: number[]; team: string }[];
}
export interface LiveFrame {
    sequence: number;
    timestamp: number;
    status: "playing" | "paused" | "stopped";
    scores: { red: number; blue: number; time: number; scoreLimit: number; timeLimit: number } | null;
    discs: (LiveDisc | null)[];
    players: { id: number; name: string; team: number; kicking?: boolean; disc: LiveDisc | null }[];
    stadium?: LiveStadium;
}
