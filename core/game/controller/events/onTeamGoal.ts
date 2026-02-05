import { ScoresObject } from "../../model/GameObject/ScoresObject";
import { TeamID } from "../../model/GameObject/TeamID";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { ServiceContainer } from "../../services/ServiceContainer";

export async function onTeamGoalListener(team: TeamID): Promise<void> {
    // Event called when a team scores a goal.
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    const ballStack = services.match.getBallStack();
    const playerList = services.player.getPlayerList();
    
    let scores: ScoresObject | null = room.getScores(); //get scores object (it includes time data about seconds elapsed)
    services.logger.i('onTeamGoal', `Goal time logger (secs):${Math.round(scores?.time || 0)}`);

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
    var touchPlayer: number | undefined = ballStack.pop();
    var assistPlayer: number | undefined = ballStack.pop();
    ballStack.clear(); // clear the stack.
    ballStack.initTouchInfo(); // clear touch info
    if (touchPlayer !== undefined) {
        // check whether or not it is an OG. and process it!
        if (playerList.get(touchPlayer)!.team === team) { // if the goal is normal goal (not OG)
            placeholderGoal.scorerID = playerList.get(touchPlayer)!.id;
            placeholderGoal.scorerName = playerList.get(touchPlayer)!.name;
            playerList.get(touchPlayer)!.matchRecord.goals++; // record goal in match record
            let goalMsg: string = Tst.maketext(LangRes.onGoal.goal, placeholderGoal);
            if (assistPlayer !== undefined && touchPlayer != assistPlayer && playerList.get(assistPlayer)!.team === team) {
                // records assist when the player who assists is not same as the player goaled, and is not other team.
                placeholderGoal.assistID = playerList.get(assistPlayer)!.id;
                placeholderGoal.assistName = playerList.get(assistPlayer)!.name;
                playerList.get(assistPlayer)!.matchRecord.assists++; // record assist in match record
                //setPlayerData(window.playerList.get(assistPlayer)!);
                goalMsg = Tst.maketext(LangRes.onGoal.goalWithAssist, placeholderGoal);
            }
            services.room.sendAnnouncement(goalMsg, null, 0xFFFFFF, "normal", 0);
            services.logger.i('onTeamGoal', goalMsg);
        } else { // if the goal is OG
            placeholderGoal.ogID = touchPlayer;
            placeholderGoal.ogName = playerList.get(touchPlayer)!.name;
            playerList.get(touchPlayer)!.matchRecord.ogs++; // record OG in match record
            services.room.sendAnnouncement(Tst.maketext(LangRes.onGoal.og, placeholderGoal), null, 0xFFFFFF, "normal", 0);
            services.logger.i('onTeamGoal', `${playerList.get(touchPlayer)!.name}#${touchPlayer} made an OG.`);
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
