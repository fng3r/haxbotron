import {Player} from "./Player";

export class PlayersSet {
    private _players: Map<number, Player> = new Map<number, Player>();
    private _playerIdsByConn: Map<string, number> = new Map<string, number>();
    private _playerIdsByAuth: Map<string, number> = new Map<string, number>();

    constructor(players?: Player[]) {
        if (!players) {
            return;
        }

        for (let player of players) {
            this._players.set(player.id, player);
            this._playerIdsByConn.set(player.conn, player.id);
            this._playerIdsByAuth.set(player.auth, player.id);
        }
    }

    public keys() {
        return this._players.keys();
    }

    public values() {
        return this._players.values();
    }

    public size() {
        return this._players.size;
    }

    public forEach(action: (value: Player) => void) {
        this._players.forEach(action);
    }

    public set(playerId: number, player: Player) {
        this._players.set(playerId, player);
        this._playerIdsByConn.set(player.conn, playerId);
        this._playerIdsByAuth.set(player.auth, playerId);
    }

    public delete(playerId: number) {
        const player = this._players.get(playerId);
        if (player === undefined) {
            return;
        }

        this._players.delete(playerId);
        this._playerIdsByConn.delete(player.conn);
        this._playerIdsByAuth.delete(player.auth);
    }

    public has(playerId: number) {
        return this._players.has(playerId);
    }

    public get(playerId: number) {
        return this._players.get(playerId);
    }

    public getByAuth(playerAuth: string) {
        const playerId = this._playerIdsByAuth.get(playerAuth);
        if (playerId === undefined){
            return undefined;
        }

        return this._players.get(playerId);
    }

    public getByConn(playerConn: string) {
        const playerId = this._playerIdsByConn.get(playerConn);
        if (playerId === undefined){
            return undefined;
        }

        return this._players.get(playerId);
    }
}