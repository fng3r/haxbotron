import {PlayerObject} from "../../model/GameObject/PlayerObject";
import { ServiceContainer } from "../../services/ServiceContainer";

export function cmdBb(byPlayer: PlayerObject): void {
    const services = ServiceContainer.getInstance();
    services.room.getRoom().kickPlayer(byPlayer.id, '!bb', false);
}