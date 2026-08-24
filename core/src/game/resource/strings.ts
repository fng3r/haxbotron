// YOU CAN USE A PLACEHOLDER FOR INTERPOLATION. FOR EXAMPLE, 'Hello, My name is {name}.'
// THE TYPES OF PLACEHOLDER ARE LIMITED BY STRING SET.

export const scheduler = {
    advertise: ''
    ,autoUnmute: '🔊 Player {targetName}#{targetID} is no longer muted.'
}

export const teamName = {
    specTeam: 'Spec'
    ,redTeam: 'Red'
    ,blueTeam: 'Blue'
}

export const antitrolling = {
    chatFlood: {
        muteReason: '🔇 {playerName}#{playerID} was muted for flooding (3 minutes).'
    }
}

export const command = {
    _ErrorNoPermission: '❌ You are not an admin. You can\'t do this.'
    ,_ErrorGameStartedAlready: '❌ Can\'t do this during a game.'
    ,_ErrorNoPlayer: '❌ Wrong player ID. 📑 You can check IDs with the !list command'
    ,_ErrorWrongCommand : '❌ Invalid command. 📑 Use !help or !help COMMAND for details.'
    ,help: '📑 List of available commands:\n' +
           '📑 !about, !adm, !auth, !bb, !deanon, !list, !listroles, !map, !staff\n' +
           '📑 !freeze, !mute, !mutes, !ban, !bans, !setpassword, !switch\n' +
           '📑 !help COMMAND - shows command help. (eg. !help deanon).'
    ,helpman: { // detailed description for a command
        _ErrorWrongCommand : '❌ This command is unknown or disabled.'
        ,help: '📑 !help COMMAND - shows how to use the COMMAND.'
        ,about: '📑 !about - shows basic information about this bot.'
        ,adm: '📑 !adm - makes the player a room admin.'
        ,auth: '📑 !auth - shows a player\'s public ID (eg: !auth, !auth #12)'
        ,bb: '📑 !bb - leaves the room.'
        ,deanon: '📑 !deanon #ID - shows a player\'s nickname history (eg: !deanon #12)'
        ,list: '📑 !list red/blue/spec - lists all players of that team.'
        ,listroles: '📑 !listroles - shows player roles in the room.'
        ,freeze: '📑 !freeze - mutes or unmutes all players.'
        ,map: '📑 !map NAME - sets the stadium to NAME. Available maps:\n' +
            '📑 big, bigeasy, classic, gbhotclassic, gbhotbig, realsoccer\n' +
            '📑 futsal1v1, futsal4v4, bff4v4, icebear, 6man'
        ,mute: '📑 !mute #ID time(in minutes) - mutes the given player for the specified time (permanently if not specified), or unmutes them if already muted. (eg: !mute #12 5)\n' +
            '📑 You can check IDs with the !list command'
        ,mutes: '📑 !mutes - shows muted players.'
        ,ban: '📑 !ban #ID time(in minutes) - bans the player for the specified time (permanently if not specified), or unbans them if already banned. (eg: !ban #12 5)\n' +
            '📑 You can check IDs with the !list command'
        ,bans: '📑 !bans - shows banned players.'
        ,setpassword: '📑 !setpassword - sets or resets the room password. (eg: !setpassword 2552 | !setpassword to reset)'
        ,staff: '📑 !staff - shows staff players in the room.'
        ,switch: '📑 !switch - switches teams.'

    } 
    ,about: '📄 {RoomName} ({_LaunchTime})'
    ,auth: {
        playerAuth: `📄 {playerName}#{playerID} public ID: {playerAuth}`
    }
    ,deanon: {
        playerNicknames: `📄 {playerName}#{playerID} nicknames: {nicknamesList}`
    }
    ,map: {
        _ErrorNoMap: '❌ Unknown map name. 📑 Check available maps with the !help map command'
    }
    ,mute: {
        successTempMute: '🔇 Player {targetName}#{targetId} is muted for {muteInMinutes} minute(s). Run this command again to unmute.'
        ,successPermaMute: '🔇 Player {targetName}#{targetId} was muted permanently by {byPlayerName}#{byPlayerId}. Run this command again to unmute.'
        ,successUnmute: '🔊 Player {targetName}#{targetId} is no longer muted.'
    }
    ,ban: {
        successTempBan: '🚫 Player {targetName}#{ticketTarget} was banned for {banInMinutes} minute(s) by {byPlayerName}#{byPlayerId}.'
        ,successPermaBan: '🚫 Player {targetName}#{ticketTarget} was banned permanently by {byPlayerName}#{byPlayerId}.'
    }
    ,bans: {
        _ErrorFailedToGet: '❌ Failed to get the ban list.'
        ,noBans: '🚫 No banned players.'
        ,allBans: '🚫 Banned players: {bannedPlayers}'
    }
    ,list: {
        _ErrorNoTeam: '❌ You can only request the red, blue, or spec player list.'
        ,_ErrorNoOne: '❌ There are no players.'
        ,whoisList: '📜 {whoisResult}'
    }
    ,listroles: {
        rolesList: '📜 {rolesList}'
    }
    ,freeze: {
        onFreeze: '🔇 An administrator froze chat in this room. Commands still work. 📄 !help'
        ,offFreeze: '🔊 Chat is no longer frozen.' 
    }
    ,setpassword: {
        onPasswordSet: '🔒 The password was set by {playerName}#{playerID}'
        ,onPasswordReset: '🔓 The password was reset by {playerName}#{playerID}'
    }
    ,switch: {
        success: '🔃 Teams were switched by {playerName}#{playerID}'
    }
}

export const funcUpdateAdmins = {
    newAdmin: '📢 {playerName}#{playerID} is now an admin.\n📑 Banning other players is not allowed.'
}

export const onJoin = {
    playerJoined: '{playerName}#{playerID} ({playerRole}) has joined (public id: {playerAuth})'
    ,changename: '📢 {playerName}#{playerID} changed their name from {playerNameOld}'
    ,duplicatedNickname: '🚫 Duplicated nickname.'
    ,includeSeparator: '🚫 Your nickname contains prohibited characters. (|,|)'
    ,banList: {
        permanentBan: '{playerName} is banned permanently'
        ,fixedTermBan: '{playerName} is banned until {banExpirationDate}'
    }
}

export const onLeft = {
    playerLeft: '{playerName}#{playerID} has left (public id: {playerAuth})'
}

export const onChat = {
    mutedChat: '🔇 You are muted. You can\'t send messages, only commands.'
}

export const onVictory = {
    victory: '🎉 {winnerTeam} team won. Score: 🔴{redScore}-{blueScore}🔵. Possession: 🔴{possTeamRed}%-{possTeamBlue}%🔵'
}

export const onKick = {
    banned: {
        permanentBan: '🚫 You are banned permanently'
        ,tempBan: '🚫 You are banned for {banInMinutes} minutes'
    }
}

export const onGoal = {
    goal: '⚽️ {scorerName} | {score} | {time}'
    ,goalWithAssist: '⚽️ {scorerName} (👟 {assistantName}) | {score} | {time} '
    ,og: '🥅 {ogName} | {score} | {time}'
}

export const onGamePause = {
    pausedByPlayer: 'The game was paused by {player}'
}

export const onGameUnpause = {
    unpausedByPlayer: 'The game was unpaused by {player}'
}