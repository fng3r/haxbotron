import { ServiceContainer } from "../../services/ServiceContainer";

export function onGameTickListener(): void {
    const services = ServiceContainer.getInstance();
    const room = services.room.getRoom();
    
    const scores = room.getScores()!;
    services.match.updateScores(scores.red, scores.blue, scores.time);
}
