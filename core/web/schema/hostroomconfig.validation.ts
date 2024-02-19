import Joi from 'joi';

const roomConfigSchema = Joi.object().keys({
    roomName: Joi.string().required()
    ,playerName: Joi.string().required()
    ,password: Joi.string().optional().allow(null, '')
    ,maxPlayers: Joi.number().required()
    ,public: Joi.boolean().required()
    ,token: Joi.string().required()
    ,noPlayer: Joi.boolean().required()
    ,geo: Joi.object().keys({
        code: Joi.string()
        ,lat: Joi.number()
        ,lon: Joi.number()
    }).optional().allow(null)
});

const gameRuleSchema = Joi.object().keys({
    ruleName: Joi.string().required()
    ,ruleDescription: Joi.string().required()
    ,requisite: Joi.object().keys({
        minimumPlayers: Joi.number().required()
        ,eachTeamPlayers: Joi.number().required()
        ,timeLimit: Joi.number().required()
        ,scoreLimit: Joi.number().required()
        ,teamLock: Joi.boolean().required()
    }).required()
    ,autoAdmin: Joi.boolean().required()
    ,whitelistEnabled: Joi.boolean().required()
    ,defaultMapName: Joi.string().required()
    ,readyMapName: Joi.string().required()
    ,customJSONOptions: Joi.string().optional().allow(null, '')
});

const roomSettingSchema = Joi.object().keys({
    maliciousBehaviourBanCriterion: Joi.number().required()

    ,chatFiltering : Joi.boolean().required()

    ,antiChatFlood : Joi.boolean().required()
    ,chatFloodCriterion : Joi.number().required()

    ,muteDefaultMillisecs : Joi.number().required()

    ,nicknameLengthLimit : Joi.number().required()
    ,chatLengthLimit : Joi.number().required()
    
    ,forbidDuplicatedNickname: Joi.boolean().required()
    ,nicknameTextFilter: Joi.boolean().required()
    ,chatTextFilter: Joi.boolean().required()
});

export const nestedHostRoomConfigSchema = Joi.object().keys({
    ruid: Joi.string().required()
    ,_config: roomConfigSchema.required()
    ,settings: roomSettingSchema.required()
    ,rules: gameRuleSchema.required()
});
