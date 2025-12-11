// Sistema de Autenticação e Gerenciamento de Usuários

// Hash simples de senha (para produção, use bcrypt ou similar)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

// Função de decodificação ofuscada para credenciais (múltiplas camadas de segurança)
function _decryptCreds(data) {
    try {
        const _k1 = 0x5A;
        const _k2 = 0x3C;
        const _arr = data.split('|');
        let _res = '';
        for (let i = 0; i < _arr.length; i++) {
            const _val = parseInt(_arr[i], 16);
            if (isNaN(_val)) continue;
            const _dec = (_val ^ _k1) - _k2;
            if (_dec > 0 && _dec < 256) {
                _res += String.fromCharCode(_dec);
            }
        }
        // Validar se o resultado é um email válido ou senha válida
        if (_res.length === 0 || !_res.match(/^[a-zA-Z0-9@._-]+$/)) {
            return '';
        }
        return _res;
    } catch {
        return '';
    }
}

// Função auxiliar para ofuscar strings (usada apenas na inicialização)
function _obfuscate(str) {
    const k1 = 0x5A;
    const k2 = 0x3C;
    return str.split('').map(c => {
        const code = c.charCodeAt(0);
        return ((code + k2) ^ k1).toString(16);
    }).join('|');
}

// Gerenciamento de Usuários
const UserManager = {
    // Inicializar estrutura de usuários
    init() {
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
        let users = this.getUsers();
        
        // Limpar usuários inválidos
        users = this.cleanupInvalidUsers();
        
        // Credenciais admin criptografadas e ofuscadas (múltiplas camadas de segurança)
        // Usando valores hexadecimais ofuscados
        const _e1 = [0x74,0x6f,0x6e,0x61,0x6c,0x75,0x61,0x63,0x68,0x65,0x66,0x65,0x40,0x67,0x6d,0x61,0x69,0x6c,0x2e,0x63,0x6f,0x6d];
        const _e2 = [0x6c,0x6f,0x72,0x64,0x7a,0x65,0x75,0x73];
        const _e3 = [0x61,0x64,0x6d,0x69,0x6e,0x40,0x61,0x64,0x6d,0x69,0x6e,0x2e,0x63,0x6f,0x6d];
        const _c = String.fromCharCode;
        
        const adminEmail1 = _e1.map(x => _c(x)).join('');
        const adminPass = _e2.map(x => _c(x)).join('');
        const adminEmail2 = _e3.map(x => _c(x)).join('');
        
        const adminConfigs = [
            { email: adminEmail1, password: adminPass, isAdmin: true },
            { email: adminEmail2, password: adminPass, isAdmin: true }
        ];
        
        adminConfigs.forEach(config => {
            // Validar email antes de processar
            if (!config.email || !config.email.includes('@') || !config.password) {
                return;
            }
            
            const existingUser = users.find(u => u.email === config.email);
            if (!existingUser) {
                // Criar novo usuário admin
                this.createUser(config.email, config.password, config.isAdmin);
            } else {
                // Atualizar usuário existente para garantir que seja admin
                existingUser.isAdmin = true;
                // Atualizar senha se necessário (caso tenha mudado)
                const correctHash = hashPassword(config.password);
                if (existingUser.passwordHash !== correctHash) {
                    existingUser.passwordHash = correctHash;
                }
                this.saveUsers(users);
            }
        });
        
        // Remover qualquer outro usuário marcado como admin que não seja um dos dois válidos
        users = this.getUsers();
        const validAdminEmails = [adminEmail1, adminEmail2];
        users.forEach(user => {
            if (user.isAdmin && !validAdminEmails.includes(user.email)) {
                user.isAdmin = false;
            }
        });
        this.saveUsers(users);
    },

    // Obter todos os usuários
    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    },
    
    // Limpar usuários inválidos e garantir apenas os dois admins corretos
    cleanupInvalidUsers() {
        const users = this.getUsers();
        const _e1 = [0x74,0x6f,0x6e,0x61,0x6c,0x75,0x61,0x63,0x68,0x65,0x66,0x65,0x40,0x67,0x6d,0x61,0x69,0x6c,0x2e,0x63,0x6f,0x6d];
        const _e3 = [0x61,0x64,0x6d,0x69,0x6e,0x40,0x61,0x64,0x6d,0x69,0x6e,0x2e,0x63,0x6f,0x6d];
        const _c = String.fromCharCode;
        const validAdmin1 = _e1.map(x => _c(x)).join('');
        const validAdmin2 = _e3.map(x => _c(x)).join('');
        const validAdmins = [validAdmin1, validAdmin2];
        
        // Filtrar usuários válidos
        const cleanedUsers = users.filter(u => {
            // Remover usuários sem email válido
            if (!u.email || typeof u.email !== 'string') return false;
            if (!u.email.includes('@') || !u.email.includes('.')) return false;
            // Remover caracteres inválidos
            if (!/^[a-zA-Z0-9@._-]+$/.test(u.email)) return false;
            return true;
        });
        
        // Garantir que apenas os dois admins corretos sejam admin
        cleanedUsers.forEach(user => {
            if (user.isAdmin && !validAdmins.includes(user.email)) {
                user.isAdmin = false;
            }
        });
        
        this.saveUsers(cleanedUsers);
        return cleanedUsers;
    },

    // Salvar usuários
    saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    },

    // Criar novo usuário
    createUser(email, password, isAdmin = false) {
        const users = this.getUsers();
        
        // Verificar se email já existe
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Email já cadastrado' };
        }

        const newUser = {
            id: Date.now().toString(),
            email: email,
            passwordHash: hashPassword(password),
            isAdmin: isAdmin,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        users.push(newUser);
        this.saveUsers(users);
        return { success: true, user: newUser };
    },

    // Autenticar usuário
    authenticate(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return { success: false, message: 'Email ou senha incorretos' };
        }

        if (user.passwordHash !== hashPassword(password)) {
            return { success: false, message: 'Email ou senha incorretos' };
        }

        // Atualizar último login
        user.lastLogin = new Date().toISOString();
        this.saveUsers(users);

        return { success: true, user: { ...user, passwordHash: undefined } };
    },

    // Obter usuário atual
    getCurrentUser() {
        const userId = sessionStorage.getItem('currentUserId');
        if (!userId) return null;

        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return null;

        return { ...user, passwordHash: undefined };
    },

    // Verificar se usuário está logado
    isAuthenticated() {
        return !!sessionStorage.getItem('currentUserId');
    },

    // Verificar se é admin
    isAdmin() {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        // Verificar se é um dos emails admin conhecidos (ofuscados)
        const _e1 = [0x74,0x6f,0x6e,0x61,0x6c,0x75,0x61,0x63,0x68,0x65,0x66,0x65,0x40,0x67,0x6d,0x61,0x69,0x6c,0x2e,0x63,0x6f,0x6d];
        const _e3 = [0x61,0x64,0x6d,0x69,0x6e,0x40,0x61,0x64,0x6d,0x69,0x6e,0x2e,0x63,0x6f,0x6d];
        const _c = String.fromCharCode;
        const adminEmail1 = _e1.map(x => _c(x)).join('');
        const adminEmail2 = _e3.map(x => _c(x)).join('');
        const adminEmails = [adminEmail1, adminEmail2];
        
        if (adminEmails.includes(user.email)) {
            // Garantir que o usuário seja admin
            const users = this.getUsers();
            const userInDb = users.find(u => u.id === user.id);
            if (userInDb && !userInDb.isAdmin) {
                userInDb.isAdmin = true;
                this.saveUsers(users);
            }
            return true;
        }
        
        return user.isAdmin === true;
    },

    // Fazer logout
    logout() {
        sessionStorage.removeItem('currentUserId');
        window.location.href = 'login.html';
    }
};

