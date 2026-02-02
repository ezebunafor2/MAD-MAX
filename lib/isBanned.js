const fs = require('fs');
const path = require('path');

const banPath = path.join(__dirname, '../data/ban.json');

// Check if user is banned
function isBanned(userId) {
    try {
        if (!fs.existsSync(banPath)) {
            fs.writeFileSync(banPath, JSON.stringify([]));
            return false;
        }
        
        const banned = JSON.parse(fs.readFileSync(banPath, 'utf8'));
        return banned.includes(userId);
    } catch (error) {
        console.error('Error checking ban status:', error);
        return false;
    }
}

// Get all banned users
function getBannedUsers() {
    try {
        if (!fs.existsSync(banPath)) {
            return [];
        }
        
        const banned = JSON.parse(fs.readFileSync(banPath, 'utf8'));
        return [...new Set(banned)]; // Remove duplicates
    } catch (error) {
        console.error('Error getting banned users:', error);
        return [];
    }
}

// Add user to ban list
function banUser(userId) {
    try {
        let banned = getBannedUsers();
        if (!banned.includes(userId)) {
            banned.push(userId);
            fs.writeFileSync(banPath, JSON.stringify(banned, null, 2));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error banning user:', error);
        return false;
    }
}

// Remove user from ban list
function unbanUser(userId) {
    try {
        let banned = getBannedUsers();
        const updated = banned.filter(u => u !== userId);
        
        if (updated.length !== banned.length) {
            fs.writeFileSync(banPath, JSON.stringify(updated, null, 2));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error unbanning user:', error);
        return false;
    }
}

module.exports = {
    isBanned,
    getBannedUsers,
    banUser,
    unbanUser
};