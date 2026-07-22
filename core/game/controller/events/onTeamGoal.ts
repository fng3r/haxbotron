import type { ScoresObject } from "haxball.js";
import { TeamID } from "../../model/GameObject/TeamID";
import * as LangRes from "../../resource/strings";
import { RoomRuntime } from "../../runtime/RoomRuntime";
import * as Tst from "../../shared/Translator";

export async function onTeamGoalListener(runtime: RoomRuntime, team: TeamID): Promise<void> {
    // Event called when a team scores a goal.
    const room = runtime.room.getRoom();
    const playerList = runtime.players.getPlayerList();
    
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
        const scoringPlayer = playerList.get(scorer);
        if (!scoringPlayer) {
            placeholderGoal.scorerName = `Player#${scorer} [LEFT]`;
            const goalMsg = Tst.maketext(LangRes.onGoal.goal, placeholderGoal);
            runtime.room.sendAnnouncement(goalMsg, null, 0xFFFFFF, "normal", 0);
            runtime.logger.i('onTeamGoal', goalMsg);
            return;
        }

        if (scoringPlayer.team === team) { // if the goal is normal goal (not OG)
            placeholderGoal.scorerName = scoringPlayer.name;
            scoringPlayer.matchRecord.goals++;
            let goalMsg: string = Tst.maketext(LangRes.onGoal.goal, placeholderGoal);
            if (assistant !== undefined && scorer != assistant) {
                const assistingPlayer = playerList.get(assistant);
                if (!assistingPlayer) {
                    placeholderGoal.assistantName = `Player#${assistant} [LEFT]`;
                    goalMsg = Tst.maketext(LangRes.onGoal.goalWithAssist, placeholderGoal);
                } else if (assistingPlayer.team === team) {
                    // records assist when the player who assists is not same as the player scored, and is not from other team.
                    placeholderGoal.assistantName = assistingPlayer.name;
                    assistingPlayer.matchRecord.assists++;
                    goalMsg = Tst.maketext(LangRes.onGoal.goalWithAssist, placeholderGoal);
                }
            }
            runtime.room.sendAnnouncement(goalMsg, null, 0xFFFFFF, "normal", 0);
            runtime.logger.i('onTeamGoal', goalMsg);
        } else { // if the goal is OG
            placeholderGoal.ogName = scoringPlayer.name;
            scoringPlayer.matchRecord.ogs++;
            runtime.room.sendAnnouncement(Tst.maketext(LangRes.onGoal.og, placeholderGoal), null, 0xFFFFFF, "normal", 0);
            runtime.logger.i('onTeamGoal', `${scoringPlayer.name}#${scorer} made an OG.`);
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
