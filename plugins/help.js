const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message, channelLink) {
    const helpMessage = `
╭───◇ *MAD-MAX* ◇───╮

◈ *OWNER/SUDO COMMANDS*
├ .mode
├ .autostatus
├ .antidelete
├ .cleartmp
├ .setpp
├ .clearsession
├ .areact
├ .autotyping
├ .autoread
├ .dmblocker
├ .autosticker
├ .autorecording
├ .autovoice
├ .anticall
├ .block
├ .unblock
├ .autoreply
├ .sudo
├ .update
├ .settings
├ .poststatus
├ .channelreact
├ .newsletter
├ .hack
├ .antispam
├ .autotext

◈ *GROUP ADMIN COMMANDS*
├ .kick
├ .promote
├ .demote
├ .mute
├ .unmute
├ .ban
├ .unban
├ .tagall
├ .tagnotadmin
├ .hidetag
├ .tag
├ .antilink
├ .antitag
├ .antibadword
├ .welcome
├ .goodbye
├ .setgdesc
├ .setgname
├ .setgpp
├ .chatbot
├ .clear
├ .warn
├ .warnings
├ .resetlink
├ .staff
├ .groupinfo
├ .lockgc
├ .unlockgc
├ .poll
├ .requestlist
├ .acceptall
├ .rejectall
├ .mention
├ .setmention
├ .grouptime
├ .online

◈ *AI COMMANDS*
├ .gpt
├ .geminiai
├ .gpt4
├ .llamaai
├ .zoroai
├ .jeeves
├ .askjeeves
├ .jeeves2
├ .jeevesv2
├ .perplexity
├ .perplexai
├ .xdash
├ .xdashai
├ .aoyo
├ .narutoai
├ .math
├ .calculate
├ .metaai
├ .xeon
├ .aihelp
├ .helpai
├ .aicmds

◈ *IMAGE/GENERATION AI*
├ .imagine
├ .flux
├ .dalle
├ .sora

◈ *CHATBOT & TRANSLATION*
├ .chatbot
├ .tts
├ .translate
├ .trt

◈ *MEDIA DOWNLOAD - MUSIC/AUDIO*
├ .song
├ .play
├ .mp3
├ .ytmp3
├ .music
├ .ringtone
├ .ring
├ .ringtones

◈ *MEDIA DOWNLOAD - VIDEO*
├ .video
├ .ytmp4
├ .tiktok
├ .tt
├ .ytpost
├ .ytcommunity
├ .ytc
├ .youtubecommunity
├ .movie
├ .moviedl
├ .film
├ .series
├ .tvdl
├ .episode

◈ *SOCIAL MEDIA DOWNLOAD*
├ .instagram
├ .ig
├ .insta
├ .igs
├ .igsc
├ .facebook
├ .fb
├ .spotify
├ .pindl
├ .pinterestdl
├ .pint
├ .pind
├ .pindownload
├ .tiktokstalk
├ .ttstalk

◈ *FILE DOWNLOAD*
├ .mediafire
├ .mfire
├ .mfdownload
├ .mf
├ .gdrive
├ .gdownloader
├ .gdrivedl
├ .gdown
├ .apk
├ .modapk
├ .apkdownload
├ .githubstalk
├ .gstalk
├ .gitstalk
├ .gits
├ .gitclone
├ .git

◈ *IMAGE SEARCH & TOOLS*
├ .img
├ .image
├ .pic
├ .searchimg
├ .googleimage
├ .getimage
├ .tophoto
├ .url2image
├ .urltoimage
├ .fetchimage
├ .imagefromurl
├ .urlimage
├ .simage

◈ *MEDIA MANIPULATION*
├ .sticker
├ .s
├ .stickercrop
├ .take
├ .steal
├ .emojimix
├ .emix
├ .removebg
├ .rmbg
├ .nobg
├ .remini
├ .enhance
├ .upscale
├ .blur
├ .attp
├ .ttp
├ .ttp6
├ .textsticker
├ .ss
├ .ssweb
├ .screenshot
├ .tg
├ .stickertelegram
├ .tgsticker
├ .telesticker
├ .vcf
├ .imgscan
├ .scanimg
├ .imagescan
├ .analyzeimg
├ .tovideo
├ .tovideo2
├ .tomp3
├ .toptt
├ .toaudio
├ .convert
├ .sticker2img
├ .stoimg
├ .stickertoimage
├ .s2i
├ .topdf
├ .pdf
├ .smeme
├ .stickermeme
├ .memesticker
├ .url
├ .tourl
├ .viewonce
├ .vv

◈ *AUDIO EFFECTS*
├ .deep
├ .smooth
├ .fat
├ .tupai
├ .blown
├ .radio
├ .robot
├ .chipmunk
├ .nightcore
├ .earrape
├ .bass
├ .reverse
├ .slow
├ .fast
├ .baby
├ .demon

◈ *TEXT MAKER & EFFECTS*
├ .metallic
├ .ice
├ .snow
├ .impressive
├ .matrix
├ .light
├ .neon
├ .devil
├ .purple
├ .thunder
├ .leaves
├ .1997
├ .arena
├ .hacker
├ .sand
├ .blackpink
├ .glitch
├ .fire
├ .fancy
├ .font
├ .style
├ .dragonball
├ .naruto
├ .boom
├ .water
├ .underwater
├ .4d
├ .boken
├ .starnight
├ .gold
├ .xmd
├ .3d
├ .luxury
├ .american
├ .embroider
├ .foggyglass
├ .silver
├ .wetglass

◈ *GAMES*
├ .tictactoe
├ .ttt
├ .hangman
├ .guess
├ .trivia
├ .answer
├ .squidgame
├ .konami
├ .quiz
├ .q
├ .dice
├ .dado
├ .dados
├ .dadu
├ .roll

◈ *FUN & INTERACTION*
├ .truth
├ .dare
├ .8ball
├ .8ball2
├ .compliment
├ .insult
├ .flirt
├ .shayari
├ .character
├ .wasted
├ .ship
├ .simp
├ .stupid
├ .itssostupid
├ .iss
├ .goodnight
├ .lovenight
├ .gn
├ .roseday
├ .lovetest
├ .aura
├ .compatibility
├ .friend
├ .fcheck
├ .feed
├ .animu
├ .nom
├ .poke
├ .cry
├ .kiss
├ .pat
├ .hug
├ .wink
├ .facepalm
├ .face-palm
├ .animuquote
├ .animequote
├ .aquote
├ .aniquote
├ .animeq
├ .emoji
├ .happy
├ .heart
├ .angry
├ .sad
├ .shy
├ .moon
├ .confused
├ .hot
├ .nikal
├ .pair
├ .link
├ .code
├ .vv2
├ .wah
├ .ohh
├ .oho
├ .🙂
├ .nice
├ .ok

◈ *EMOJI ANIMATIONS*
├ .happy
├ .heart
├ .angry
├ .sad
├ .shy
├ .moon
├ .confused
├ .hot
├ .nikal

◈ *INFORMATION & TOOLS*
├ .ping
├ .ping2
├ .speed
├ .pong
├ .alive
├ .owner
├ .creator
├ .jid
├ .quote
├ .joke
├ .fact
├ .weather
├ .news
├ .lyrics
├ .github
├ .sc
├ .script
├ .repo
├ .define
├ .dictionary
├ .dict
├ .meaning
├ .def
├ .check
├ .countryinfo
├ .country
├ .uptime
├ .runtime
├ .up
├ .delete
├ .del
├ .topmembers
├ .meme
├ .football
├ .save
├ .send
├ .sendme
├ .webzip
├ .sitezip
├ .web
├ .archive
├ .bothosting
├ .deploy
├ .hosting
├ .adult
├ .porn
├ .xxx
├ .18+

◈ *MISCELLANEOUS IMAGE TOOLS*
├ .heart
├ .horny
├ .circle
├ .lgbt
├ .police
├ .simpcard
├ .tonikawa
├ .its-so-stupid
├ .namecard
├ .oogway
├ .oogway2
├ .tweet
├ .ytcomment
├ .comrade
├ .gay
├ .glass
├ .jail
├ .passed
├ .triggered
├ .wanted
├ .wantededit
├ .robal
├ .wm
├ .repackage
├ .feed

◈ *PIES & ANIME*
├ .indonesia
├ .japan
├ .korea
├ .hijab

╰──────◇ *Note: Commands are case sensitive* ◇──────╯
`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363401269012709@newsletter',
                        newsletterName: 'MAD-MAX',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, { 
                text: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363401269012709@newsletter',
                        newsletterName: 'MAD-MAX by 404unkown',
                        serverMessageId: -1
                    } 
                }
            });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;