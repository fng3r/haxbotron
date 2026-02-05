import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { ScoresObject } from "../../model/GameObject/ScoresObject";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { ServiceContainer } from "../../services/ServiceContainer";

export async function onTeamVictoryListener(scores: ScoresObject): Promise<void> {
    // Event called when a team 'wins'. not just when game ended.
    // records vicotry in stats. total games also counted in this event.
    // Haxball developer Basro said, The game will be stopped automatically after a team victory. (victory -> stop)
    const services = ServiceContainer.getInstance();
    const ballStack = services.match.getBallStack();
    
    let placeholderVictory = {
        teamID: TeamID.Spec,
        winnerTeam: '',
        redScore: scores.red,
        blueScore: scores.blue,
        possTeamRed: ballStack.possCalculate(TeamID.Red),
        possTeamBlue: ballStack.possCalculate(TeamID.Blue)
    };

    let winningMessage: string = '';

    let winnerTeamID: TeamID;
    let loserTeamID: TeamID;

    if (scores.red > scores.blue) {
        winnerTeamID = TeamID.Red;
        loserTeamID = TeamID.Blue;
        placeholderVictory.winnerTeam = 'Red';
    } else {
        winnerTeamID = TeamID.Blue;
        loserTeamID = TeamID.Red;
        placeholderVictory.winnerTeam = 'Blue';
    }
    placeholderVictory.teamID = winnerTeamID;
    winningMessage = Tst.maketext(LangRes.onVictory.victory, placeholderVictory);

    services.match.setPlaying(false);

    // notify victory
    services.logger.i('onTeamVictory', `The game has ended. Score: ${scores.red}-${scores.blue}.`);
    services.room.sendAnnouncement(winningMessage, null, 0xFFFFFF, "bold", 1);
}
