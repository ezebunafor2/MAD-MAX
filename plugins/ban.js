const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');
const isAdmin = require('../lib/isAdmin');
const { isSudo } = require('../lib/index');

async function banCommand(sock, chatId, message) {
    // Restrict in groups to admins; in private to owner/sudo
    const isGroup = chatId.endsWith('@g.us');
    
    if (isGroup) {
        const senderId = message.key.participant || message.key.remoteJid;
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { 
                text: 'Please make the bot an admin to use .ban', 
                ...channelInfo 
            }, { quoted: message });
            return;
        }
        
        if (!isSenderAdmin && !message.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: 'Only group admins can use .ban', 
                ...channelInfo 
            }, { quoted: message });
            return;
        }
    } else {
        const senderId = message.key.participant || message.key.remoteJid;
        const senderIsSudo = await isSudo(senderId);
        
        if (!message.key.fromMe && !senderIsSudo) {
            await sock.sendMessage(chatId, { 
                text: 'Only owner/sudo can use .ban in private chat', 
                ...channelInfo 
            }, { quoted: message });
            return;
        }
    }
    
    let userToBan;
    
    // Check for mentioned users
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToBan = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToBan = message.message.extendedTextMessage.contextInfo.participant;
    }
    // Check if user provided phone number
    else {
        // Extract text from message
        const text = message.message?.conversation?.trim() || 
                     message.message?.extendedTextMessage?.text?.trim() || '';
        
        const args = text.split(' ').slice(1);
        if (args.length > 0) {
            const phone = args[0].replace(/[^0-9]/g, '');
            if (phone.length >= 10) {
                userToBan = phone + '@s.whatsapp.net';
            }
        }
    }
    
    if (!userToBan) {
        await sock.sendMessage(chatId, { 
            text: 'Please mention the user, reply to their message, or provide a phone number!\n\nExamples:\n.ban @user\n.ban 254123456789\n.ban (reply to user)', 
            ...channelInfo 
        }, { quoted: message });
        return;
    }

    try {
        // Load banned users
        let bannedUsers = [];
        const bannedPath = './data/banned.json';
        
        if (fs.existsSync(bannedPath)) {
            try {
                bannedUsers = JSON.parse(fs.readFileSync(bannedPath, 'utf8'));
            } catch (error) {
                console.error('Error reading banned.json:', error);
                bannedUsers = [];
            }
        }
        
        // Check if already banned
        if (bannedUsers.includes(userToBan)) {
            await sock.sendMessage(chatId, { 
                text: `${userToBan.split('@')[0]} is already banned!`,
                mentions: [userToBan],
                ...channelInfo 
            });
            return;
        }
        
        // Add to banned list
        bannedUsers.push(userToBan);
        fs.writeFileSync(bannedPath, JSON.stringify(bannedUsers, null, 2));
        
        // Send success message with image
        await sock.sendMessage(chatId, {
            image: { url: "https://files.catbox.moe/01f9y1.jpg" },
            caption: `⛔ ${userToBan.split('@')[0]} has been banned from using MAD-MAX bot.`,
            mentions: [userToBan],
            ...channelInfo
        }, { quoted: message });
        
    } catch (error) {
        console.error('Error in ban command:', error);
        await sock.sendMessage(chatId, { 
            text: 'Failed to ban user!', 
            ...channelInfo 
        }, { quoted: message });
    }
}

module.exports = banCommand;