import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { ServiceContainer } from "../../services/ServiceContainer";

export function onPlayerBallKickListener(player: PlayerObject): void {
    // Event called when a player kicks the ball.
    // records player's id, team when the ball was kicked
    const services = ServiceContainer.getInstance();
    const playerList = services.player.getPlayerList();
    services.match.recordBallKick(player, playerList);
}
