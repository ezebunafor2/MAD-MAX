async function online(sock, chatId, message, isGroup, senderId, isSenderAdmin, isBotAdmin) {
    try {
        // Check if the command is used in a group
        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: "❌ This command can only be used in a group!",
                ...global.channelInfo
            }, { quoted: message });
            return;
        }

        // Check if user is either creator or admin
        const { isSudo } = require('../lib/index');
        const senderIsSudo = await isSudo(senderId);
        const isCreator = message.key.fromMe || senderIsSudo;
        
        if (!isCreator && !isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: "❌ Only bot owner/sudo and group admins can use this command!",
                ...global.channelInfo
            }, { quoted: message });
            return;
        }

        // Inform user that we're checking
        const processingMsg = await sock.sendMessage(chatId, {
            text: "🔄 Scanning for online members... This may take 15-20 seconds.",
            ...global.channelInfo
        }, { quoted: message });

        const onlineMembers = new Set();
        
        try {
            // Get group metadata
            const groupData = await sock.groupMetadata(chatId);
            
            // Request presence updates for all participants
            const presencePromises = [];
            
            for (const participant of groupData.participants) {
                presencePromises.push(
                    sock.presenceSubscribe(participant.id)
                        .then(() => {
                            // Additional check for better detection
                            return sock.sendPresenceUpdate('composing', participant.id);
                        })
                        .catch(() => {}) // Ignore errors for individual users
                );
            }

            await Promise.all(presencePromises);

            // Presence update handler
            const presenceHandler = (json) => {
                try {
                    for (const id in json.presences) {
                        const presence = json.presences[id]?.lastKnownPresence;
                        // Check all possible online states
                        if (['available', 'composing', 'recording', 'online'].includes(presence)) {
                            onlineMembers.add(id);
                        }
                    }
                } catch (e) {
                    console.error('Error in presence handler:', e);
                }
            };

            sock.ev.on('presence.update', presenceHandler);

            // Multiple checks with timeout
            const checks = 3;
            const checkInterval = 5000; // 5 seconds
            let checksDone = 0;

            const checkOnline = async () => {
                checksDone++;
                
                if (checksDone >= checks) {
                    clearInterval(interval);
                    sock.ev.off('presence.update', presenceHandler);
                    
                    // Update processing message
                    await sock.sendMessage(chatId, {
                        text: `✅ Scan complete! Found ${onlineMembers.size} online members.`,
                        edit: processingMsg.key
                    });

                    if (onlineMembers.size === 0) {
                        await sock.sendMessage(chatId, {
                            text: "⚠️ Couldn't detect any online members. They might be hiding their presence.",
                            ...global.channelInfo
                        }, { quoted: message });
                        return;
                    }
                    
                    const onlineArray = Array.from(onlineMembers);
                    const onlineList = onlineArray.map((member, index) => 
                        `${index + 1}. @${member.split('@')[0]}`
                    ).join('\n');
                    
                    const messageText = `🚦 *MAD-MAX Online Members*\n\n` +
                                       `*Online:* ${onlineArray.length}/${groupData.participants.length}\n\n` +
                                       `${onlineList}`;
                    
                    await sock.sendMessage(chatId, { 
                        text: messageText,
                        mentions: onlineArray,
                        ...global.channelInfo
                    }, { quoted: message });
                }
            };

            const interval = setInterval(checkOnline, checkInterval);

            // Safety timeout (30 seconds)
            setTimeout(() => {
                clearInterval(interval);
                sock.ev.off('presence.update', presenceHandler);
                
                if (onlineMembers.size === 0) {
                    sock.sendMessage(chatId, {
                        text: "⏰ Scan timed out. Try again or members might be offline.",
                        ...global.channelInfo
                    }, { quoted: message });
                }
            }, 30000);

        } catch (groupError) {
            console.error('Group metadata error:', groupError);
            await sock.sendMessage(chatId, {
                text: "❌ Failed to get group information. Make sure I'm a participant.",
                ...global.channelInfo
            }, { quoted: message });
        }

    } catch (e) {
        console.error("Error in online command:", e);
        await sock.sendMessage(chatId, {
            text: `❌ An error occurred: ${e.message}`,
            ...global.channelInfo
        }, { quoted: message });
    }
}

module.exports = {
    online
};