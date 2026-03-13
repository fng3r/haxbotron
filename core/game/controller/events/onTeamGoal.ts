import { TeamID } from "../../model/GameObject/TeamID";
import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import * as Tst from "../Translator";

export async function onTeamGoalListener(runtime: RoomRuntime, team: TeamID): Promise<void> {
    // Event called when a team scores a goal.
    const room = runtime.room.getRoom();
    const playerList = runtime.player.getPlayerList();
    
    let scores: ScoresObject | null = room.getScores(); //get scores object (it includes time data about seconds elapsed)
    runtime.logger.i('onTeamGoal', `Goal time logger (secs):${Math.round(scores?.time || 0)}`);

    var placeholderGoal = { 
        teamID: team,
        teamName: '',
        scorerName: '',
        assistantName: '',
        ogName: '',
        score: formatScore(scores?.red, scores?.blue),
        time: formatMatchTime(scores?.time),
    };

    if (team === TeamID.Red) {
        placeholderGoal.teamName = 'Red';
    } else {
        placeholderGoal.teamName = 'Blue';
    }

    const { scorer, assistant } = runtime.match.consumeGoalTouches();
    if (scorer !== undefined) {
        // check whether or not it is an OG. and process it!
        if (playerList.get(scorer)!.team === team) { // if the goal is normal goal (not OG)
            placeholderGoal.scorerName = playerList.get(scorer)!.name;
            playerList.get(scorer)!.matchRecord.goals++;
            let goalMsg: string = Tst.maketext(LangRes.onGoal.goal, placeholderGoal);
            if (assistant !== undefined && scorer != assistant && playerList.get(assistant)!.team === team) {
                // records assist when the player who assists is not same as the player goaled, and is not other team.
                placeholderGoal.assistantName = playerList.get(assistant)!.name;
                playerList.get(assistant)!.matchRecord.assists++;
                goalMsg = Tst.maketext(LangRes.onGoal.goalWithAssist, placeholderGoal);
            }
            runtime.room.sendAnnouncement(goalMsg, null, 0xFFFFFF, "normal", 0);
            runtime.logger.i('onTeamGoal', goalMsg);
        } else { // if the goal is OG
            placeholderGoal.ogName = playerList.get(scorer)!.name;
            playerList.get(scorer)!.matchRecord.ogs++;
            runtime.room.sendAnnouncement(Tst.maketext(LangRes.onGoal.og, placeholderGoal), null, 0xFFFFFF, "normal", 0);
            runtime.logger.i('onTeamGoal', `${playerList.get(scorer)!.name}#${scorer} made an OG.`);
        }
    }
}

const formatMatchTime = (totalSeconds?: number): string => {
    if (!totalSeconds) {
        return '00:00';
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const formatScore = (redScore?: number, blueScore?: number): string => {
    return `${redScore || 0}-${blueScore || 0}`;
};
