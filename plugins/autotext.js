/**
 * MAD-MAX - Advanced AutoText Command
 * Works like autoreply but with text matching in all chats
 */

const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const autotextPath = path.join(__dirname, '../data/autotext.json');

// Show typing indicator
async function showTypingIndicator(sock, chatId) {
    try {
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        console.error('Typing indicator error:', error);
    }
}

// Initialize/load configuration
function initConfig() {
    if (!fs.existsSync(autotextPath)) {
        const defaultConfig = {
            enabled: false,
            responses: {
                "hi": "Hello! I'm MAD-MAX Bot",
                "hello": "Hi there!",
                "help": "Type .help for commands"
            },
            lastUpdated: Date.now()
        };
        fs.writeFileSync(autotextPath, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
    }
    
    const fileContent = fs.readFileSync(autotextPath, 'utf8').trim();
    
    if (!fileContent) {
        const defaultConfig = {
            enabled: false,
            responses: {},
            lastUpdated: Date.now()
        };
        fs.writeFileSync(autotextPath, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
    }
    
    try {
        const config = JSON.parse(fileContent);
        
        // Handle old format (just responses object)
        if (config.enabled === undefined) {
            const newConfig = {
                enabled: false,
                responses: config,
                lastUpdated: Date.now()
            };
            fs.writeFileSync(autotextPath, JSON.stringify(newConfig, null, 2));
            return newConfig;
        }
        
        return config;
    } catch (error) {
        console.error('Error parsing autotext.json:', error);
        const defaultConfig = {
            enabled: false,
            responses: {},
            lastUpdated: Date.now()
        };
        fs.writeFileSync(autotextPath, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
    }
}

// Save configuration
function saveConfig(config) {
    config.lastUpdated = Date.now();
    fs.writeFileSync(autotextPath, JSON.stringify(config, null, 2));
}

// Handle autotext for messages
async function handleAutotext(sock, chatId, senderId, userMessage, message) {
    try {
        const config = initConfig();
        
        // Check if autotext is enabled
        if (!config.enabled) {
            return;
        }
        
        // Check if the sender is owner/sudo
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        const { isSudo } = require('../lib/index');
        const senderIsSudo = await isSudo(senderId);
        
        // Don't auto-reply to owner/sudo messages
        if (isOwner || senderIsSudo || message.key.fromMe) {
            return;
        }

        // Clean the message for better matching
        const cleanMessage = userMessage.toLowerCase().trim();
        
        // Check for matches with improved pattern matching
        for (const text in config.responses) {
            const trigger = text.toLowerCase();
            
            // Check multiple matching conditions (in order of priority)
            let matched = false;
            
            // 1. Exact match (highest priority)
            if (cleanMessage === trigger) {
                matched = true;
            }
            // 2. Message starts with trigger followed by space or punctuation
            else if (cleanMessage.startsWith(trigger + ' ') ||
                     cleanMessage.startsWith(trigger + ',') ||
                     cleanMessage.startsWith(trigger + '.') ||
                     cleanMessage.startsWith(trigger + '!') ||
                     cleanMessage.startsWith(trigger + '?')) {
                matched = true;
            }
            // 3. Message contains trigger as a standalone word
            else if (cleanMessage.includes(' ' + trigger + ' ') ||
                     cleanMessage.includes(' ' + trigger + ',') ||
                     cleanMessage.includes(' ' + trigger + '.') ||
                     cleanMessage.includes(' ' + trigger + '!') ||
                     cleanMessage.includes(' ' + trigger + '?')) {
                matched = true;
            }
            // 4. For short triggers (1-5 chars), check if they're the first word
            else if (trigger.length <= 5) {
                const firstWord = cleanMessage.split(' ')[0];
                if (firstWord === trigger) {
                    matched = true;
                }
            }
            
            if (matched) {
                // Show typing indicator before sending reply
                await showTypingIndicator(sock, chatId);
                
                // Add a small delay to make it seem more natural
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Send reply WITHOUT forwarded context
                await sock.sendMessage(chatId, {
                    text: config.responses[text]
                }, { quoted: message });
                return;
            }
        }
    } catch (error) {
        console.error('Autotext error:', error);
    }
}

// Command to manage autotext
async function autotextCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!message.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, {
                text: '❌ This command is only available for the owner or sudo!'
            });
            return;
        }

        // Initialize config
        const config = initConfig();
        
        // Show status if no arguments
        if (args.length === 0) {
            const status = config.enabled ? '🟢 ON' : '🔴 OFF';
            const responseCount = Object.keys(config.responses || {}).length;
            
            const statusMessage = `📝 *MAD-MAX AutoText*\n\n` +
                                `Status: ${status}\n` +
                                `Responses: ${responseCount} entries\n\n` +
                                `*Usage:*\n` +
                                `• ${global.PREFIX || '.'}autotext on - Enable AutoText\n` +
                                `• ${global.PREFIX || '.'}autotext off - Disable AutoText\n` +
                                `• ${global.PREFIX || '.'}autotext add [trigger] [response] - Add new response\n` +
                                `• ${global.PREFIX || '.'}autotext del [trigger] - Remove response\n` +
                                `• ${global.PREFIX || '.'}autotext list - List all responses\n` +
                                `• ${global.PREFIX || '.'}autotext - Show this status`;
            
            await sock.sendMessage(chatId, {
                text: statusMessage
            }, { quoted: message });
            return;
        }
        
        const action = args[0]?.toLowerCase() || '';
        
        if (action === 'on') {
            // Enable autotext
            config.enabled = true;
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: `✅ *AutoText Enabled*\n\nI will now auto-respond to matching text in all chats.`
            }, { quoted: message });
            
        } else if (action === 'off') {
            // Disable autotext
            config.enabled = false;
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: '❌ *AutoText Disabled*\n\nAuto responses have been turned off.'
            }, { quoted: message });
            
        } else if (action === 'add') {
            // Add new response
            if (args.length < 3) {
                await sock.sendMessage(chatId, {
                    text: '❌ *Invalid usage!*\n\nExample: `.autotext add hi Hello there!`\nMake sure trigger and response are separated by space.'
                }, { quoted: message });
                return;
            }
            
            const trigger = args[1].toLowerCase();
            const response = args.slice(2).join(' ');
            
            if (!config.responses) config.responses = {};
            config.responses[trigger] = response;
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: `✅ *Response Added*\n\nTrigger: ${trigger}\nResponse: ${response}`
            }, { quoted: message });
            
        } else if (action === 'del' || action === 'remove') {
            // Remove response
            if (args.length < 2) {
                await sock.sendMessage(chatId, {
                    text: '❌ *Please specify trigger to remove!*\n\nExample: `.autotext del hi`'
                }, { quoted: message });
                return;
            }
            
            const trigger = args[1].toLowerCase();
            
            if (!config.responses || !config.responses[trigger]) {
                await sock.sendMessage(chatId, {
                    text: `❌ No response found for trigger: ${trigger}`
                }, { quoted: message });
                return;
            }
            
            delete config.responses[trigger];
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: `✅ *Response Removed*\n\nTrigger: ${trigger} has been deleted.`
            }, { quoted: message });
            
        } else if (action === 'list') {
            // List all responses
            if (!config.responses || Object.keys(config.responses).length === 0) {
                await sock.sendMessage(chatId, {
                    text: '📝 *No AutoText responses found.*\n\nUse `.autotext add` to create new ones.'
                }, { quoted: message });
                return;
            }
            
            let list = '📝 *AutoText Responses:*\n\n';
            Object.entries(config.responses).forEach(([trigger, response], index) => {
                list += `${index + 1}. *${trigger}* → ${response}\n`;
            });
            
            await sock.sendMessage(chatId, {
                text: list
            }, { quoted: message });
            
        } else if (action === 'clear') {
            // Clear all responses (reset to default)
            config.responses = {
                "hi": "Hello! I'm MAD-MAX Bot",
                "hello": "Hi there!",
                "help": "Type .help for commands"
            };
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: '🗑️ *All custom responses cleared!*\n\nReset to default responses.'
            }, { quoted: message });
            
        } else {
            // Invalid action
            await sock.sendMessage(chatId, {
                text: '❌ *Invalid command!*\n\nUse:\n' +
                      '• `.autotext on` - Enable\n' +
                      '• `.autotext off` - Disable\n' +
                      '• `.autotext add [trigger] [response]` - Add response\n' +
                      '• `.autotext del [trigger]` - Remove response\n' +
                      '• `.autotext list` - List all\n' +
                      '• `.autotext clear` - Reset to defaults'
            }, { quoted: message });
        }
        
    } catch (error) {
        console.error('😎 Error in autotext command:', error);
        await sock.sendMessage(chatId, {
            text: '😎 Error processing command!'
        }, { quoted: message });
    }
}

// Check if autotext is enabled
function isAutotextEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        console.error('Error checking autotext status:', error);
        return false;
    }
}

module.exports = {
    handleAutotext,
    autotextCommand,
    isAutotextEnabled
};