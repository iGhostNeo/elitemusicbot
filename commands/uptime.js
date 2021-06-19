module.exports.run = async (client, message, args, queue, searcher) => {
    const ms = client.uptime
    const sec = Math.floor((ms / 1000) % 60).toString();
    const min = Math.floor((ms / (60 * 1000)) % 60).toString();
    const hrs = Math.floor((ms / (60 * 60 * 1000)) % 60).toString();
    const days = Math.floor((ms / (24 * 60 * 60 * 1000)) % 60).toString();

    message.channel.send(`${days}:${hrs}:${min}:${sec}`)
}

module.exports.config = {
    name: "uptime",
    aliases: ["runsince"]
}