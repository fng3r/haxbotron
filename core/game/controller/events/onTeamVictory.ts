import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import * as Tst from "../../shared/Translator";

export async function onTeamVictoryListener(runtime: RoomRuntime, scores: ScoresObject): Promise<void> {
    // Event called when a team 'wins'. not just when game ended.
    // records vicotry in stats. total games also counted in this event.
    // Haxball developer Basro said, The game will be stopped automatically after a team victory. (victory -> stop)
    const possessionSummary = runtime.match.getPossessionSummary();

    let message = '';
    const winnerTeam = scores.red > scores.blue ? TeamID.Red : TeamID.Blue;
    message = Tst.maketext(LangRes.onVictory.victory, {
        winnerTeam: convertTeamID2Name(winnerTeam),
        redScore: scores.red,
        blueScore: scores.blue,
        possTeamRed: possessionSummary.possTeamRed,
        possTeamBlue: possessionSummary.possTeamBlue
    });

    runtime.match.setPlaying(false);

    runtime.logger.i('onTeamVictory', `The game has ended. Score: ${scores.red}-${scores.blue}.`);
    runtime.room.sendAnnouncement(message, null, 0xFFFFFF, "bold", 1);
}
