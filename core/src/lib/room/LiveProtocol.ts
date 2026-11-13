/** Public broadcast data only: never include player auth, connection or room secrets. */
export interface LiveDisc {
    x: number; y: number; radius: number; color: number;
}
export interface LiveKick {
    id: string;
    timestamp: number;
    playerId: number;
    matchId: string | null;
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
    players: { id: number; name: string; team: number; avatarNumber?: number; kicking?: boolean; disc: LiveDisc | null }[];
    stadium?: LiveStadium;
    goal?: LiveGoal;
    matchId?: string | null;
    timeline?: LiveMatchTimeline;
}

export interface LiveMatchEvent {
    id: string;
    type: "start" | "goal" | "pause" | "resume" | "victory" | "stop" | "join" | "leave" | "teamChange";
    time: number;
    timestamp: number;
    actor?: { id: number; name: string };
    player?: { id: number; name: string };
    team?: 0 | 1 | 2;
    scores?: { red: number; blue: number };
    goal?: LiveGoal;
}

export interface LiveMatchTimeline {
    matchId: string;
    startedAt: number;
    endedAt: number | null;
    revision: number;
    events: LiveMatchEvent[];
}

export interface LiveGoal {
    id: string;
    team: 1 | 2;
    scores: { red: number; blue: number };
    scorer: { id: number; name: string } | null;
    assistant: { id: number; name: string } | null;
    ownGoal: boolean;
}

/** Public snapshot of a completed match; no player auth or connection data. */
export interface CompletedMatch extends LiveMatchTimeline {
    endedAt: number;
    startingLineups: { red: { id: number; name: string }[]; blue: { id: number; name: string }[] };
    playtime: number;
    scores: { red: number; blue: number };
    outcome: 'victory' | 'stopped';
}
