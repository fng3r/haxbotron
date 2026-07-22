import Joi from 'joi';

export const discordWebhookConfigSchema = Joi.object().keys({
    feed: Joi.boolean().required()
    ,passwordWebhookId: Joi.string().optional().allow(null, '')
    ,passwordWebhookToken: Joi.string().optional().allow(null, '')
    ,replaysWebhookId: Joi.string().optional().allow(null, '')
    ,replaysWebhookToken: Joi.string().optional().allow(null, '')
    ,replayUpload: Joi.boolean().required()
});
