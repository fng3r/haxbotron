import CircularArray from "./CircularArray";

export default class ChatActivityMap {
    private _trackActionsCount;
    private _map: Map<number, CircularArray<number>>;

    constructor(trackActionsCount: number) {
        this._trackActionsCount = trackActionsCount;
        this._map = new Map();
    }

    get(playerId: number): number[] {
        if (this._map.has(playerId)) {
            return this._map.get(playerId)!.getLastNItems(this._trackActionsCount);
        }

        return [];
    }

    add(playerId: number, timestamp: number): void {
        if (!this._map.has(playerId)) {
            this._map.set(playerId, new CircularArray<number>(this._trackActionsCount));
        }
        this._map.get(playerId)!.push(timestamp);
    }

    clear(playerId: number): void {
        if (!this._map.has(playerId)) {
            return;
        }

        this._map.get(playerId)!.clear();
    }
}