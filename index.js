const yargs = require('yargs')
const express = require('express')
const tele = require('./src/fun/tele')
const app = express()
const fs = require('fs-extra')
const pat = require('path')


app.get('/send/:nom/:text', async (req, res) => {
    const { nom, text } = req.params
    const kirim = await tele.sendMessage({
        nom,
        text
    })

    res.json({
        success: true,
        message: kirim.id
    })
})

yargs
    .command(
        "start",
        "start",
        yargs => yargs
            .options({
                "port": {
                    alias: "p",
                    default: 3000
                }
            }),
        funStart
    )
    .demandCommand(1)
    .recommendCommands()
    .parse(process.argv.splice(2))

async function funStart(argv) {
    try {
        await fs.promises.access("./makuro_config.js", fs.constants.F_OK)
        app.listen(argv.p, () => console.log(`app run on ${argv.p}`))
    } catch (error) {
        console.log("pastikan file config")
    }
}