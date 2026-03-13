import { Player } from "./Player";
import { TeamID } from "./TeamID";

export class KickStack {
    /*
    KickStack is a Stack for tracing who kicked the ball.
    It can be used for processing who goaled, who made OG, and so on.
    */

    private _store: number[] = [];
    private ballPossession = {
        red: 0,
        blue: 0
    };
    private lastTouched = {
        id: 0,
        team: 0
    };

    public push(playerID: number): void {
        this._store.push(playerID);
    }

    public pop(): number | undefined {
        return this._store.pop();
    }

    public clear(): void {
        this._store = [];
        this.lastTouched = {
            id: 0,
            team: 0
        };
    }

    public getLastTouchPlayerID(): number {
        return this.lastTouched.id;
    }

    public submitTouch(player: Player): void {
        this.lastTouched = {
            id: player.id,
            team: player.team
        };
        this.push(player.id);
        this.possCount(player.team);
    }

    public passJudgment(team: TeamID): boolean { // 1: red team, 2: blue team
        return this.lastTouched.team == team;
    }

    public possCount(team: TeamID): void { // 1: red team, 2: blue team
        if(team == TeamID.Red) { 
            this.ballPossession.red++;
        } else if(team == TeamID.Blue) {
            this.ballPossession.blue++;
        }
    }

    public possCalculate(team: TeamID): number { // 1: red team, 2: blue team
        if(this.ballPossession.red == 0 && this.ballPossession.blue == 0) {
            return 0;
        } else {
            if(team === TeamID.Red) {
                return Math.round((this.ballPossession.red / (this.ballPossession.red + this.ballPossession.blue)) * 100);
            } else if(team === TeamID.Blue) {
                return Math.round((this.ballPossession.blue / (this.ballPossession.red + this.ballPossession.blue)) * 100);
            }
        }
        return 0;
    }

    public possClear(): void {
        this.ballPossession = {red: 0, blue: 0};
    }
}
