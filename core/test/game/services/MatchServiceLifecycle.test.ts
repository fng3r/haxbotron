/// <reference types="jest" />

import { TeamID } from "../../../game/model/GameObject/TeamID";
import { MatchService } from "../../../game/services/MatchService";

describe("MatchService lifecycle helpers", () => {
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
        const initSpy = jest.spyOn(stack, "initTouchInfo");
        const possClearSpy = jest.spyOn(stack, "possClear");

        service.setPlaying(true);
        service.stopMatch();

        expect(service.isPlaying()).toBe(false);
        expect(initSpy).toHaveBeenCalled();
        expect(clearSpy).toHaveBeenCalled();
        expect(possClearSpy).toHaveBeenCalled();
    });
});
