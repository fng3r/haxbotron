// YOU CAN USE A PLACEHOLDER FOR INTERPOLATION. FOR EXAMPLE, 'Hello, My name is {name}.'
// THE TYPES OF PLACEHOLDER ARE LIMITED BY STRING SET.

export const scheduler = {
    advertise: ''
    ,shutdown: '📢 This room will be shutdown soon. Thanks for joinning our game!'
    ,afkKick: '📢 kicked: AFK'
    ,afkCommandTooLongKick: '📢 AFK over 2mins'
    ,afkDetect: '📢 @{targetName}#{targetID} has been away from keyboard. Press any key, or would be kicked.'
    ,autoUnmute: '🔊 Player {targetName}#{targetID} is no longer muted.'
    ,banVoteAutoNotify: '🗳️ Voting to ban is in progress (!vote #ID) : {voteList}'
}

export const teamName = {
    specTeam: 'Spec'
    ,redTeam: 'Red'
    ,blueTeam: 'Blue'
}

export const antitrolling = {
    chatFlood: {
        muteReason: '🔇 {playerName}#{playerID} is muted for flood (3 mins).'
    }
}

export const command = {
    _ErrorWrongCommand : '❌ You did wrong command. 📑 !help or !help COMMAND for details.'
    ,_ErrorNoPermission: '❌ You are not admin. You can\'t use this command.'
    ,_ErrorDisabled: '❌ This command is disabled. You can\'t use this command.'
    ,help: '📑 !about, !adm, !auth, !bb, !deanon, !list, !listroles, !map, !staff\n' +
           '📑 !freeze, !mute, !mutes, !ban, !bans !setpassword, !switch\n' +
           '📑 !help COMMAND for detail. (eg. !help stats).'
    ,helpman: { // detailed description for a command
        _ErrorWrongCommand : '❌ This command is unknown or disabled.'
        ,help: '📑 !help COMMAND - shows you how to use COMMAND command.'
        ,about: '📑 !about - shows you simple inforamtion of the bot running now.'
        ,adm: '📑 !adm - makes the player a room admin'
        ,auth: '📑 !auth - shows player\'s public id (eg: !auth, !auth #12)'
        ,bb: '📑 !bb to leave the room'
        ,deanon: '📑 !deanon #ID - shows player\'s nicknames history (eg: !deanon #12)'
        ,list: '📑 !list red/blue/spec - shows you all players list of that type.'
        ,listroles: '📑 !listroles - shows roles of players in the room.'
        ,freeze: '📑 !freeze - mutes or unmutes all players.'
        ,map: '📑 !map NAME - sets stadium to NAME map. Available maps:\n' +
            '📑 big, bigeasy, classic, gbhotclassic, gbhotbig, realsoccer\n' +
            '📑 futsal1v1, futsal4v4, bff4v4, icebear, 6man'
        ,mute: '📑 !mute #ID time(in minutes) - prohibits the player whose id is ID to chat for specified time (permanently if not specified). Or unmute if the player is already muted. (eg: !mute #12 5)\n' +
            '📑 You can check IDs by using command !list'
        ,mutes: '📑 !mutes - shows muted players'
        ,ban: '📑 !ban #ID time(in minutes) - bans the player for specified time (permanently if not specified). (eg: !ban #12 5). Or unban if the player is already banned.\n' +
            '📑 You can check IDs by using command !list'
        ,bans: '📑 !bans - shows banned players'
        ,setpassword: '📑 !setpassword - sets or resets room password. (eg: !setpassword 2552 | !setpassword - to reset)'
        ,staff: '📑 !staff - shows staff player in the room.'
        ,switch: '📑 !switch - switches teams.'

    } 
    ,about: '📄 {RoomName} ({_LaunchTime})'
    ,adm: {
        _ErrorNoPermission : '❌ You must have \'adm+\' role to use this command.'
    }
    ,auth: {
        _ErrorNoPlayer: '❌ Wrong player ID. 📑 You can check IDs by using command !list'
        ,playerAuth: `📄 {playerName}#{playerID} public id: {playerAuth}`
    }
    ,deanon: {
        _ErrorNoPlayer: '❌ Wrong player ID. 📑 You can check IDs by using command !list'
        ,playerNicknames: `📄 {playerName}#{playerID} nicknames: {nicknamesList}`
    }
    ,map: {
        _ErrorNoPermission: '❌ You are not admin. You can\'t do this command.'
        ,_ErrorNoMap: '❌ Unknown map name. 📑 You can check available maps by command !help map'
        ,_ErrorGameStartedAlready: '❌ Can\'t change map during the game'
    }
    ,mute: {
        _ErrorNoPermission: '❌ You are not admin. You can\'t do this command.'
        ,_ErrorNoPlayer: '❌ Wrong player ID. You can only target numeric ID.(eg: !mute #12 5)\n📑 You can check IDs by using command !list'
        ,successTempMute: '🔇 Player {targetName}#{targetId} is muted for {muteInMinutes} minute(s). You can use this command again to unmute.'
        ,successPermaMute: '🔇 Player {targetName}#{targetId} is muted permanently by {byPlayerName}#{byPlayerId}. You can use this command again to unmute.'
        ,successUnmute: '🔊 Player {targetName}#{targetId} is unmuted.'
    }
    ,ban: {
        _ErrorNoPermission: '❌ You are not admin. You can\'t do this command.'
        ,_ErrorNoPlayer: '❌ Wrong player ID. You can only target numeric ID.(eg: !ban #12 5)\n📑 You can check IDs by using command !list'
        ,successTempBan: '🚫 {targetName}#{ticketTarget} player is banned for {banInMinutes} minute(s) by {byPlayerName}#{byPlayerId}. You can command it against for release.'
        ,successPermaBan: '🚫 {targetName}#{ticketTarget} player is banned permanently by {byPlayerName}#{byPlayerId}. You can command it against for release.'
        ,successUnban: '🟢 Player {targetName}#{ticketTarget} was unbanned by {byPlayerName}#{byPlayerId}.'
    }
    ,bans: {
        _ErrorFailedToGet: '❌ Failed to get ban list.'
        ,noBans: '🚫 No banned players'
        ,allBans: '🚫 Banned players: {bannedPlayers}'
    }
    ,list: {
        _ErrorNoTeam: '❌ You can only request red,blue,spec players list.'
        ,_ErrorNoOne: '❌ There are no players.'
        ,whoisList: '📜 {whoisResult}'
    }
    ,listroles: {
        rolesList: '📜 {rolesList}'
    }
    ,freeze: {
        _ErrorNoPermission : '❌ You are not admin. You can\'t do this command.'
        ,onFreeze: '🔇 The administrator freezed chatting on this room. Commands are available. 📄 !help'
        ,offFreeze: '🔊 The administrator unfreezed chatting.' 
    }
    ,setpassword: {
        _ErrorNoPermission : '❌ You are not admin. You can\'t do this command.'
        ,onPasswordSet: '🔒 Password was set by {playerName}#{playerID}'
        ,onPasswordReset: '🔓 Password was reset by {playerName}#{playerID}'
    }
    ,switch: {
        _ErrorNoPermission: '❌ You are not admin. You can\'t do this command.'
        ,_ErrorGameStartedAlready: '❌ Can\'t switch teams during the game'
        ,success: '🔃 Teams were switched by {playerName}#{playerID}'
    }
}

