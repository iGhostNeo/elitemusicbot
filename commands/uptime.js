module.exports.run = async (client, message, args, queue, searcher) => {
    var ms = client.uptime
    var sec = Math.floor((ms / 1000) % 60);
    var min = Math.floor((ms / (60 * 1000)) % 60);
    var hrs = Math.floor((ms / (60 * 60 * 1000)) % 60);
    var days = Math.floor((ms / (24 * 60 * 60 * 1000)) % 60);

    var secStr, minStr, hrsStr, daysStr
    if (sec < 10) {
        secStr = '0' + sec.toString();
    } else {
        secStr = sec.toString();
    }
    if (min < 10) {
        minStr = '0' + min.toString();
    } else {
        minStr = min.toString();
    }
    if (hrs < 10) {
        hrsStr = '0' + hrs.toString();
    } else {
        hrsStr = hrs.toString();
    }
    daysStr = days.toString();

    if (days > 0) {
        message.channel.send(`Running Server since ${daysStr}:${hrsStr}:${minStr}:${secStr}`);
    } else if (hrs > 0) {
        message.channel.send(`Running Server since ${hrsStr}:${minStr}:${secStr}`);
    } else if (min > 0) {
        message.channel.send(`Running Server since ${minStr}:${secStr}`);
    } else {
        message.channel.send(`Running Server since ${secStr}`);
    }
}

module.exports.config = {
    name: "uptime",
    aliases: ["runsince"]
}