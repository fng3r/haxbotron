import JSON5 from "json5";
import type { RoomObject } from "haxball.js";
import { getStadiumData } from "../../lib/stadiumLoader.js";
import { decodeReplayStadium, type ReplayStadiumDecoder } from "./ReplayStadium.js";

/**
 * Service for managing the Haxball room instance
 * Exposes the native Haxball room API (_room) and manages room-level state
 */
export class RoomService {
    private _room: RoomObject;
    private _link: string = '';
    private stadiumSource: string | null = null;
    private pendingStadiumSource: string | null = null;
    private stadiumRevision = 0;
    private matchRecording = false;
    private stadiumName = '';
    private readonly decodeStadium: ReplayStadiumDecoder;
    private readonly onStadiumError: (error: unknown) => void;
    private defaultStadiumName: string = '';
    private teamColours: {
        red: {
            angle: number;
            textColour: number;
            teamColour1: number;
            teamColour2: number;
            teamColour3: number;
        };
        blue: {
            angle: number;
            textColour: number;
            teamColour1: number;
            teamColour2: number;
            teamColour3: number;
        };
    };

    constructor(room: RoomObject, options: {
        decodeStadium?: ReplayStadiumDecoder;
        onStadiumError?: (error: unknown) => void;
    } = {}) {
        this._room = room;
        this.decodeStadium = options.decodeStadium ?? decodeReplayStadium;
        this.onStadiumError = options.onStadiumError ?? (() => {});
        this.teamColours = {
            red: { 
                angle: 0, 
                textColour: 0xffffff, 
                teamColour1: 0xe66e55, 
                teamColour2: 0xe66e55, 
                teamColour3: 0xe66e55 
            },
            blue: { 
                angle: 0, 
                textColour: 0xffffff, 
                teamColour1: 0x5a89e5, 
                teamColour2: 0x5a89e5, 
                teamColour3: 0x5a89e5 
            }
        };
    }

    /**
     * Get the native Haxball room API object
     * Use this to access Haxball's native methods like:
     * - sendAnnouncement()
     * - kickPlayer()
     * - setScoreLimit()
     * - etc.
     */
    public getRoom(): RoomObject {
        return this._room;
    }

    public getLink(): string {
        return this._link;
    }

    public setLink(link: string): void {
        this._link = link;
    }

    // Convenience wrappers for commonly used room methods
    public sendAnnouncement(message: string, targetId: number | null = null, color: number = 0xFFFFFF, style: "normal" | "bold" | "italic" | "small" | "small-bold" | "small-italic" = "normal", sound: number = 0): void {
        this._room.sendAnnouncement(message, targetId, color, style, sound);
    }

    public sendChat(message: string, targetId?: number): void {
        this._room.sendChat(message, targetId);
    }

    // Stadium management
    public setCustomStadium(stadium: string): void {
        this._room.setCustomStadium(stadium);
        ++this.stadiumRevision;
        this.pendingStadiumSource = stadium;
        this.stadiumSource = stadium;
    }

    public setStadiumByName(mapName: string): boolean {
        const loadedStadium = getStadiumData(mapName);
        if (!loadedStadium) {
            return false;
        }

        this.setCustomStadium(loadedStadium);
        return true;
    }

    public observeStadiumChange(name: string): Promise<void> {
        this.stadiumName = name;
        const revision = ++this.stadiumRevision;
        const pending = this.pendingStadiumSource;
        this.pendingStadiumSource = null;
        // Provide geometry immediately where possible, then replace it with the
        // actual engine stadium (also handles external maps sharing a known name).
        this.stadiumSource = getStadiumData(name.toLowerCase().replace(/[^a-z0-9]/g, ""))
            ?? JSON.stringify({ name, width: 420, height: 200, approximate: true, bg: { type: "none" } });
        if (pending) {
            try { if (JSON5.parse(pending).name === name) this.stadiumSource = pending; } catch { /* use fallback */ }
        }
        return this.captureReplayStadium(name, revision);
    }

    private async captureReplayStadium(name: string, revision: number): Promise<void> {
        // Never replace an active match recording. Both recording API calls are
        // synchronous; no game tick or match start can occur between them.
        if (this.matchRecording || this._room.getScores() !== null) return;
        try {
            this._room.startRecording();
            const replay = this._room.stopRecording();
            if (!replay || replay.byteLength > 1024 * 1024) throw new Error("Invalid stadium probe replay");
            const stadium = await this.decodeStadium(replay);
            if (revision !== this.stadiumRevision || !stadium) return;
            if (stadium.name !== name) throw new Error("Replay stadium does not match the active map");
            this.stadiumSource = JSON.stringify(stadium);
        } catch (error) {
            if (revision === this.stadiumRevision) this.onStadiumError(error);
        }
    }

    public startMatchRecording(): void {
        this._room.startRecording();
        this.matchRecording = true;
    }

    public stopMatchRecording(): Uint8Array | null {
        try { return this._room.stopRecording(); }
        finally { this.matchRecording = false; }
    }

    public refreshStadiumGeometry(): void {
        if (this.stadiumName && this.stadiumSource?.includes('"approximate":true')) {
            void this.observeStadiumChange(this.stadiumName);
        }
    }

    public getStadiumSource(): string | null {
        return this.stadiumSource;
    }

    public getDefaultStadium(): string {
        return this.defaultStadiumName;
    }

    public setDefaultStadium(stadiumName: string): void {
        this.defaultStadiumName = stadiumName;
    }

    public loadDefaultStadium(): boolean {
        return this.setStadiumByName(this.defaultStadiumName);
    }

    public setScoreLimit(limit: number): void {
        this._room.setScoreLimit(limit);
    }

    public setTimeLimit(limit: number): void {
        this._room.setTimeLimit(limit);
    }

    public setPassword(password: string | null): void {
        this._room.setPassword(password);
    }

    public setTeamsLock(locked: boolean): void {
        this._room.setTeamsLock(locked);
    }

    // Slot reservation policy helpers
    public shouldEnableReservedSlotPassword(playersCount: number, maxPlayers: number): boolean {
        return playersCount === maxPlayers - 1;
    }

    public isReservedSlotViolation(playersCount: number, maxPlayers: number, isHighPrivilege: boolean): boolean {
        return playersCount === maxPlayers && !isHighPrivilege;
    }

    // Team colors management
    public getTeamColours() {
        return this.teamColours;
    }

    public getTeamColour(team: 'red' | 'blue') {
        return this.teamColours[team];
    }

    public setTeamColours(team: 'red' | 'blue', colours: {
        angle: number;
        textColour: number;
        teamColour1: number;
        teamColour2: number;
        teamColour3: number;
    }): void {
        this.teamColours[team] = colours;
        // Also update the native room API
        const teamId = team === 'red' ? 1 : 2;
        this._room.setTeamColors(teamId, colours.angle, colours.textColour, [colours.teamColour1, colours.teamColour2, colours.teamColour3]);
    }
}
