import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { ServiceContainer } from "../../services/ServiceContainer";

export function onPlayerBallKickListener(player: PlayerObject): void {
    // Event called when a player kicks the ball.
    // records player's id, team when the ball was kicked
    const services = ServiceContainer.getInstance();
    const ballStack = services.match.getBallStack();
    const playerList = services.player.getPlayerList();
    
    const placeholderBall = {
        playerID: player.id,
        playerName: player.name,
    };

    playerList.get(player.id)!.matchRecord.balltouch++; // add count of ball touch in match record

    if (ballStack.passJudgment(player.team) && playerList.has(ballStack.getLastTouchPlayerID())) {
        playerList.get(ballStack.getLastTouchPlayerID())!.matchRecord.passed++; // add count of pass success in match record
    }

    ballStack.touchTeamSubmit(player.team);
    ballStack.touchPlayerSubmit(player.id); // refresh who touched the ball in last

    ballStack.push(player.id);
    ballStack.possCount(player.team);
}
