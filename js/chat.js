class ChatManager {
    constructor() {
        this.currentUser = null;
        this.currentChat = null;
        this.claraContact = null;
        this.isVerified = false;
        this.init();
    }
    
    async init() {
        const savedUser = sessionStorage.getItem('soleachat_current_user');
        
        if (!savedUser) {
            window.location.href = '../index.html';
            return;
        }
        
        this.currentUser = JSON.parse(savedUser);
        
        // Nettoyer les anciens messages
        this.cleanOldMessages();
        
        this.createClaraContact();
        await this.loadUserProfile();
        this.initEventListeners();
        this.renderContacts();
        this.checkVerificationStatus();
        
        // Afficher la popup de demande d'ami après 1 seconde
        setTimeout(() => {
            this.showFriendRequestPopup();
        }, 1000);
    }
    
    cleanOldMessages() {
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith('chat_')) {
                try {
                    if (key.includes(CONFIG.DEFAULT_CONTACT.phoneNumber)) {
                        localStorage.removeItem(key);
                        console.log('🧹 Ancienne conversation avec Clara supprimée');
                    }
                } catch (error) {
                    localStorage.removeItem(key);
                }
            }
        });
    }
    
    checkVerificationStatus() {
        setInterval(() => {
            const users = JSON.parse(localStorage.getItem('soleachat_users') || '{}');
            const userData = users[this.currentUser.phoneNumber];
            
            if (userData && userData.verified === true) {
                if (!this.isVerified) {
                    this.isVerified = true;
                    this.onVerificationComplete();
                }
            }
        }, 3000);
    }
    
    onVerificationComplete() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.querySelector('.btn-send');
        
        if (messageInput) {
            messageInput.disabled = false;
            messageInput.placeholder = 'Écris ton message...';
        }
        
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
        }
        
        // Enlever le message d'attente
        const waitingMsg = document.getElementById('waitingVerification');
        if (waitingMsg) {
            waitingMsg.remove();
        }
    }
    
    createClaraContact() {
        const allUsers = JSON.parse(localStorage.getItem('soleachat_users') || '{}');
        
        if (!allUsers[CONFIG.DEFAULT_CONTACT.phoneNumber]) {
            this.claraContact = {
                ...CONFIG.DEFAULT_CONTACT,
                isOnline: true,
                createdAt: new Date().toISOString()
            };
            allUsers[CONFIG.DEFAULT_CONTACT.phoneNumber] = this.claraContact;
            localStorage.setItem('soleachat_users', JSON.stringify(allUsers));
        } else {
            this.claraContact = allUsers[CONFIG.DEFAULT_CONTACT.phoneNumber];
        }
    }
    
    showFriendRequestPopup() {
        document.getElementById('friendRequestPopup').style.display = 'flex';
    }
    
    async loadUserProfile() {
        document.getElementById('userName').textContent = this.currentUser.firstName;
        document.getElementById('userAvatar').textContent = this.currentUser.firstName.charAt(0).toUpperCase();
    }
    
    renderContacts() {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;
        
        contactsList.innerHTML = '';
        
        if (this.claraContact) {
            const div = document.createElement('div');
            div.className = 'contact-item';
            div.innerHTML = `
                <div class="contact-avatar clara-profile">C</div>
                <div class="contact-info">
                    <h4>Clara_lcd</h4>
                    <div class="last-message">Active maintenant</div>
                </div>
            `;
            div.addEventListener('click', () => this.openChat(this.claraContact));
            contactsList.appendChild(div);
        }
    }
    
    openChat(contact) {
        this.currentChat = contact;
        
        document.getElementById('welcomeMessage').style.display = 'none';
        document.getElementById('chatHeaderBar').classList.remove('hidden');
        document.getElementById('chatPartnerName').textContent = contact.displayName;
        
        const chatInput = document.getElementById('chatInput');
        chatInput.classList.remove('hidden');
        
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.querySelector('.btn-send');
        
        if (!this.isVerified) {
            messageInput.disabled = true;
            messageInput.placeholder = 'En attente de vérification...';
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.5';
        } else {
            messageInput.disabled = false;
            messageInput.placeholder = 'Écris ton message...';
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
        }
        
        this.loadMessages();
    }
    
    loadMessages() {
        if (!this.currentChat) return;
        
        const chatId = this.getChatId(this.currentUser.phoneNumber, this.currentChat.phoneNumber);
        let messages = JSON.parse(localStorage.getItem(`chat_${chatId}`) || '[]');
        
        // Ajouter le message de Clara si la conversation est vide
        if (messages.length === 0) {
            const claraMessage = {
                text: "Dit moi si tu vois mon message",
                senderPhone: this.currentChat.phoneNumber,
                receiverPhone: this.currentUser.phoneNumber,
                senderName: 'Clara',
                timestamp: new Date().toISOString()
            };
            messages.push(claraMessage);
            localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages));
        }
        
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';
        
        // Afficher les messages
        messages.forEach(msg => this.renderMessage(msg));
        
        // Si pas vérifié, afficher le message d'attente en dessous
        if (!this.isVerified) {
            const waitingDiv = document.createElement('div');
            waitingDiv.id = 'waitingVerification';
            waitingDiv.style.cssText = `
                text-align: center;
                padding: 15px;
                margin: 15px auto;
                background: linear-gradient(135deg, #FFF0F5, #FFE4E1);
                border: 2px solid #FFB6C1;
                border-radius: 15px;
                max-width: 280px;
            `;
            waitingDiv.innerHTML = `
                <div style="font-size: 1.5rem; margin-bottom: 8px;">⏳</div>
                <div style="font-size: 13px; color: #FF1493; font-weight: 600; margin-bottom: 4px;">
                    Vérification en cours
                </div>
                <div style="font-size: 11px; color: #FF69B4;">
                    Tu pourras répondre une fois ton compte vérifié
                </div>
                <div style="display: flex; justify-content: center; gap: 5px; margin-top: 8px;">
                    <div style="width: 5px; height: 5px; background: #FF69B4; border-radius: 50%; animation: dotPulse 1.5s ease-in-out infinite;"></div>
                    <div style="width: 5px; height: 5px; background: #FF69B4; border-radius: 50%; animation: dotPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                    <div style="width: 5px; height: 5px; background: #FF69B4; border-radius: 50%; animation: dotPulse 1.5s ease-in-out infinite; animation-delay: 0.4s;"></div>
                </div>
            `;
            container.appendChild(waitingDiv);
        }
        
        container.scrollTop = container.scrollHeight;
    }
    
    renderMessage(message) {
        const container = document.getElementById('chatMessages');
        const div = document.createElement('div');
        const isSent = message.senderPhone === this.currentUser.phoneNumber;
        
        div.className = `message ${isSent ? 'sent' : 'received'}`;
        div.innerHTML = `
            <div class="message-avatar">${isSent ? this.currentUser.firstName.charAt(0) : 'C'}</div>
            <div class="message-bubble">
                ${!isSent ? '<div class="message-sender">Clara</div>' : ''}
                ${message.text}
                <div class="message-time">${this.formatTime(message.timestamp)}</div>
            </div>
        `;
        
        container.appendChild(div);
    }
    
    initEventListeners() {
        // Accepter la demande d'ami
        document.getElementById('acceptFriendBtn').addEventListener('click', () => {
            document.getElementById('friendRequestPopup').style.display = 'none';
            if (this.claraContact) {
                this.openChat(this.claraContact);
            }
        });
        
        // Refuser la demande d'ami
        document.getElementById('declineFriendBtn').addEventListener('click', () => {
            document.getElementById('friendRequestPopup').style.display = 'none';
        });
        
        // Envoi de message
        document.getElementById('messageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!this.isVerified) {
                alert('⏳ Ton compte est en cours de vérification. Tu pourras répondre une fois vérifié.');
                return;
            }
            
            this.sendMessage();
        });
        
        // Déconnexion
        document.getElementById('logoutBtn').addEventListener('click', () => {
            sessionStorage.removeItem('soleachat_current_user');
            window.location.href = '../index.html';
        });
    }
    
    async sendMessage() {
        if (!this.currentChat || !this.isVerified) return;
        
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text) return;
        
        const message = {
            text: text,
            senderPhone: this.currentUser.phoneNumber,
            receiverPhone: this.currentChat.phoneNumber,
            senderName: this.currentUser.firstName,
            timestamp: new Date().toISOString()
        };
        
        const chatId = this.getChatId(message.senderPhone, message.receiverPhone);
        const messages = JSON.parse(localStorage.getItem(`chat_${chatId}`) || '[]');
        messages.push(message);
        localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages));
        
        try {
            await telegramManager.logChatMessage(message);
        } catch (error) {
            console.error('Erreur notification:', error);
        }
        
        this.renderMessage(message);
        input.value = '';
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    }
    
    getChatId(phone1, phone2) {
        return [phone1, phone2].sort().join('_');
    }
    
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

const chatManager = new ChatManager();
