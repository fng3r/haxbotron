import { Player } from "../model/GameObject/Player";
import { PlayersSet } from "../model/GameObject/PlayersSet";

/**
 * Service for managing the player list and player operations
 */
export class PlayerService {
    private playerList: PlayersSet;

    constructor() {
        this.playerList = new PlayersSet();
    }

    public getPlayerList(): PlayersSet {
        return this.playerList;
    }

    public getPlayer(id: number): Player | undefined {
        return this.playerList.get(id);
    }

    public addPlayer(player: Player): void {
        this.playerList.set(player.id, player);
    }

    public removePlayer(id: number): void {
        this.playerList.delete(id);
    }

    public hasPlayer(id: number): boolean {
        return this.playerList.has(id);
    }

    public getAllPlayers(): Player[] {
        return Array.from(this.playerList.values());
    }

    public getPlayerCount(): number {
        return this.playerList.size();
    }

    public findPlayerByName(name: string): Player | undefined {
        for (const player of this.playerList.values()) {
            if (player.name === name) {
                return player;
            }
        }
        return undefined;
    }

    public findPlayerByAuth(auth: string): Player | undefined {
        for (const player of this.playerList.values()) {
            if (player.auth === auth) {
                return player;
            }
        }
        return undefined;
    }
}
