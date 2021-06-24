const ytdl = require('ytdl-core');
const ytpl = require('ytpl')
const getYotubePlaylistId = require('get-youtube-playlist-id')
const Discord = require('discord.js')
const { MessageButton, MessageActionRow } = require("discord-buttons")
const cmdReume = require('../Button/resume');
const cmdPause = require('../Button/pause');
const cmdStop = require('../Button/stop');
const cmdSkip = require('../Button/fskip');

let timer;
module.exports.run = async (client, message, args, queue, searcher) => {
    const vc = message.member.voice.channel;

    if (!vc)
        return message.channel.send("Please join a voice channel first");
    if (args.length < 1)
        return message.channel.send("Please enter something to search")
    let url = args.join("");

    switch (url) {
        case 'top':
            url = "https://youtube.com/playlist?list=PL-urXa9yw6L_PbJ58doH4mDi81Ui3r4HE";
            break;
        case 'jada':
            url = "https://www.youtube.com/playlist?list=PL7NDfWdeJCVKZevVhSoD2IeSoNDDeFs8l";
            break;
        case 'akon':
            url = "https://www.youtube.com/playlist?list=PL-urXa9yw6L9OkLtYEMIG1-0woBWOXT3c";
            break;
    }

    var playlistId = getYotubePlaylistId(url)

    if (playlistId) {
        //if(url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)){
        try {
            await ytpl(playlistId).then(async playlist => {
                //console.log(playlist);

                let addPlayList = new Discord.MessageEmbed()
                    .setAuthor('Playlist Added', 'https://i.imgur.com/dFd53fY.png', playlist.url)
                    .setColor('#ff0000')
                    .setThumbnail(playlist.bestThumbnail.url)
                    .addFields(
                        { name: 'Playlist Title', value: playlist.title, inline: true },
                        { name: 'Song Count', value: playlist.estimatedItemCount, inline: true }
                    )
                    .setTimestamp();

                message.channel.send(addPlayList)
                playlist.items.forEach(async item => {
                    await videoHandler(await ytdl.getInfo(item.shortUrl), message, vc, true);
                })
            })
        } catch (err) {
            return message.channel.send(`Please insert a valid link or make sure that the playlist is visible\n${err}`)
        }
    }
    else {
        let result = await searcher.search(args.join(" "), { type: "video" })
        if (result.first == null)
            return message.channel.send("There are no results found");
        try {
            let songInfo = await ytdl.getInfo(result.first.url);

            //console.log(songInfo);
            //message.channel.send(songInfo.videoDetails.author.name)

            return videoHandler(songInfo, message, vc)
        } catch (err) {
            message.channel.send(`Cannot queue song :c \n ${err} `)
            console.log(err)
        }

    }

    async function videoHandler(songInfo, message, vc, playlist = false) {
        clearTimeout(timer);
        const serverQueue = queue.get(message.guild.id);

        const videoTitle = songInfo.videoDetails.title;
        const videoLength = songInfo.videoDetails.lengthSeconds;

        var hours = Math.floor(videoLength / 3600);
        var minutes = Math.floor((videoLength - hours * 3600) / 60);
        var seconds = (videoLength - hours * 3600) - minutes * 60;

        if (Math.floor(minutes / 10) === 0) {
            var minutesSet = `0${minutes}`;
        } else {
            minutesSet = minutes;
        }

        if (Math.floor(seconds / 10) === 0) {
            var secondsSet = `0${seconds}`;
        } else {
            secondsSet = seconds;
        }

        if (hours === 0 && minutes < 10 && minutes !== 0) {
            var set_title = `**${videoTitle} - ${minutes}:${secondsSet}**`;
        } else if (hours === 0) {
            var set_title = `**${videoTitle} - ${minutes}:${secondsSet}**`;
        } else {
            var set_title = `**${videoTitle} - ${hours}:${minutesSet}:${secondsSet}**`;
        }

        const videoId = songInfo.videoDetails.videoId;

        const videoDescription = songInfo.videoDetails.description;
        var videoDescriptionSplit = '';
        if (videoDescription) {
            videoDescriptionSplit = videoDescription.split('\n');
        }

        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
            vLength: songInfo.videoDetails.lengthSeconds,
            thumbnail: songInfo.videoDetails.thumbnails[0].url,
            embedTitle: set_title,
            vId: videoId,
            vDes: `${videoDescriptionSplit[0]}\n${videoDescriptionSplit[1]}`
        }


        if (!serverQueue) {
            const queueConstructor = {
                txtChannel: message.channel,
                vChannel: vc,
                connection: null,
                songs: [],
                volume: 10,
                playing: true,
                loopone: false,
                loopall: false,
                skipVotes: []
            };
            queue.set(message.guild.id, queueConstructor);

            queueConstructor.songs.push(song);

            try {
                let connection = await queueConstructor.vChannel.join();
                queueConstructor.connection = connection;
                message.guild.me.voice.setSelfDeaf(true);
                play(message.guild, queueConstructor.songs[0]);
            } catch (err) {
                console.error(err);
                queue.delete(message.guild.id);
                return message.channel.send(`Unable to join the voice chat ${err}`)
            }
        } else {
            serverQueue.songs.push(song);
            if (serverQueue.songs.length === 1)
                play(message.guild, serverQueue.songs[0])
            if (playlist) return undefined


            let dur = `${parseInt(song.vLength / 60)}:${song.vLength - 60 * parseInt(song.vLength / 60)}`

            let addSongToQueue = new Discord.MessageEmbed()
                .setAuthor("Song Added")
                .setTitle(song.title)
                .setURL(`https://www.youtube.com/watch?v=${song.vId}`)
                .setColor('#ff0000')
                .setThumbnail(`https://img.youtube.com/vi/${song.vId}/0.jpg`)
                .addFields(
                    { name: 'Song duration: ', value: dur, inline: true },
                    { name: 'Song Place', value: serverQueue.songs.lastIndexOf(song) + 1, inline: true }
                )
                .setFooter(`Added by: ${message.author.tag}`, message.author.displayAvatarURL());

            return message.channel.send(addSongToQueue);
        }
    }

    async function play(guild, song) {
        const serverQueue = queue.get(guild.id);
        if (!song) {
            message.channel.send("Leaving the channel......").then(msg => {
                setTimeout(() => msg.delete(), 5000)
            }).catch(console.error)
            timer = setTimeout(function () {
                serverQueue.vChannel.leave();
                queue.delete(guild.id);
            }, 5000)
            return;
        }
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on('finish', () => {
                if (serverQueue.loopone) {
                    play(guild, serverQueue.songs[0]);
                }
                else if (serverQueue.loopall) {
                    serverQueue.songs.push(serverQueue.songs[0])
                    serverQueue.songs.shift()
                } else {
                    serverQueue.songs.shift()
                }
                play(guild, serverQueue.songs[0]);
            })


        const nowPlayingEmbed = new Discord.MessageEmbed()
            .setAuthor('Now Playing...', 'https://i.imgur.com/dFd53fY.png')
            .setTitle(song.embedTitle)
            .setDescription(song.vDes)
            .setURL(`https://www.youtube.com/watch?v=${song.vId}`)
            .setColor('#ff0000')
            .setThumbnail(`https://img.youtube.com/vi/${song.vId}/0.jpg`)
            .setFooter(`Requested by: ${message.author.tag}`, message.author.displayAvatarURL());

        // let dur = `${parseInt(serverQueue.songs[0].vLength / 60)}:${serverQueue.songs[0].vLength - 60 * parseInt(serverQueue.songs[0].vLength / 60)}`
        // let msg = new Discord.MessageEmbed()
        //     .setTitle("Now Playing:")
        //     .addField(serverQueue.songs[0].title, "----------")
        //     .addField("Song duration: ", dur)
        //     .setThumbnail(serverQueue.songs[0].thumbnail)
        //     .setColor("PURPLE")

        let resumeButton = new MessageButton().setLabel("Resume").setStyle('red').setID("resumeButton")
        let pauseButton = new MessageButton().setLabel("Pause").setStyle('red').setID("pauseButton")
        let stopButton = new MessageButton().setLabel("Stop").setStyle('red').setID("stopButton")
        let nextButton = new MessageButton().setLabel("Next").setStyle('red').setID("nextButton")

        let nowPlay = await message.channel.send({ embed: nowPlayingEmbed, buttons: [resumeButton, pauseButton, stopButton, nextButton] })

        const collector = nowPlay.createButtonCollector((button) => button.id == "resumeButton" || button.id == "pauseButton" || button.id == "stopButton" || button.id == "nextButton", { time: song.vLength * 1000 })
        collector.on("collect", (button) => {
            button.defer();
            if (button.id == "pauseButton") {
                cmdPause.run(button, queue)
            } else if (button.id == "resumeButton") {
                cmdReume.run(button, queue)
            } else if (button.id == "nextButton") {
                cmdSkip.run(button, queue)
            } else if (button.id == "stopButton") {
                cmdStop.run(button, queue)
            }
        })

        // await nowPlay.react('▶️');
        // await nowPlay.react('⏸️');
        // await nowPlay.react('⏹');
        // await nowPlay.react('⏭️');

        // const reactionFilter = (reaction, user) => ['▶️', '⏸️', '⏹', '⏭️'].includes(reaction.emoji.name) //&& (message.author.id === user.id)
        // const collector = nowPlay.createReactionCollector(reactionFilter, { dispose: true });

        // collector.on('collect', (reaction, user) => {
        //     if(reaction.emoji.name === '▶️'){
        //         cmdReume.run(reaction, queue, user);
        //     }else if(reaction.emoji.name === '⏸️'){
        //         cmdPause.run(reaction, queue, user);
        //     }else if(reaction.emoji.name === '⏹'){
        //         cmdStop.run(reaction, queue, user);
        //     }else if(reaction.emoji.name === '⏭️'){
        //         cmdSkip.run(reaction, queue, user);
        //     }
        // })

        // collector.on('remove', (reaction, user) => {
        //     if(reaction.emoji.name === '▶️'){
        //         cmdReume.run(reaction, queue, user);
        //     }else if(reaction.emoji.name === '⏸️'){
        //         cmdPause.run(reaction, queue, user);
        //     }else if(reaction.emoji.name === '⏹'){
        //         cmdStop.run(reaction, queue, user);
        //     }else if(reaction.emoji.name === '⏭️'){
        //         cmdSkip.run(reaction, queue, user);
        //     }
        // })

        return nowPlay;
    }

}

module.exports.config = {
    name: "play",
    aliases: ["p", "pl"]
}