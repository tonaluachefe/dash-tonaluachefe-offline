// Painel Administrativo

document.addEventListener('DOMContentLoaded', () => {
    // Verificar se é admin
    if (!requireAdmin()) return;

    // Função para obter dados de um usuário específico
    function getUserData(userId) {
        // Os dados são armazenados por usuário no localStorage
        // Formato: 'user_data_' + userId
        const userDataKey = `user_data_${userId}`;
        const data = JSON.parse(localStorage.getItem(userDataKey) || '{}');
        
        return {
            airdrops: data.airdrops || [],
            stakes: data.stakes || [],
            pools: data.pools || [],
            wallets: data.wallets || []
        };
    }

    // Calcular todas as métricas de um usuário (8 categorias do dashboard)
    function calculateUserStats(userId) {
        const data = getUserData(userId);
        
        // 1. Ativos (Airdrops Ativos)
        const ativos = data.airdrops.filter(a => a.status !== 'Concluído' && a.status !== 'Não começou').length;
        
        // 2. Completos (Projetos Finalizados)
        const completos = data.airdrops.filter(a => a.status === 'Concluído').length;
        
        // 3. Consistência (Taxa de conclusão)
        const totalAirdrops = data.airdrops.length;
        const consistencia = totalAirdrops > 0 ? Math.round((completos / totalAirdrops) * 100) : 0;
        
        // 4. Mensal (Lucro Líquido) - Receita Bruta - Custos
        const receitaBruta = data.airdrops.reduce((sum, a) => {
            return sum + (parseFloat(a.received) || 0);
        }, 0);
        
        // Ganhos de stakes
        const stakeGains = data.stakes.reduce((sum, s) => {
            const days = s.startDate ? (new Date() - new Date(s.startDate)) / (1000 * 60 * 60 * 24) : 0;
            return sum + ((s.value || 0) * (s.apy || 0) / 100 * (days / 365));
        }, 0);

        // Ganhos de pools
        const poolGains = data.pools.reduce((sum, p) => {
            const days = p.startDate ? (new Date() - new Date(p.startDate)) / (1000 * 60 * 60 * 24) : 0;
            return sum + ((p.value || 0) * (p.apy || 0) / 100 * (days / 365));
        }, 0);

        // 5. Bruta (Receita Bruta total)
        const totalReceitaBruta = receitaBruta + stakeGains + poolGains;
        
        // 6. Custos (pode ser expandido)
        const custos = 0;
        
        // 7. Stakes (Total em Stakes)
        const totalStakes = data.stakes.reduce((sum, s) => sum + (s.value || 0), 0);
        
        // 8. Pools (Rendimento Pools)
        const rendimentoPools = poolGains;
        
        // Lucro Líquido
        const lucroLiquido = totalReceitaBruta - custos;

        return {
            // 8 métricas do dashboard
            ativos,
            completos,
            consistencia,
            mensal: lucroLiquido,
            bruta: totalReceitaBruta,
            custos,
            stakes: totalStakes,
            pools: rendimentoPools,
            // Métricas adicionais
            totalProjects: data.airdrops.length + data.stakes.length + data.pools.length,
            airdropsCount: data.airdrops.length,
            stakesCount: data.stakes.length,
            poolsCount: data.pools.length,
            netProfit: lucroLiquido
        };
    }

    // Obter projetos utilizados por um usuário
    function getUserProjects(userId) {
        const data = getUserData(userId);
        
        const projects = [];
        
        // Airdrops
        data.airdrops.forEach(a => {
            projects.push({
                type: 'Airdrop',
                name: a.name,
                status: a.status,
                category: a.category,
                received: parseFloat(a.received) || 0
            });
        });

        // Stakes
        data.stakes.forEach(s => {
            projects.push({
                type: 'Stake',
                name: `${s.protocol} - ${s.token}`,
                status: s.status,
                value: s.value || 0,
                apy: s.apy || 0
            });
        });

        // Pools
        data.pools.forEach(p => {
            projects.push({
                type: 'Pool',
                name: `${p.protocol} - ${p.token}`,
                status: p.status,
                value: p.value || 0,
                apy: p.apy || 0
            });
        });

        return projects;
    }

    // Renderizar lista de usuários
    function renderUsers() {
        const users = UserManager.getUsers();
        const searchTerm = (document.getElementById('user-search').value || '').toLowerCase();
        const usersList = document.getElementById('users-list');
        
        const filtered = users.filter(u => 
            u.email.toLowerCase().includes(searchTerm)
        );

        // Atualizar estatísticas gerais
        let totalGains = 0;
        let totalProjects = 0;
        let activeUsers = 0;

        users.forEach(user => {
            const stats = calculateUserStats(user.id);
            totalGains += stats.netProfit;
            totalProjects += stats.totalProjects;
            if (stats.totalProjects > 0) activeUsers++;
        });

        document.getElementById('total-users').textContent = users.length;
        document.getElementById('active-users').textContent = activeUsers;
        document.getElementById('total-gains').textContent = '$' + totalGains.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        document.getElementById('total-projects').textContent = totalProjects;

        // Renderizar cards de usuários
        usersList.innerHTML = '';
        
        if (filtered.length === 0) {
            usersList.innerHTML = '<p style="color:#aaa;text-align:center;padding:40px;">Nenhum usuário encontrado</p>';
            return;
        }

        filtered.forEach(user => {
            const stats = calculateUserStats(user.id);
            const projects = getUserProjects(user.id);
            
            const card = document.createElement('div');
            card.className = 'card';
            card.style.cssText = 'padding:20px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);';
            
            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">
                    <div>
                        <h3 style="margin:0 0 4px 0;color:#fff;font-size:18px;">${user.email}</h3>
                        <div style="display:flex;gap:8px;margin-top:8px;">
                            ${user.isAdmin ? '<span style="background:#3b82f6;color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;">Admin</span>' : ''}
                            <span style="background:rgba(255,255,255,0.1);color:#aaa;padding:4px 8px;border-radius:4px;font-size:12px;">
                                Cadastrado: ${new Date(user.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                            ${user.lastLogin ? `<span style="background:rgba(255,255,255,0.1);color:#aaa;padding:4px 8px;border-radius:4px;font-size:12px;">
                                Último login: ${new Date(user.lastLogin).toLocaleDateString('pt-BR')}
                            </span>` : ''}
                        </div>
                    </div>
                </div>

                <!-- 8 Métricas do Dashboard -->
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <div>
                        <div style="color:#aaa;font-size:12px;margin-bottom:4px;">Ativos</div>
                        <div style="color:#3b82f6;font-weight:500;font-size:18px;">${stats.ativos}</div>
                        <div style="color:#666;font-size:10px;">Airdrops Ativos</div>
                    </div>
                    <div>
                        <div style="color:#aaa;font-size:12px;margin-bottom:4px;">Completos</div>
                        <div style="color:#10b981;font-weight:500;font-size:18px;">${stats.completos}</div>
                        <div style="color:#666;font-size:10px;">Projetos Finalizados</div>
                    </div>
                    <div>
                        <div style="color:#aaa;font-size:12px;margin-bottom:4px;">Consistência</div>
                        <div style="color:#f97316;font-weight:500;font-size:18px;">${stats.consistencia}%</div>
                        <div style="color:#666;font-size:10px;">Taxa de conclusão</div>
                    </div>
                    <div>
                        <div style="color:#aaa;font-size:12px;margin-bottom:4px;">Mensal</div>
                        <div style="color:#${stats.mensal >= 0 ? '10b981' : 'ef4444'};font-weight:500;font-size:18px;">$${stats.mensal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <div style="color:#666;font-size:10px;">Líquido</div>
                    </div>
                    <div>
                        <div style="color:#aaa;font-size:12px;margin-bottom:4px;">Bruta</div>
                        <div style="color:#3b82f6;font-weight:500;font-size:18px;">$${stats.bruta.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <div style="color:#666;font-size:10px;">Receita Bruta</div>
                    </div>
                    <div>
                        <div style="color:#aaa;font-size:12px;margin-bottom:4px;">Custos</div>
                        <div style="color:#ef4444;font-weight:500;font-size:18px;">$${stats.custos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <div style="color:#666;font-size:10px;">Custos Totais</div>
                    </div>
                    <div>
                        <div style="color:#aaa;font-size:12px;margin-bottom:4px;">Stakes</div>
                        <div style="color:#3b82f6;font-weight:500;font-size:18px;">$${stats.stakes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <div style="color:#666;font-size:10px;">Total em Stakes</div>
                    </div>
                    <div>
                        <div style="color:#aaa;font-size:12px;margin-bottom:4px;">Pools</div>
                        <div style="color:#ec4899;font-weight:500;font-size:18px;">$${stats.pools.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <div style="color:#666;font-size:10px;">Rendimento Pools</div>
                    </div>
                </div>

                <div>
                    <div style="color:#aaa;font-size:12px;margin-bottom:8px;">Projetos Utilizados:</div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                        ${projects.length > 0 ? projects.slice(0, 10).map(p => `
                            <span style="background:rgba(59,130,246,0.2);border:1px solid rgba(59,130,246,0.3);color:#60a5fa;padding:4px 8px;border-radius:4px;font-size:11px;">
                                ${p.type}: ${p.name}
                            </span>
                        `).join('') : '<span style="color:#666;font-size:12px;">Nenhum projeto cadastrado</span>'}
                        ${projects.length > 10 ? `<span style="color:#aaa;font-size:11px;">+${projects.length - 10} mais</span>` : ''}
                    </div>
                </div>
            `;
            
            usersList.appendChild(card);
        });
    }

    // Event listener para busca
    document.getElementById('user-search').addEventListener('input', renderUsers);

    // Renderizar inicialmente
    renderUsers();
});











