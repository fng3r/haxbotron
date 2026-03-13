import { KickStack } from "../model/GameObject/BallTrace";
import { PlayersSet } from "../model/GameObject/PlayersSet";
import { TeamID } from "../model/GameObject/TeamID";

export interface MatchStats {
    startedAt: number;
    startingLineup: {
        red: PlayerObject[];
        blue: PlayerObject[];
    };
    scores: {
        red: number;
        blue: number;
        time: number;
    };
}

export interface PossessionSummary {
    possTeamRed: number;
    possTeamBlue: number;
}

/**
 * Service for managing match state and statistics
 */
export class MatchService {
    private isGamingNow: boolean = false;
    private ballStack: KickStack;
    private matchStats: MatchStats;

    constructor() {
        this.ballStack = new KickStack();
        this.matchStats = {
            startedAt: Date.now(),
            startingLineup: {
                red: [],
                blue: []
            },
            scores: {
                red: 0,
                blue: 0,
                time: 0
            }
        };
    }

    public isPlaying(): boolean {
        return this.isGamingNow;
    }

    public setPlaying(playing: boolean): void {
        this.isGamingNow = playing;
    }

    public getMatchStats() {
        return this.matchStats;
    }

    public startMatch(startingLineup: { red: PlayerObject[]; blue: PlayerObject[] }): void {
        this.setPlaying(true);
        this.resetStats();
        this.matchStats.startingLineup = startingLineup;
    }

    public updateScores(redScore: number, blueScore: number, time: number): void {
        this.matchStats.scores = { red: redScore, blue: blueScore, time: time };
    }

    public resetStats(): void {
        this.matchStats = {
            startedAt: Date.now(),
            startingLineup: {
                red: [],
                blue: []
            },
            scores: {
                red: 0,
                blue: 0,
                time: 0
            }
        };
    }

    public getBallStack(): KickStack {
        return this.ballStack;
    }

    public recordBallKick(player: PlayerObject, playerList: PlayersSet): void {
        const trackedPlayer = playerList.get(player.id);
        if (!trackedPlayer) {
            return;
        }

        trackedPlayer.matchRecord.balltouch++;

        if (this.ballStack.passJudgment(player.team)) {
            const previousPlayer = playerList.get(this.ballStack.getLastTouchPlayerID());
            if (previousPlayer) {
                previousPlayer.matchRecord.passed++;
            }
        }

        this.ballStack.submitTouch(trackedPlayer);
    }

    public consumeGoalTouches(): { scorer?: number; assistant?: number } {
        const scorer = this.ballStack.pop();
        const assistant = this.ballStack.pop();
        this.ballStack.clear();
        return { scorer, assistant };
    }

    public getPossessionSummary(): PossessionSummary {
        return {
            possTeamRed: this.ballStack.possCalculate(TeamID.Red),
            possTeamBlue: this.ballStack.possCalculate(TeamID.Blue)
        };
    }

    public stopMatch(): void {
        this.setPlaying(false);
        this.ballStack.clear();
        this.ballStack.possClear();
    }
}
