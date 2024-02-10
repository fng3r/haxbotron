import Joi from 'joi';

export const playerModelSchema = Joi.object().keys({
    auth: Joi.string().required()
    ,conn: Joi.string().required()
    ,name: Joi.string().required()
    ,mute: Joi.boolean().required()
    ,muteExpire: Joi.number().required()
    ,rejoinCount: Joi.number().required()
    ,joinDate: Joi.number().required()
    ,leftDate: Joi.number().required()
    ,malActCount: Joi.number().required()
});

export const banListModelSchema = Joi.object().keys({
    conn: Joi.string().required()
    ,reason: Joi.string().optional().allow('')
    ,register: Joi.number().required()
    ,expire: Joi.number().required()
});
