import { KickStack } from "../model/GameObject/BallTrace";
import { PlayerObject } from "../model/GameObject/PlayerObject";

/**
 * Service for managing match state and statistics
 */
export class MatchService {
    private isGamingNow: boolean = false;
    private ballStack: KickStack;
    private matchStats: {
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
    };

    constructor() {
        this.ballStack = KickStack.getInstance();
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
        this.isGamingNow = true;
        this.matchStats.startedAt = Date.now();
        this.matchStats.startingLineup = startingLineup;
        this.matchStats.scores = { red: 0, blue: 0, time: 0 };
    }

    public stopMatch(): void {
        this.isGamingNow = false;
    }

    public updateScore(team: 'red' | 'blue', score: number): void {
        this.matchStats.scores[team] = score;
    }

    public updateTime(time: number): void {
        this.matchStats.scores.time = time;
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

    // Ball tracking (kick stack, possession, last touch)
    public getBallStack(): KickStack {
        return this.ballStack;
    }

    public consumeGoalTouches(): { scorer?: number; assistant?: number } {
        const scorer = this.ballStack.pop();
        const assistant = this.ballStack.pop();
        this.ballStack.clear();
        this.ballStack.initTouchInfo();
        return { scorer, assistant };
    }
}
