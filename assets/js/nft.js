// NFT Collection Management and Verification System

const NFTManager = {
    // Package ID da coleção (será atualizado após deploy)
    COLLECTION_PACKAGE_ID: null,
    
    // Data limite para verificação de NFT (02/01/2026)
    NFT_REQUIREMENT_DATE: new Date('2026-01-02T00:00:00Z'),
    
    // Inicializar
    init() {
        // Carregar package ID salvo
        const savedPackageId = localStorage.getItem('nft_collection_package_id');
        if (savedPackageId) {
            this.COLLECTION_PACKAGE_ID = savedPackageId;
        }
    },
    
    // Salvar package ID da coleção
    setPackageId(packageId) {
        this.COLLECTION_PACKAGE_ID = packageId;
        localStorage.setItem('nft_collection_package_id', packageId);
    },
    
    // Verificar se usuário precisa de NFT (cadastrado após 02/01/2026)
    requiresNFT(user) {
        if (!user || !user.createdAt) return false;
        const userCreatedAt = new Date(user.createdAt);
        return userCreatedAt >= this.NFT_REQUIREMENT_DATE;
    },
    
    // Verificar se usuário tem NFT na carteira (simulado - em produção, integrar com Sui SDK)
    async checkUserHasNFT(userId) {
        // Em produção, isso verificaria a blockchain usando Sui SDK
        // Por enquanto, simulamos verificando localStorage
        const userNFTs = this.getUserNFTs(userId);
        return userNFTs.length > 0;
    },
    
    // Obter NFTs do usuário
    getUserNFTs(userId) {
        const key = `user_nfts_${userId}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    },
    
    // Adicionar NFT ao usuário (após mint)
    addUserNFT(userId, nftData) {
        const nfts = this.getUserNFTs(userId);
        const newNFT = {
            id: nftData.id || Date.now().toString(),
            name: nftData.name || 'Unnamed NFT',
            url: nftData.url || '',
            mintedAt: new Date().toISOString(),
            packageId: this.COLLECTION_PACKAGE_ID,
            transactionId: nftData.transactionId || null
        };
        nfts.push(newNFT);
        const key = `user_nfts_${userId}`;
        localStorage.setItem(key, JSON.stringify(nfts));
        return newNFT;
    },
    
    // Verificar acesso do usuário (combinando verificação de data e NFT)
    async verifyUserAccess(user) {
        // Admins não precisam de NFT
        if (typeof UserManager !== 'undefined' && UserManager.isAdmin()) {
            return { hasAccess: true, reason: 'admin' };
        }
        
        // Usuários cadastrados antes de 02/01/2026 não precisam de NFT
        if (!this.requiresNFT(user)) {
            return { hasAccess: true, reason: 'legacy_user' };
        }
        
        // Usuários cadastrados após 02/01/2026 precisam ter pelo menos 1 NFT
        const hasNFT = await this.checkUserHasNFT(user.id);
        if (hasNFT) {
            return { hasAccess: true, reason: 'has_nft' };
        }
        
        return { 
            hasAccess: false, 
            reason: 'nft_required',
            message: 'You need at least 1 NFT from the collection to access the platform. Please mint an NFT first.'
        };
    },
    
    // Obter todos os NFTs da coleção (para visualização)
    getAllCollectionNFTs() {
        if (typeof UserManager === 'undefined') {
            return [];
        }
        const users = UserManager.getUsers();
        const allNFTs = [];
        
        users.forEach(user => {
            const userNFTs = this.getUserNFTs(user.id);
            userNFTs.forEach(nft => {
                allNFTs.push({
                    ...nft,
                    ownerEmail: user.email,
                    ownerId: user.id
                });
            });
        });
        
        return allNFTs;
    },
    
    // Estatísticas da coleção
    getCollectionStats() {
        const allNFTs = this.getAllCollectionNFTs();
        if (typeof UserManager === 'undefined') {
            return { totalNFTs: 0, totalOwners: 0, totalUsers: 0, collectionPackageId: this.COLLECTION_PACKAGE_ID };
        }
        const users = UserManager.getUsers();
        const usersWithNFT = users.filter(user => {
            const userNFTs = this.getUserNFTs(user.id);
            return userNFTs.length > 0;
        });
        
        return {
            totalNFTs: allNFTs.length,
            totalOwners: usersWithNFT.length,
            totalUsers: users.length,
            collectionPackageId: this.COLLECTION_PACKAGE_ID
        };
    }
};

// Inicializar ao carregar (após UserManager estar disponível)
if (typeof UserManager !== 'undefined') {
    NFTManager.init();
} else {
    // Aguardar UserManager estar disponível
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof UserManager !== 'undefined') {
            NFTManager.init();
        }
    });
}

// Exportar para uso global
window.NFTManager = NFTManager;