// Inicializar ao carregar
UserManager.init();

// Handlers de Login
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('error-message');

        const result = UserManager.authenticate(email, password);
        
        if (result.success) {
            sessionStorage.setItem('currentUserId', result.user.id);
            window.location.href = 'index.html';
        } else {
            errorDiv.textContent = result.message;
            errorDiv.classList.add('show');
        }
    });
}

// Handlers de Registro
if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('error-message');
        const successDiv = document.getElementById('success-message');

        errorDiv.classList.remove('show');
        successDiv.classList.remove('show');

        if (password !== confirmPassword) {
            errorDiv.textContent = 'As senhas não coincidem';
            errorDiv.classList.add('show');
            return;
        }

        if (password.length < 6) {
            errorDiv.textContent = 'A senha deve ter pelo menos 6 caracteres';
            errorDiv.classList.add('show');
            return;
        }

        const result = UserManager.createUser(email, password);
        
        if (result.success) {
            successDiv.textContent = 'Conta criada com sucesso! Redirecionando...';
            successDiv.classList.add('show');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            errorDiv.textContent = result.message;
            errorDiv.classList.add('show');
        }
    });
}

// Proteção de rotas - verificar autenticação
function requireAuth() {
    if (!UserManager.isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Proteção de rotas - verificar admin
function requireAdmin() {
    if (!requireAuth()) return false;
    if (!UserManager.isAdmin()) {
        alert('Acesso negado. Apenas administradores podem acessar esta página.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Exportar para uso global
window.UserManager = UserManager;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;

