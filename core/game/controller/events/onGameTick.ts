export function onGameTickListener(): void {
    const scores = window.gameRoom._room.getScores()!;
    window.gameRoom.matchStats.scores.red = scores.red;
    window.gameRoom.matchStats.scores.blue = scores.blue;
    window.gameRoom.matchStats.scores.time = scores.time;
}
