import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { setBanlistDataToDB } from "../Storage";

const DEFAULT_KICKRATE = {
    min: 6,
    burst: 12,
    rate: 4
}

export function onGameStartListener(byPlayer: PlayerObject | null): void {
    /* Event called when a game starts.
        byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
    let placeholderStart = {
        playerID: 0,
        playerName: '',
        gameRuleName: window.gameRoom.config.rules.ruleName,
        gameRuleLimitTime: window.gameRoom.config.rules.requisite.timeLimit,
        gameRuleLimitScore: window.gameRoom.config.rules.requisite.scoreLimit,
        gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers,
        possTeamRed: window.gameRoom.ballStack.possCalculate(TeamID.Red),
        possTeamBlue: window.gameRoom.ballStack.possCalculate(TeamID.Blue),
        streakTeamName: convertTeamID2Name(window.gameRoom.winningStreak.teamID),
        streakTeamCount: window.gameRoom.winningStreak.count,
        teamExpectationRed: 0,
        teamExpectationBlue: 0
    };

    window.gameRoom.isGamingNow = true; // turn on

    let msg = `The game has been started.`;
    if (byPlayer !== null && byPlayer.id !== 0) {
        placeholderStart.playerID = byPlayer.id;
        placeholderStart.playerName = byPlayer.name;
        msg += `(by ${byPlayer.name}#${byPlayer.id})`;
    }

    window.gameRoom._room.setKickRateLimit(DEFAULT_KICKRATE.min, DEFAULT_KICKRATE.rate, DEFAULT_KICKRATE.burst)

    // replay record start
    window.gameRoom._room.startRecording();

    window.gameRoom.logger.i('onGameStart', msg);
}
