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
    timeLimit: Joi.number().required()
    ,scoreLimit: Joi.number().required()
    ,teamLock: Joi.boolean().required()
    ,autoAdmin: Joi.boolean().required()
    ,whitelistEnabled: Joi.boolean().required()
    ,defaultMapName: Joi.string().required()
    ,customJSONOptions: Joi.string().optional().allow(null, '')
});

const roomSettingSchema = Joi.object()
    .keys({
        antiChatFlood: Joi.boolean().required(),
        chatFloodCriterion: Joi.number().required(),
        chatFloodIntervalMillisecs: Joi.number().required(),
        muteDefaultMillisecs: Joi.number().required(),
        forbidDuplicatedNickname: Joi.boolean().required(),
    })
    .options({ stripUnknown: true });

export const nestedHostRoomConfigSchema = Joi.object()
    .keys({
        ruid: Joi.string().required(),
        _config: roomConfigSchema.required(),
        settings: roomSettingSchema.required(),
        rules: gameRuleSchema.required(),
    })
    .options({ stripUnknown: true });
