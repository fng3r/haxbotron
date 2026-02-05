import { Room } from "../model/RoomObject/RoomObject";

/**
 * Service for managing the Haxball room instance
 * Exposes the native Haxball room API (_room) and manages room-level state
 */
export class RoomService {
    private _room: Room;
    private _link: string = '';
    private defaultStadium: string = '';
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

    constructor(room: Room) {
        this._room = room;
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
    public getRoom(): Room {
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

    public setCustomStadium(stadium: string): void {
        this._room.setCustomStadium(stadium);
    }

    // Stadium management
    public getDefaultStadium(): string {
        return this.defaultStadium;
    }

    public setDefaultStadium(stadium: string): void {
        this.defaultStadium = stadium;
    }

    public loadDefaultStadium(): void {
        this._room.setCustomStadium(this.defaultStadium);
    }

    public setScoreLimit(limit: number): void {
        this._room.setScoreLimit(limit);
    }

    public setTimeLimit(limit: number): void {
        this._room.setTimeLimit(limit);
    }

    public setTeamsLock(locked: boolean): void {
        this._room.setTeamsLock(locked);
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
