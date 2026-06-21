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
    }
}