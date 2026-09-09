import * as Messages from "../../resource/strings.js";

export enum TeamID {
    Spec = 0,
    Red = 1,
    Blue = 2
}

export function convertTeamID2Name(teamID: TeamID): string {
    switch(teamID) {
        case TeamID.Spec: {
            return Messages.teamName.specTeam;
        }
        case TeamID.Red: {
            return Messages.teamName.redTeam;
        }
        case TeamID.Blue: {
            return Messages.teamName.blueTeam;
        }
    }
}