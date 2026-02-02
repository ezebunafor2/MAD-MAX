const fs = require('fs');
const isOwnerOrSudo = require('../lib/isOwner');

const dmBLOCKER_PATH = './data/dmblocker.json';

function readState() {
    try {
        if (!fs.existsSync(dmBLOCKER_PATH)) return { enabled: false, message: '⚠️ Direct messages are blocked!\nYou cannot DM this bot. Please contact the owner in group chats only.' };
        const raw = fs.readFileSync(dmBLOCKER_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return {
            enabled: !!data.enabled,
            message: typeof data.message === 'string' && data.message.trim() ? data.message : '⚠️ Direct messages are blocked!\nYou cannot DM this bot. Please contact the owner in group chats only.'
        };
    } catch {
        return { enabled: false, message: '⚠️ Direct messages are blocked!\nYou cannot DM this bot. Please contact the owner in group chats only.' };
    }
}

function writeState(enabled, message) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        const current = readState();
        const payload = {
            enabled: !!enabled,
            message: typeof message === 'string' && message.trim() ? message : current.message
        };
        fs.writeFileSync(dmBLOCKER_PATH, JSON.stringify(payload, null, 2));
    } catch {}
}

async function dmblockerCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    
    if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(chatId, { text: 'Only bot owner can use this command!' }, { quoted: message });
        return;
    }
    
    const argStr = (args || '').trim();
    const [sub, ...rest] = argStr.split(' ');
    const state = readState();

    if (!sub || !['on', 'off', 'status', 'setmsg'].includes(sub.toLowerCase())) {
        await sock.sendMessage(chatId, { text: '*dmBLOCKER (Owner only)*\n\n.dmblocker on - Enable dm auto-block\n.dmblocker off - Disable dm blocker\n.dmblocker status - Show current status\n.dmblocker setmsg <text> - Set warning message' }, { quoted: message });
        return;
    }

    if (sub.toLowerCase() === 'status') {
        await sock.sendMessage(chatId, { text: `dm Blocker is currently *${state.enabled ? 'ON' : 'OFF'}*\nMessage: ${state.message}` }, { quoted: message });
        return;
    }

    if (sub.toLowerCase() === 'setmsg') {
        const newMsg = rest.join(' ').trim();
        if (!newMsg) {
            await sock.sendMessage(chatId, { text: 'Usage: .dmblocker setmsg <message>' }, { quoted: message });
            return;
        }
        writeState(state.enabled, newMsg);
        await sock.sendMessage(chatId, { text: 'dm Blocker message updated.' }, { quoted: message });
        return;
    }

    const enable = sub.toLowerCase() === 'on';
    writeState(enable);
    await sock.sendMessage(chatId, { text: `dm Blocker is now *${enable ? 'ENABLED' : 'DISABLED'}*.` }, { quoted: message });
}

module.exports = { dmblockerCommand, readState };


