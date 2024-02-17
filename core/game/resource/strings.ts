// YOU CAN USE A PLACEHOLDER FOR INTERPOLATION. FOR EXAMPLE, 'Hello, My name is {name}.'
// THE TYPES OF PLACEHOLDER ARE LIMITED BY STRING SET.

export const scheduler = {
    advertise: '📢 CIS-HAXBALL https://cis-haxball.com/\n💬 Discord https://discord.gg/sTnutdTM'
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
        muteReason: '🔇 You are muted for too many chats.(3mins) Admin player can unmute it.'
    }
    ,malAct: {
        banReason: '🚫 Malicious behaviour is detected'
    }
}

export const command = {
    _ErrorWrongCommand : '❌ You did wrong command. 📑 !help or !help COMMAND for detail.'
    ,_ErrorNoPermission: '❌ You are not admin. You can\'t use this command.'
    ,_ErrorDisabled: '❌ This command is disabled. You can\'t use this command.'
    ,help: '📄 !about, !auth, !list, !freeze, !mute, !mutes, !ban, !setpassword\n📑 !help COMMAND for detail. (eg. !help stats).'
    ,helpman: { // detailed description for a command
        _ErrorWrongMan : '❌ Failed to read manual about that command.'
        ,help: '📑 !help COMMAND shows you how to use COMMAND command.'
        ,about: '📑 !about shows you simple inforamtion of the bot running now.'
        ,auth: '📑 !auth shows player\'s public id (eg: !auth, !auth #12)'
        ,list: '📑 !list red/blue/spec/mute/afk shows you all players list of that type.'
        ,freeze: '📑 !freeze mutes or unmutes all players.'
        ,mute: '📑 !mute #ID time(in minutes): prohibits the player whose id is ID to chat for specified time (permanently if not specified). Or unmute if the player is already muted. (eg: !mute #12 5)\n' +
            '📑 You can check IDs by command !list'
        ,mutes: '📑 !mutes shows muted players'
        ,ban: '📑 !ban #ID time(in minutes): ban the player for specified time (permanently if not specified). (eg: !ban #12 5). Or unmute if the player is already muted.\n' +
            '📑 You can check IDs by command !list'
        ,setpassword: '📑 !setpassword sets or resets room password. (eg: !setpassword 2552 | !setpassword - to reset)'

    } 
    ,about: '📄 {RoomName} ({_LaunchTime})'
    ,auth: {
        _ErrorNoPlayer: '❌ Wrong player ID. 📑 You can check IDs by command !list red,blue,spec,mute'
        ,playerAuth: `📄 {playerName}#{playerID} public id: {playerAuth}`
    }
    ,mute: {
        _ErrorNoPermission: '❌ You are not admin. You can\'t do this command.'
        ,_ErrorNoPlayer: '❌ Wrong player ID. You can only target numeric ID.(eg: !mute #12 5)\n📑 You can check IDs by command !list red,blue,spec,mute'
        ,successTempMute: '🔇 {targetName}#{ticketTarget} player is muted for {muteInMinutes} minute(s). You can command it against for release.'
        ,successPermaMute: '🔇 {targetName}#{ticketTarget} player is muted permanently by {byPlayerName}#{byPlayerId}. You can command it against for release.'
        ,successUnmute: '🔊 Player {targetName}#{ticketTarget} is unmuted.'
    }
    ,ban: {
        _ErrorNoPermission: '❌ You are not admin. You can\'t do this command.'
        ,_ErrorNoPlayer: '❌ Wrong player ID. You can only target numeric ID.(eg: !ban #12 5)\n📑 You can check IDs by command !list red,blue,spec,mute'
        ,successTempBan: '🚫 {targetName}#{ticketTarget} player is banned for {banInMinutes} minute(s) by {byPlayerName}#{byPlayerId}. You can command it against for release.'
        ,successPermaBan: '🚫 {targetName}#{ticketTarget} player is banned permanently by {byPlayerName}#{byPlayerId}. You can command it against for release.'
        ,successUnban: '🟢 Player {targetName}#{ticketTarget} was unbanned by {byPlayerName}#{byPlayerId}.'
    }
    ,list: {
        _ErrorNoTeam: '❌ You can only request red,blue,spec players list.'
        ,_ErrorNoOne: '❌ There\'s no one.'
        ,whoisList: '📜 {whoisResult}'
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
}

export const funcUpdateAdmins = {
    newAdmin: '📢 {playerName}#{playerID} has been new admin.\n📑 Changing stadium and banning other players are prohibited.\n📑 !help admin shows commands list for administrator.'
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
        permanentBan: '{playerName} is banned permanently ({banListReason})'
        ,fixedTermBan: '{playerName} is banned until {banExpirationDate} ({banListReason})'
    }
}

export const onLeft = {
    playerLeft: '{playerName}#{playerID} has left (public id: {playerAuth})'
}

export const onChat = {
    mutedChat: '🔇 You are muted. You can\'t send message to others, and only can command by chat.'
    ,tooLongChat: '🔇 Chat message is too long.'
    ,bannedWords: '🚫 Chat message includes banned words.'
    ,includeSeperator: '🚫 Chat message includes banned word. (|,|)'
}

export const onStop = {
    feedSocialDiscordWebhook: {
        replayMessage: '💽 Replay file from {roomName} ({replayDate})'
    }
}

export const onVictory = {
    victory: '🎉 {winnerTeam} team won. Score: 🔴{redScore}-{blueScore}🔵. Possession: 🔴{possTeamRed}%-{possTeamBlue}%🔵'
}

export const onKick = {
    cannotBan: '🚫 You can\'t ban other players. Act kicking if you need.'
    ,banned: {
        permanentBan: '🚫 You are banned permanently ({banListReason})'
        ,tempBan: '🚫 You are banned for {banInMinutes} minutes ({banListReason})'
    }
}

export const onStadium = {
    loadNewStadium: '📁 {stadiumName} has been loaded by {playerName}.'
    ,setDefaultStadium: '📁 {stadiumName} has been loaded automatically.'
    ,cannotChange: '🚫 You can\'t change the stadium.'
}

export const onGoal = {
    goal: '⚽️ {scorerName} | {score} | {time}'
    ,goalWithAssist: '⚽️ {scorerName} (👟 {assistName}) | {score} | {time} '
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