export const funcUpdateAdmins = {
    newAdmin: '📢 {playerName}#{playerID} is new admin.\n📑 Banning other players is prohibited.'
}

export const onJoin = {
    playerJoined: '{playerName}#{playerID} ({playerRole}) has joined (public id: {playerAuth})'
    ,changename: '📢 {playerName}#{playerID} has changed name from {playerNameOld}'
    ,doubleJoinningMsg: '🚫 {playerName}#{playerID} has already joined.'
    ,doubleJoinningKick: '🚫 You did double joinning.'
    ,tooLongNickname: '🚫 Too long nickname.'
    ,duplicatedNickname: '🚫 Duplicated nickname.'
    ,bannedNickname: '🚫 Banned nickname.'
    ,includeSeperator: '🚫 Chat message includes banned word. (|,|)'
    ,banList: {
        permanentBan: '{playerName} is banned permanently'
        ,fixedTermBan: '{playerName} is banned until {banExpirationDate}'
    }
}

export const onLeft = {
    playerLeft: '{playerName}#{playerID} has left (public id: {playerAuth})'
}

export const onChat = {
    mutedChat: '🔇 You are muted. You can\'t send message to others, and only can send commands.'
    ,tooLongChat: '🔇 Chat message is too long.'
    ,bannedWords: '🚫 Chat message includes banned words.'
    ,includeSeparator: '🚫 Chat message includes banned word (|,|).'
}

export const onVictory = {
    victory: '🎉 {winnerTeam} team won. Score: 🔴{redScore}-{blueScore}🔵. Possession: 🔴{possTeamRed}%-{possTeamBlue}%🔵'
}

export const onKick = {
    cannotBan: '🚫 You can\'t ban other players. Act kicking if you need.'
    ,banned: {
        permanentBan: '🚫 You are banned permanently'
        ,tempBan: '🚫 You are banned for {banInMinutes} minutes'
    }
}

export const onStadium = {
    loadNewStadium: '📁 {stadiumName} has been loaded by {playerName}#{playerID}.'
    ,setDefaultStadium: '📁 {stadiumName} has been loaded automatically.'
    ,cannotChange: '🚫 You can\'t change the stadium.'
}

export const onGoal = {
    goal: '⚽️ {scorerName} | {score} | {time}'
    ,goalWithAssist: '⚽️ {scorerName} (👟 {assistantName}) | {score} | {time} '
    ,og: '🥅 {ogName} | {score} | {time}'
}

export const onGamePause = {
    readyForStart: '📢 The game will start soon!',
    pausedByPlayer: 'Game was paused by {player}'
}

export const onGameUnpause = {
    readyForStart: '📢 The game will start soon!',
    unpausedByPlayer: 'Game was unpaused by {player}'
}