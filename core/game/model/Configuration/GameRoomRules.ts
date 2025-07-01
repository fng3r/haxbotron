export interface GameRoomRules {
    timeLimit: number // limit time for end the game
    scoreLimit: number // limit score for end the game
    teamLock: boolean // limit moving teams by self
    autoAdmin: boolean // auto appoint admin
    whitelistEnabled: boolean // auto emcee mode
    defaultMapName: string // select default stadium name for the game.
    customJSONOptions?: string // JSON stringified cumstom options.
}
