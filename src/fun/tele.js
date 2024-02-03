const makuro_config = require('../../makuro_config')
const crp = new (require('cryptr'))('makuro')
const { TelegramClient, Logger } = require('telegram')
const { StringSession } = require('telegram/sessions')
const client = new TelegramClient(
    new StringSession(crp.decrypt(makuro_config.session)),
    +(crp.decrypt(makuro_config.api_id)),
    crp.decrypt(makuro_config.api_has),
    {
        connectionRetries: 5,
        baseLogger: new Logger("error")
    }
)


client.logger.setLevel(12)

async function sendMessage({
    nom = "",
    text = ""
} = {}) {
    await client.connect()
    const kirim = await client.sendMessage(`+${nom}`, { message: text })
    await client.disconnect()
    return kirim
}

const tele = {
    sendMessage
}

module.exports = tele

