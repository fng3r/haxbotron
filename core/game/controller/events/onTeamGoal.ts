import { ScoresObject } from "../../model/GameObject/ScoresObject";
import { TeamID } from "../../model/GameObject/TeamID";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";

export async function onTeamGoalListener(team: TeamID): Promise<void> {
    // Event called when a team scores a goal.
    let scores: ScoresObject | null = window.gameRoom._room.getScores(); //get scores object (it includes time data about seconds elapsed)
    window.gameRoom.logger.i('onTeamGoal', `Goal time logger (secs):${Math.round(scores?.time || 0)}`);

    var placeholderGoal = { 
        teamID: team,
        teamName: '',
        scorerID: 0,
        scorerName: '',
        assistID: 0,
        assistName: '',
        ogID: 0,
        ogName: '',
        score: buildScoreString(scores?.red, scores?.blue),
        time: buildMatchTimeString(scores?.time),
    };

    if (team === TeamID.Red) {
        // if red team win
        placeholderGoal.teamName = 'Red';
    } else {
        // if blue team win
        placeholderGoal.teamName = 'Blue';
    }
    // identify who has goaled.
    var touchPlayer: number | undefined = window.gameRoom.ballStack.pop();
    var assistPlayer: number | undefined = window.gameRoom.ballStack.pop();
    window.gameRoom.ballStack.clear(); // clear the stack.
    window.gameRoom.ballStack.initTouchInfo(); // clear touch info
    if (touchPlayer !== undefined) {
        // check whether or not it is an OG. and process it!
        if (window.gameRoom.playerList.get(touchPlayer)!.team === team) { // if the goal is normal goal (not OG)
            placeholderGoal.scorerID = window.gameRoom.playerList.get(touchPlayer)!.id;
            placeholderGoal.scorerName = window.gameRoom.playerList.get(touchPlayer)!.name;
            window.gameRoom.playerList.get(touchPlayer)!.matchRecord.goals++; // record goal in match record
            let goalMsg: string = Tst.maketext(LangRes.onGoal.goal, placeholderGoal);
            if (assistPlayer !== undefined && touchPlayer != assistPlayer && window.gameRoom.playerList.get(assistPlayer)!.team === team) {
                // records assist when the player who assists is not same as the player goaled, and is not other team.
                placeholderGoal.assistID = window.gameRoom.playerList.get(assistPlayer)!.id;
                placeholderGoal.assistName = window.gameRoom.playerList.get(assistPlayer)!.name;
                window.gameRoom.playerList.get(assistPlayer)!.matchRecord.assists++; // record assist in match record
                //setPlayerData(window.playerList.get(assistPlayer)!);
                goalMsg = Tst.maketext(LangRes.onGoal.goalWithAssist, placeholderGoal);
            }
            window.gameRoom._room.sendAnnouncement(goalMsg, null, 0xFFFFFF, "normal", 0);
            window.gameRoom.logger.i('onTeamGoal', goalMsg);
        } else { // if the goal is OG
            placeholderGoal.ogID = touchPlayer;
            placeholderGoal.ogName = window.gameRoom.playerList.get(touchPlayer)!.name;
            window.gameRoom.playerList.get(touchPlayer)!.matchRecord.ogs++; // record OG in match record
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onGoal.og, placeholderGoal), null, 0xFFFFFF, "normal", 0);
            window.gameRoom.logger.i('onTeamGoal', `${window.gameRoom.playerList.get(touchPlayer)!.name}#${touchPlayer} made an OG.`);
        }
    }
}

const buildMatchTimeString = (totalSeconds?: number): string => {
    if (!totalSeconds) {
        return '00:00';
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const buildScoreString = (redScore?: number, blueScore?: number): string => {
    return `${redScore || 0}-${blueScore || 0}`;
};
