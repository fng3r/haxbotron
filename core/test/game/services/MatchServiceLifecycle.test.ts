/// <reference types="jest" />

import { describe, expect, it, jest } from "@jest/globals";
import { TeamID } from "../../../game/model/GameObject/TeamID";
import { MatchService } from "../../../game/services/MatchService";

describe("MatchService lifecycle helpers", () => {
    it("updates live stats from native score snapshot", () => {
        const service = new MatchService();

        service.updateScores(3, 2, 97);

        expect(service.getMatchStats().scores).toEqual({
            red: 3,
            blue: 2,
            time: 97
        });
    });

    it("returns possession summary from ball stack", () => {
        const service = new MatchService();
        const possSpy = jest.spyOn(service.getBallStack(), "possCalculate");
        possSpy.mockReturnValueOnce(60).mockReturnValueOnce(40);

        const summary = service.getPossessionSummary();

        expect(summary).toEqual({ possTeamRed: 60, possTeamBlue: 40 });
        expect(possSpy).toHaveBeenNthCalledWith(1, TeamID.Red);
        expect(possSpy).toHaveBeenNthCalledWith(2, TeamID.Blue);
    });

    it("stops match and resets tracking state", () => {
        const service = new MatchService();
        const stack = service.getBallStack();
        const clearSpy = jest.spyOn(stack, "clear");
        const possClearSpy = jest.spyOn(stack, "possClear");

        service.setPlaying(true);
        service.stopMatch();

        expect(service.isPlaying()).toBe(false);
        expect(clearSpy).toHaveBeenCalled();
        expect(possClearSpy).toHaveBeenCalled();
    });

    it("records ball touch, pass and possession on kick", () => {
        const service = new MatchService();
        const stack = service.getBallStack();
        const player = {
            id: 1,
            team: TeamID.Red
        } as any;
        const current = { team: TeamID.Red, matchRecord: { balltouch: 0, passed: 0 } };
        const previous = { team: TeamID.Red, matchRecord: { balltouch: 0, passed: 0 } };

        const playerList = {
            get: jest.fn((id: number) => {
                if (id === 1) {
                    return current;
                }
                if (id === 2) {
                    return previous;
                }
                return undefined;
            })
        } as any;

        jest.spyOn(stack, "passJudgment").mockReturnValue(true);
        jest.spyOn(stack, "getLastTouchPlayerID").mockReturnValue(2);
        const submitTouchSpy = jest.spyOn(stack, "submitTouch");

        service.recordBallKick(player, playerList);

        expect(current.matchRecord.balltouch).toBe(1);
        expect(previous.matchRecord.passed).toBe(1);
        expect(submitTouchSpy).toHaveBeenCalledWith(current);
    });
});
