import { ServiceContainer } from "../../services/ServiceContainer";

export function onGameTickListener(): void {
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    
    const scores = room.getScores()!;
    services.match.updateScore('red', scores.red);
    services.match.updateScore('blue', scores.blue);
    services.match.updateTime(scores.time);
}
