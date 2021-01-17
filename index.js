const { executionAsyncResource } = require('async_hooks');
const Discord = require('discord.js');
require('dotenv').config();
const ytdl = require('ytdl-core');
const { measureMemory } = require('vm');
const { YTSearcher } = require('ytsearcher');
const fs = require('fs');

const searcher = new YTSearcher({
    key: process.env.YOUTUBE_API_KEY,
    revealed: true
});

const client = new Discord.Client();
client.command = new Discord.Collection();
client.aliases = new Discord.Collection();

fs.readdir('./commands/', (e, f) => {
    if(e) return console.error(e);

    f.forEach(file => {
        if(!file.endsWith(".js")) return

        console.log(`${file} has been loaded.`)
        let cmd = require(`./commands/${file}`);
        let cmdName = cmd.config.name;
        client.command.set(cmdName, cmd)
        cmd.config.aliases.forEach(alias => {
            client.aliases.set(alias, cmdName);
        })
    })
})


const queue = new Map();

client.on("ready", () => {
    console.log("I am online!")
    client.user.setActivity('🎵 Music', { type: "PLAYING" })
})

client.on("message", async(message) => {
    const prefix = '*';

    if (!message.content.startsWith(prefix)) return

    const serverQueue = queue.get(message.guild.id);

    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toLowerCase();

    const cmd = client.command.get(command) || client.command.get(client.aliases.get(command))

    if(!cmd) return

    try{
        cmd.run(client, message, args, queue, searcher);
    } catch (err) {
        return console.error(err)
    }
})

client.login(process.env.DISCORD_TOKEN)