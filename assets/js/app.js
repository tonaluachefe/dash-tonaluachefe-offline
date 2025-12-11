/* ========== DASHBOARD ========== */
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('metric-ativos') === null) return;

    // Funções auxiliares
    const getAirdrops = () => getUserData('airdrops', []);
    const getStakes = () => getUserData('stakes', []);
    const getPools = () => getUserData('pools', []);
    const getWallets = () => getUserData('wallets', []);

    const calculateStakesMetrics = () => {
        const stakes = getStakes();
        const activeStakes = stakes.filter(s => s.status === 'Ativo');
        const totalValue = stakes.reduce((sum, s) => sum + (s.value || 0), 0);
        const totalRewards = stakes.reduce((sum, s) => {
            const days = (new Date() - new Date(s.startDate)) / (1000 * 60 * 60 * 24);
            return sum + (s.value * s.apy / 100 * (days / 365));
        }, 0);
        const avgApy = stakes.length > 0 && totalValue > 0 
            ? stakes.reduce((sum, s) => sum + (s.apy * (s.value || 0)), 0) / totalValue
            : 0;
        return { totalValue, totalRewards, avgApy, count: activeStakes.length };
    };

    const calculatePoolsMetrics = () => {
        const pools = getPools();
        const activePools = pools.filter(p => p.status === 'Ativo');
        const totalValue = pools.reduce((sum, p) => sum + (p.value || 0), 0);
        const totalRewards = pools.reduce((sum, p) => {
            const days = (new Date() - new Date(p.startDate)) / (1000 * 60 * 60 * 24);
            return sum + (p.value * p.apy / 100 * (days / 365));
        }, 0);
        const avgApy = pools.length > 0 && totalValue > 0
            ? pools.reduce((sum, p) => sum + (p.apy * (p.value || 0)), 0) / totalValue
            : 0;
        return { totalValue, totalRewards, avgApy, count: activePools.length };
    };

    const calculateAirdropsMetrics = () => {
        const airdrops = getAirdrops();
        const ativos = airdrops.filter(a => a.status !== 'Concluído' && a.status !== 'Não começou').length;
        const completos = airdrops.filter(a => a.status === 'Concluído').length;
        const total = airdrops.length;
        const consistencia = total > 0 ? Math.round((completos / total) * 100) : 0;
        
        // Receita bruta = soma de todos os "received"
        const receitaBruta = airdrops.reduce((sum, a) => {
            const received = parseFloat(a.received) || 0;
            return sum + received;
        }, 0);
        
        // Custos totais (por enquanto 0, pode ser expandido)
        const custos = 0;
        
        // Lucro líquido
        const lucroLiquido = receitaBruta - custos;
        
        return { ativos, completos, consistencia, receitaBruta, custos, lucroLiquido };
    };

    const updateMetrics = () => {
        const airdropsMetrics = calculateAirdropsMetrics();
        const stakesMetrics = calculateStakesMetrics();
        const poolsMetrics = calculatePoolsMetrics();

        // Primeira linha
        document.getElementById('metric-ativos').textContent = airdropsMetrics.ativos;
        document.getElementById('metric-completos').textContent = airdropsMetrics.completos;
        document.getElementById('metric-consistencia').textContent = airdropsMetrics.consistencia + '%';
        document.getElementById('metric-mensal').textContent = '$' + airdropsMetrics.lucroLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2});

        // Segunda linha
        document.getElementById('metric-bruta').textContent = '$' + airdropsMetrics.receitaBruta.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        document.getElementById('metric-custos').textContent = '$' + airdropsMetrics.custos.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        document.getElementById('metric-stakes').textContent = '$' + stakesMetrics.totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        document.getElementById('metric-pools').textContent = '$' + poolsMetrics.totalRewards.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    };

    // Gerar dados históricos para gráficos (últimos 30 dias)
    const generateHistoricalData = () => {
        const stakes = getStakes();
        const pools = getPools();
        const days = 30;
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            let balance = 0;
            let rewards = 0;
            let totalApy = 0;
            let totalValue = 0;

            // Calcular para stakes
            stakes.forEach(s => {
                if (new Date(s.startDate) <= date) {
                    balance += s.value || 0;
                    const daysSinceStart = (date - new Date(s.startDate)) / (1000 * 60 * 60 * 24);
                    rewards += (s.value * s.apy / 100 * (daysSinceStart / 365)) || 0;
                    totalApy += (s.apy * (s.value || 0));
                    totalValue += (s.value || 0);
                }
            });

            // Calcular para pools
            pools.forEach(p => {
                if (new Date(p.startDate) <= date) {
                    balance += p.value || 0;
                    const daysSinceStart = (date - new Date(p.startDate)) / (1000 * 60 * 60 * 24);
                    rewards += (p.value * p.apy / 100 * (daysSinceStart / 365)) || 0;
                    totalApy += (p.apy * (p.value || 0));
                    totalValue += (p.value || 0);
                }
            });

            const avgApy = totalValue > 0 ? totalApy / totalValue : 0;

            data.push({
                date: dateStr,
                balance,
                rewards,
                apy: avgApy
            });
        }

        return data;
    };

    // Função para desenhar gráfico
    const drawChart = (canvasId, data, valueKey, color, label) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const w = canvas.width = rect.width;
        const h = canvas.height = canvas.offsetHeight || 250;

        ctx.clearRect(0, 0, w, h);

        if (data.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados disponíveis', w / 2, h / 2);
            return;
        }

        const values = data.map(d => d[valueKey]);
        const max = Math.max(...values, 1);
        const min = Math.min(...values, 0);
        const range = max - min || 1;

        const padding = 40;
        const chartW = w - padding * 2;
        const chartH = h - padding * 2;

        // Desenhar grid
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y);
            ctx.stroke();
        }

        // Desenhar linha
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        data.forEach((d, i) => {
            const x = padding + (chartW / (data.length - 1 || 1)) * i;
            const y = padding + chartH - ((d[valueKey] - min) / range) * chartH;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Desenhar pontos
        ctx.fillStyle = color;
        data.forEach((d, i) => {
            const x = padding + (chartW / (data.length - 1 || 1)) * i;
            const y = padding + chartH - ((d[valueKey] - min) / range) * chartH;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Labels do eixo Y
        ctx.fillStyle = '#aaa';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = min + (range / 5) * (5 - i);
            const y = padding + (chartH / 5) * i;
            let displayValue = value;
            if (valueKey === 'balance' || valueKey === 'rewards') {
                displayValue = '$' + value.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0});
            } else if (valueKey === 'apy') {
                displayValue = value.toFixed(2) + '%';
            }
            ctx.fillText(displayValue, padding - 8, y + 4);
        }

        // Labels do eixo X (apenas alguns pontos)
        ctx.textAlign = 'center';
        const step = Math.max(1, Math.floor(data.length / 5));
        for (let i = 0; i < data.length; i += step) {
            const x = padding + (chartW / (data.length - 1 || 1)) * i;
            const date = new Date(data[i].date);
            const label = `${date.getDate()}/${date.getMonth() + 1}`;
            ctx.fillText(label, x, h - padding + 20);
        }
    };

    // Gráfico de barras - Performance por Carteira
    const drawWalletsChart = () => {
        const canvas = document.getElementById('chart-wallets');
        if (!canvas) return;

        const wallets = getWallets();
        const airdrops = getAirdrops();
        
        // Calcular lucro por wallet (simulado - baseado em airdrops recebidos)
        const walletData = wallets.map(w => {
            // Simular lucro baseado em airdrops (pode ser melhorado)
            const walletAirdrops = airdrops.filter(a => 
                a.identifiers && a.identifiers.some(id => id.toLowerCase().includes(w.address.toLowerCase().slice(0, 6)))
            );
            const lucro = walletAirdrops.reduce((sum, a) => sum + (parseFloat(a.received) || 0), 0);
            return { name: w.name, lucro: lucro || Math.random() * 1000 };
        });

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const w = canvas.width = rect.width;
        const h = canvas.height = 300;

        ctx.clearRect(0, 0, w, h);

        if (walletData.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados disponíveis', w / 2, h / 2);
            return;
        }

        const maxLucro = Math.max(...walletData.map(d => d.lucro), 1);
        const padding = 60;
        const chartW = w - padding * 2;
        const chartH = h - padding * 2;
        const barWidth = chartW / walletData.length - 10;
        const colors = ['#10b981', '#3b82f6', '#ec4899', '#f97316', '#8b5cf6'];

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y);
            ctx.stroke();
        }

        // Barras
        walletData.forEach((data, i) => {
            const barHeight = (data.lucro / maxLucro) * chartH;
            const x = padding + i * (barWidth + 10) + 5;
            const y = padding + chartH - barHeight;
            const color = colors[i % colors.length];

            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Label do valor
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('$' + data.lucro.toFixed(0), x + barWidth / 2, y - 5);

            // Label do nome
            ctx.fillStyle = '#aaa';
            ctx.font = '11px sans-serif';
            ctx.fillText(data.name.length > 10 ? data.name.substring(0, 10) + '...' : data.name, x + barWidth / 2, h - padding + 20);
        });

        // Eixo Y
        ctx.fillStyle = '#aaa';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const value = (maxLucro / 4) * (4 - i);
            const y = padding + (chartH / 4) * i;
            ctx.fillText('$' + value.toFixed(0), padding - 8, y + 4);
        }
    };

    // Gráfico de rosca - Status dos Projetos
    const drawStatusChart = () => {
        const canvas = document.getElementById('chart-status');
        if (!canvas) return;

        const airdrops = getAirdrops();
        const stakesMetrics = calculateStakesMetrics();
        const poolsMetrics = calculatePoolsMetrics();

        const finalizados = airdrops.filter(a => a.status === 'Concluído').length;
        const pendentes = airdrops.filter(a => a.status !== 'Concluído' && a.status !== 'Não começou').length;
        const totalStakes = stakesMetrics.totalValue;
        const totalPools = poolsMetrics.totalRewards;

        // Normalizar valores para o gráfico (usar valores proporcionais)
        const data = [
            { label: 'Finalizado', value: finalizados, color: '#3b82f6' },
            { label: 'Pendente', value: pendentes, color: '#f97316' }
        ];

        const total = data.reduce((sum, d) => sum + d.value, 0);

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        canvas.width = size;
        canvas.height = size;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 20;
        const innerRadius = radius * 0.6;

        ctx.clearRect(0, 0, size, size);

        if (total === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados', centerX, centerY);
            return;
        }

        let currentAngle = -Math.PI / 2;

        data.forEach((item, i) => {
            const sliceAngle = (item.value / total) * Math.PI * 2;

            // Desenhar arco
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();

            currentAngle += sliceAngle;
        });

        // Atualizar legendas
        document.getElementById('legend-finalizado').textContent = finalizados;
        document.getElementById('legend-pendente').textContent = pendentes;
        document.getElementById('legend-stakes').textContent = '$' + totalStakes.toLocaleString('pt-BR', {minimumFractionDigits: 0});
        document.getElementById('legend-pools').textContent = '$' + totalPools.toLocaleString('pt-BR', {minimumFractionDigits: 0});
    };

    // Atualizar gráficos
    const updateCharts = () => {
        drawWalletsChart();
        drawStatusChart();
    };

    // Inicializar
    updateMetrics();
    updateCharts();

    // Atualizar quando houver mudanças
    window.updateDashboard = () => {
        updateMetrics();
        updateCharts();
    };
});

// Helpers de fuso/21:00 BRT disponíveis globalmente
window.getBrazilNow = function() {
    try {
        const brazilStr = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
        return new Date(brazilStr);
    } catch (err) {
        return new Date();
    }
};

window.getDefault21BRT = function() {
    const bNow = window.getBrazilNow();
    const d = new Date(bNow);
    if (bNow.getHours() >= 21) d.setDate(d.getDate() + 1);
    d.setHours(21,0,0,0);
    return d;
};

// Helper para obter/salvar dados do usuário atual
function getUserDataKey(key) {
    const currentUser = window.UserManager ? window.UserManager.getCurrentUser() : null;
    if (!currentUser) return key; // Fallback para compatibilidade
    return `user_data_${currentUser.id}_${key}`;
}

function getUserData(key, defaultValue = []) {
    const dataKey = getUserDataKey(key);
    const data = localStorage.getItem(dataKey);
    return data ? JSON.parse(data) : defaultValue;
}

function saveUserData(key, data) {
    const dataKey = getUserDataKey(key);
    localStorage.setItem(dataKey, JSON.stringify(data));
    
    // Também salvar no formato consolidado para admin
    const currentUser = window.UserManager ? window.UserManager.getCurrentUser() : null;
    if (currentUser) {
        const userDataKey = `user_data_${currentUser.id}`;
        const allUserData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
        allUserData[key] = data;
        localStorage.setItem(userDataKey, JSON.stringify(allUserData));
    }
}

/* ========== AIRDROPS ========== */
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    if (window.requireAuth && !window.requireAuth()) return;
    
    // Inicializar dados de airdrops se não existirem
    const airdrops = getUserData('airdrops');
    if (airdrops.length === 0) {
        const sample = [
            {
                id: 1,
                name: 'test2',
                identifiers: ['tes4@gmail.com', '0x00005'],
                category: 'Stablecoin',
                estimate: '10',
                received: '200.00',
                status: 'Não começou',
                url: 'https://test2.com',
                startDate: '11/12/2025',
                endDate: '25/12/2025',
                notes: 'vai vir'
            },
            {
                id: 2,
                name: 'test',
                identifiers: ['test@gmail.com', 'test2@gmail.com'],
                category: 'Social',
                estimate: '568.04',
                received: '45654.00',
                status: 'Concluído',
                url: 'https://test.com',
                startDate: '09/12/2025',
                endDate: '20/12/2025',
                notes: 'informacoes que sei'
            }
        ];
        saveUserData('airdrops', sample);
    }

    const getAirdrops = () => getUserData('airdrops', []);
    const saveAirdrops = (arr) => saveUserData('airdrops', arr);

    const container = document.getElementById('airdrops-list');
    const searchInput = document.getElementById('airdrops-search');
    const statusFilter = document.getElementById('airdrops-status-filter');
    const categoryFilter = document.getElementById('airdrops-category-filter');

    // Popular dropdowns com dados dinâmicos
    function populateFilters() {
        const airdrops = getAirdrops();
        
        // Obter categorias únicas dos airdrops cadastrados
        const categories = [...new Set(airdrops.map(a => a.category).filter(c => c && c.trim()))];
        categories.sort();
        
        // Obter status únicos dos airdrops cadastrados
        const statuses = [...new Set(airdrops.map(a => a.status).filter(s => s && s.trim()))];
        statuses.sort();
        
        // Popular dropdown de categorias
        if (categoryFilter) {
            const currentValue = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="">Todas Categorias</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categoryFilter.appendChild(option);
            });
            if (currentValue) categoryFilter.value = currentValue;
        }
        
        // Popular dropdown de status
        if (statusFilter) {
            const currentValue = statusFilter.value;
            statusFilter.innerHTML = '<option value="">Todos os Status</option>';
            statuses.forEach(status => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = status;
                statusFilter.appendChild(option);
            });
            if (currentValue) statusFilter.value = currentValue;
        }
    }
    const exportBtn = document.getElementById('export-airdrops');
    const addBtn = document.getElementById('add-airdrop');
    const modal = document.getElementById('airdrop-modal');
    const modalCancel = document.getElementById('airdrop-modal-cancel');
    const modalSave = document.getElementById('airdrop-modal-save');
    const inputName = document.getElementById('airdrop-name');
    const identifiersContainer = document.getElementById('airdrop-identifiers');
    const addIdentifierBtn = document.getElementById('airdrop-add-identifier');
    const inputCategory = document.getElementById('airdrop-category');
    const inputStatus = document.getElementById('airdrop-status');
    const inputEstimate = document.getElementById('airdrop-estimate');
    const inputReceived = document.getElementById('airdrop-received');
    const inputUrl = document.getElementById('airdrop-url');
    const inputStartDate = document.getElementById('airdrop-start-date');
    const inputEndDate = document.getElementById('airdrop-end-date');
    const inputNotes = document.getElementById('airdrop-notes');

    let editingId = null;
    let currentIdentifiers = [];

    function renderIdentifiers() {
        identifiersContainer.innerHTML = '';
        currentIdentifiers.forEach((id, idx) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.gap = '8px';
            div.style.marginBottom = '8px';
            div.innerHTML = `
                <input type="text" value="${id}" class="identifier-input" data-idx="${idx}" style="flex:1;padding:8px;border-radius:6px;background:#0f1419;border:1px solid rgba(255,255,255,0.1);color:#fff;">
                <button class="identifier-remove" data-idx="${idx}" style="padding:6px 10px;border-radius:6px;background:#ef4444;color:#fff;border:none;cursor:pointer;">×</button>
            `;
            identifiersContainer.appendChild(div);
        });

        identifiersContainer.querySelectorAll('.identifier-input').forEach(inp => {
            inp.addEventListener('change', (e) => {
                const idx = Number(e.target.getAttribute('data-idx'));
                currentIdentifiers[idx] = e.target.value;
            });
        });

        identifiersContainer.querySelectorAll('.identifier-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = Number(e.target.getAttribute('data-idx'));
                currentIdentifiers.splice(idx, 1);
                renderIdentifiers();
            });
        });
    }

    function clearModal() {
        inputName.value = '';
        currentIdentifiers = [];
        inputCategory.value = '';
        inputStatus.value = 'Não começou';
        inputEstimate.value = '';
        inputReceived.value = '';
        inputUrl.value = '';
        inputStartDate.value = '';
        inputEndDate.value = '';
        inputNotes.value = '';
        editingId = null;
        renderIdentifiers();
    }

    function openModalForAdd() {
        clearModal();
        modal.style.display = 'flex';
    }

    function openModalForEdit(id) {
        const list = getAirdrops();
        const item = list.find(x => x.id === id);
        if (!item) return alert('Airdrop não encontrado');

        editingId = id;
        inputName.value = item.name || '';
        currentIdentifiers = [...(item.identifiers || [])];
        inputCategory.value = item.category || '';
        inputStatus.value = item.status || 'Não começou';
        inputEstimate.value = item.estimate || '';
        inputReceived.value = item.received || '';
        inputUrl.value = item.url || '';
        inputStartDate.value = item.startDate || '';
        inputEndDate.value = item.endDate || '';
        inputNotes.value = item.notes || '';
        renderIdentifiers();
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        clearModal();
    }

    function saveAirdrop() {
        const name = inputName.value.trim();
        if (!name) return alert('Nome do projeto é obrigatório');

        const list = getAirdrops();
        const obj = {
            name,
            identifiers: currentIdentifiers,
            category: inputCategory.value,
            status: inputStatus.value,
            estimate: inputEstimate.value,
            received: inputReceived.value,
            url: inputUrl.value,
            startDate: inputStartDate.value,
            endDate: inputEndDate.value,
            notes: inputNotes.value
        };

        if (editingId !== null) {
            const item = list.find(x => x.id === editingId);
            if (item) Object.assign(item, obj);
        } else {
            const id = (list[list.length - 1]?.id || 0) + 1;
            list.push({ id, ...obj });
        }

        saveAirdrops(list);
        closeModal();
        populateFilters(); // Atualizar dropdowns com novas categorias/status
        applyFilters();
    }

    function renderAirdrops(filtered) {
        if (!container) return;
        container.innerHTML = '';
        filtered.forEach(a => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.minHeight = '160px';

            const statusColor = {
                'Não começou': '#6b7280',
                'Em andamento': '#f59e0b',
                'Concluído': '#10b981'
            }[a.status] || '#6b7280';

            const categoryBadge = `<span style="background:rgba(139,92,246,0.3);padding:4px 8px;border-radius:4px;font-size:12px;color:#a78bfa;">${a.category || '-'}</span>`;
            const statusBadge = `<span style="background:${statusColor};padding:4px 8px;border-radius:4px;font-size:12px;color:#fff;">${a.status}</span>`;

            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                    <h3 style="margin:0;color:#fff;">${a.name}</h3>
                    <div style="display:flex;gap:4px;">${categoryBadge} ${statusBadge}</div>
                </div>
                <div style="font-size:12px;color:var(--muted);margin-bottom:10px;">${a.identifiers?.join(' • ') || '-'}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                    <div style="background:rgba(255,255,255,0.03);padding:8px;border-radius:6px;">
                        <div style="font-size:11px;color:var(--muted);">Estimativa</div>
                        <div style="font-size:14px;color:#fff;">$${a.estimate || '0'}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03);padding:8px;border-radius:6px;">
                        <div style="font-size:11px;color:var(--muted);">Recebido</div>
                        <div style="font-size:14px;color:#10b981;">$${a.received || '0'}</div>
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="edit-airdrop" data-id="${a.id}" style="padding:6px 8px;border-radius:6px;background:#f59e0b;color:#fff;border:none;cursor:pointer;flex:1;">Editar</button>
                    <button class="menu-airdrop" data-id="${a.id}" style="padding:6px 12px;border-radius:6px;background:#6366f1;color:#fff;border:none;cursor:pointer;font-size:18px;font-weight:bold;line-height:1;">⋯</button>
                    <button class="delete-airdrop" data-id="${a.id}" style="padding:6px 8px;border-radius:6px;background:#ef4444;color:#fff;border:none;cursor:pointer;flex:1;">Apagar</button>
                </div>
            `;

            container.appendChild(card);
        });

        container.querySelectorAll('.edit-airdrop').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.target.getAttribute('data-id'));
                openModalForEdit(id);
            });
        });

        container.querySelectorAll('.delete-airdrop').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.target.getAttribute('data-id'));
                if (!confirm('Apagar este airdrop?')) return;
                const list = getAirdrops().filter(x => x.id !== id);
                saveAirdrops(list);
                populateFilters(); // Atualizar dropdowns
                applyFilters();
            });
        });
    }

    function applyFilters() {
        const searchVal = (searchInput?.value || '').trim().toLowerCase();
        const statusVal = statusFilter?.value || '';
        const categoryVal = categoryFilter?.value || '';

        let list = getAirdrops().filter(a => {
            if (statusVal && a.status !== statusVal) return false;
            if (categoryVal && a.category !== categoryVal) return false;
            if (!searchVal) return true;
            const q = searchVal;
            return (a.name && a.name.toLowerCase().includes(q)) ||
                   (a.identifiers?.some(id => id.toLowerCase().includes(q)));
        });

        renderAirdrops(list);
    }

    // Eventos
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    
    // Popular filtros dinamicamente ao carregar
    populateFilters();

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const list = getAirdrops();
            if (!list.length) return alert('Nenhum airdrop para exportar');
            const keys = ['id', 'name', 'identifiers', 'category', 'status', 'estimate', 'received', 'url', 'startDate', 'endDate', 'notes'];
            const csv = [keys.join(',')].concat(list.map(r => keys.map(k => {
                const v = r[k];
                if (Array.isArray(v)) return '"' + v.join('; ') + '"';
                return '"' + (v || '') + '"';
            }).join(','))).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'airdrops.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        });
    }

    if (addBtn) addBtn.addEventListener('click', openModalForAdd);
    if (modalCancel) modalCancel.addEventListener('click', closeModal);
    if (modalSave) modalSave.addEventListener('click', saveAirdrop);
    if (addIdentifierBtn) addIdentifierBtn.addEventListener('click', () => {
        currentIdentifiers.push('');
        renderIdentifiers();
    });

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    applyFilters();
});

/* ========== WALLETS ========== */
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar dados de wallets se não existirem
    // Verificar autenticação
    if (window.requireAuth && !window.requireAuth()) return;
    
    const wallets = getUserData('wallets', []);
    if (wallets.length === 0) {
        const sampleWallets = [
            { id: 1, name: 'Wallet Principal', address: '0xAAA111', network: 'Ethereum', active: true, notes: '' },
            { id: 2, name: 'Carteira 2', address: '0xBBB222', network: 'Polygon', active: true, notes: 'Para airdrops' }
        ];
        saveUserData('wallets', sampleWallets);
    }

    const getWallets = () => getUserData('wallets', []);
    const saveWallets = (arr) => saveUserData('wallets', arr);

    const container = document.getElementById('wallets-list');
    const searchInput = document.getElementById('wallets-search');
    const exportBtn = document.getElementById('export-wallets');
    const addBtn = document.getElementById('add-wallet');
    const modal = document.getElementById('wallet-modal');
    const modalCancel = document.getElementById('wallet-modal-cancel');
    const modalSave = document.getElementById('wallet-modal-save');
    const inputName = document.getElementById('wallet-name');
    const inputAddress = document.getElementById('wallet-address');
    const inputNetwork = document.getElementById('wallet-network');
    const inputActive = document.getElementById('wallet-active');
    const inputNotes = document.getElementById('wallet-notes');

    let editingId = null;

    function clearModal() {
        inputName.value = '';
        inputAddress.value = '';
        inputNetwork.value = '';
        inputActive.checked = true;
        inputNotes.value = '';
        editingId = null;
    }

    function openModalForAdd() {
        clearModal();
        modal.style.display = 'flex';
    }

    function openModalForEdit(id) {
        const list = getWallets();
        const item = list.find(x => x.id === id);
        if (!item) return alert('Wallet não encontrada');

        editingId = id;
        inputName.value = item.name || '';
        inputAddress.value = item.address || '';
        inputNetwork.value = item.network || '';
        inputActive.checked = item.active !== false;
        inputNotes.value = item.notes || '';
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        clearModal();
    }

    function saveWallet() {
        const name = inputName.value.trim();
        const address = inputAddress.value.trim();
        const network = inputNetwork.value.trim();
        const active = inputActive.checked;
        const notes = inputNotes.value.trim();

        if (!name) return alert('Nome é obrigatório');
        if (!address) return alert('Endereço é obrigatório');
        if (!network) return alert('Rede é obrigatória');

        const list = getWallets();

        if (editingId !== null) {
            // Editar existente
            const item = list.find(x => x.id === editingId);
            if (item) {
                item.name = name;
                item.address = address;
                item.network = network;
                item.active = active;
                item.notes = notes;
            }
        } else {
            // Adicionar novo
            const id = (list[list.length - 1]?.id || 0) + 1;
            list.push({ id, name, address, network, active, notes });
        }

        saveWallets(list);
        closeModal();
        renderWallets(searchInput?.value || '');
    }

    function renderWallets(filter = '') {
        if (!container) return;
        const q = (filter || '').trim().toLowerCase();
        const list = getWallets().filter(w => {
            if (!q) return true;
            return (w.name && w.name.toLowerCase().includes(q)) || 
                   (w.address && w.address.toLowerCase().includes(q)) ||
                   (w.network && w.network.toLowerCase().includes(q));
        });

        container.innerHTML = '';
        list.forEach(w => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.minHeight = '140px';

            const statusBadge = w.active ? '<span style="background:#10b981;padding:4px 8px;border-radius:4px;font-size:12px;color:#fff;">Ativa</span>' : '<span style="background:#6b7280;padding:4px 8px;border-radius:4px;font-size:12px;color:#fff;">Inativa</span>';

            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:start">
                    <div style="flex:1">
                        <h3 style="margin:0 0 8px 0">${w.name}</h3>
                        <div style="font-size:13px;color:var(--muted);margin-bottom:8px">${w.address}</div>
                        <div style="font-size:12px;background:rgba(255,255,255,0.05);padding:6px;border-radius:4px;display:inline-block;color:var(--muted)">${w.network}</div>
                    </div>
                    <div>${statusBadge}</div>
                </div>
                <div style="margin-top:10px;color:var(--muted);font-size:12px">${w.notes ? w.notes : ''}</div>
                <div style="margin-top:10px;display:flex;gap:8px">
                    <button class="edit-wallet" data-id="${w.id}" style="padding:6px 8px;border-radius:6px;background:#f59e0b;color:#fff;border:none;cursor:pointer;flex:1">Editar</button>
                    <button class="delete-wallet" data-id="${w.id}" style="padding:6px 8px;border-radius:6px;background:#ef4444;color:#fff;border:none;cursor:pointer;flex:1">Apagar</button>
                </div>
            `;

            container.appendChild(card);
        });

        // Eventos de editar/apagar
        container.querySelectorAll('.edit-wallet').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                openModalForEdit(id);
            });
        });

        container.querySelectorAll('.delete-wallet').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                if (!confirm('Apagar esta wallet?')) return;
                const list = getWallets().filter(x => x.id !== id);
                saveWallets(list);
                renderWallets(searchInput?.value || '');
            });
        });
    }

    function exportWalletsCSV(list) {
        if (!list.length) return alert('Nenhuma wallet para exportar');
        const keys = Object.keys(list[0]);
        const csv = [keys.join(',')].concat(list.map(r => keys.map(k => '"' + (r[k] || '') + '"').join(','))).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wallets.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // Eventos
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderWallets(e.target.value));
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportWalletsCSV(getWallets()));
    }

    if (addBtn) {
        addBtn.addEventListener('click', openModalForAdd);
    }

    if (modalCancel) {
        modalCancel.addEventListener('click', closeModal);
    }

    if (modalSave) {
        modalSave.addEventListener('click', saveWallet);
    }

    // Fechar modal ao clicar fora
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // render inicial
    renderWallets();
});


// ---------- Tarefas: vinculadas aos Airdrops (offline) ----------
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar dados de tarefas se não existirem
    if (!localStorage.getItem('airdrop-tasks')) {
        localStorage.setItem('airdrop-tasks', JSON.stringify({}));
    }

    const getTasks = (airdropId) => JSON.parse(localStorage.getItem(`tasks-${airdropId}`) || '[]');
    const saveTasks = (airdropId, arr) => localStorage.setItem(`tasks-${airdropId}`, JSON.stringify(arr));

    const tasksModal = document.getElementById('airdrop-tasks-modal');
    const taskFormModal = document.getElementById('task-form-modal');
    const tasksModalClose = document.getElementById('tasks-modal-close');
    const taskModalDone = document.getElementById('tasks-modal-done');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskFormCancel = document.getElementById('task-form-cancel');
    const taskFormSave = document.getElementById('task-form-save');
    const tasksList = document.getElementById('tasks-list');
    const inputTaskName = document.getElementById('task-name');
    const inputTaskFrequency = document.getElementById('task-frequency');
    const inputTaskDescription = document.getElementById('task-description');
    const inputTaskLink = document.getElementById('task-link');
    const inputTaskDate = document.getElementById('task-date');
    const inputTaskTime = document.getElementById('task-time');
    const inputTaskUntilDate = document.getElementById('task-until-date');
    const inputTaskInterval = document.getElementById('task-interval');
    const taskFormDownloadIcs = document.getElementById('task-form-download-ics');
    const inputTaskWeekdayElems = () => Array.from(document.querySelectorAll('.task-weekday'));
    const rrulePreviewDiv = document.getElementById('rrule-preview');
    const taskModalAirdropName = document.getElementById('task-modal-airdrop-name');
    const taskModalAirdropDesc = document.getElementById('task-modal-airdrop-desc');

    let currentAirdropId = null;
    let editingTaskId = null;

    function clearTaskForm() {
        inputTaskName.value = '';
        inputTaskFrequency.value = 'Diária';
        inputTaskDescription.value = '';
        inputTaskLink.value = '';
        // default date/time: next reset at 21:00 BRT
        if (inputTaskDate) inputTaskDate.value = '';
        if (inputTaskTime) inputTaskTime.value = '';
        if (inputTaskUntilDate) inputTaskUntilDate.value = '';
        if (inputTaskInterval) inputTaskInterval.value = '1';
        // clear weekday checkboxes
        inputTaskWeekdayElems().forEach(ch => ch.checked = false);
        editingTaskId = null;
    }

    // retorna Date correspondente ao horário atual em America/Sao_Paulo
    function getBrazilNow() {
        try {
            const brazilStr = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
            return new Date(brazilStr);
        } catch (err) {
            return new Date();
        }
    }

    // retorna default: se hora atual em BR >=21, usa próxima data às 21:00, senão usa hoje às 21:00
    function getDefault21BRT() {
        const bNow = getBrazilNow();
        const d = new Date(bNow);
        if (bNow.getHours() >= 21) d.setDate(d.getDate() + 1);
        d.setHours(21, 0, 0, 0);
        return d;
    }

    function updateRRulePreview() {
        if (!rrulePreviewDiv) return;
        const freq = (inputTaskFrequency && inputTaskFrequency.value) ? inputTaskFrequency.value : '';
        if (freq === 'Única') {
            rrulePreviewDiv.style.display = 'none';
            rrulePreviewDiv.innerHTML = '';
            return;
        }
        const interval = inputTaskInterval ? Number(inputTaskInterval.value) : 1;
        const until = inputTaskUntilDate ? inputTaskUntilDate.value : '';
        const byday = inputTaskWeekdayElems().filter(ch => ch.checked).map(ch => ch.value);
        const preview = window.buildRRulePreview({freq, interval, until, byday});
        if (preview) {
            rrulePreviewDiv.innerHTML = `<strong>Recorrência:</strong> ${preview}`;
            rrulePreviewDiv.style.display = 'block';
        } else {
            rrulePreviewDiv.style.display = 'none';
        }
    }

    function closeTaskForm() {
        taskFormModal.style.display = 'none';
        clearTaskForm();
    }

    function openTaskForm(airdropId, taskId = null) {
        currentAirdropId = airdropId;
        clearTaskForm();

        if (taskId !== null) {
            editingTaskId = taskId;
            const tasks = getTasks(airdropId);
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                inputTaskName.value = task.name || '';
                inputTaskFrequency.value = task.frequency || 'Diária';
                inputTaskDescription.value = task.description || '';
                inputTaskLink.value = task.link || '';
                if (inputTaskDate && task.scheduledAt) {
                    try {
                        const d = new Date(task.scheduledAt);
                        inputTaskDate.value = d.toISOString().slice(0,10);
                        inputTaskTime.value = d.toISOString().slice(11,16);
                    } catch(e){}
                }
                // load recurrence options if present
                if (task.recurrenceOptions) {
                    try {
                        if (inputTaskUntilDate && task.recurrenceOptions.until) inputTaskUntilDate.value = task.recurrenceOptions.until;
                        if (inputTaskInterval && task.recurrenceOptions.interval) inputTaskInterval.value = task.recurrenceOptions.interval;
                        if (task.recurrenceOptions.byday && Array.isArray(task.recurrenceOptions.byday)) {
                            inputTaskWeekdayElems().forEach(ch => ch.checked = task.recurrenceOptions.byday.includes(ch.value));
                        }
                    } catch(e){}
                }
            }
        }

        // preenche valores padrão se vazios
        if (inputTaskDate && inputTaskTime && !inputTaskDate.value && !inputTaskTime.value) {
            const def = getDefault21BRT();
            inputTaskDate.value = def.toISOString().slice(0,10);
            inputTaskTime.value = def.toISOString().slice(11,16);
        }

        taskFormModal.style.display = 'flex';
    }

    function saveTask() {
        const name = inputTaskName.value.trim();
        if (!name) return alert('Nome da tarefa é obrigatório');

        const tasks = getTasks(currentAirdropId);
        const obj = {
            name,
            frequency: inputTaskFrequency.value,
            description: inputTaskDescription.value,
            link: inputTaskLink.value,
            createdAt: new Date().toLocaleDateString('pt-BR')
        };

        // se usuário especificou data/hora, salvar como scheduledAt em ISO
        if (inputTaskDate && inputTaskDate.value) {
            const datePart = inputTaskDate.value; // YYYY-MM-DD
            const timePart = (inputTaskTime && inputTaskTime.value) ? inputTaskTime.value : '21:00';
            // criar string com offset -03:00 (BRT)
            const isoStr = `${datePart}T${timePart}:00-03:00`;
            try {
                const dt = new Date(isoStr);
                obj.scheduledAt = dt.toISOString();
            } catch (err) {
                // ignore
            }
        }

        // salvar opções de recorrência
        try {
            const interval = inputTaskInterval ? Number(inputTaskInterval.value) : 1;
            const until = inputTaskUntilDate && inputTaskUntilDate.value ? inputTaskUntilDate.value : null;
            const byday = (inputTaskWeekdayElems() || []).filter(ch => ch.checked).map(ch => ch.value);
            obj.recurrenceOptions = { interval, until, byday };
        } catch (err) { obj.recurrenceOptions = null; }

        if (editingTaskId !== null) {
            const task = tasks.find(t => t.id === editingTaskId);
            if (task) Object.assign(task, obj);
        } else {
            const id = (tasks[tasks.length - 1]?.id || 0) + 1;
            tasks.push({ id, ...obj });
        }

        saveTasks(currentAirdropId, tasks);
        closeTaskForm();
        renderTasks();
    }

    function renderTasks() {
        if (!tasksList) return;
        const tasks = getTasks(currentAirdropId);
        
        tasksList.innerHTML = '';
        if (!tasks.length) {
            tasksList.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Nenhuma tarefa adicionada</p>';
            return;
        }

        tasks.forEach(task => {
            const div = document.createElement('div');
            div.style.background = '#0f1419';
            div.style.borderRadius = '8px';
            div.style.padding = '12px';
            div.style.marginBottom = '10px';
            div.style.borderLeft = '4px solid #6366f1';

            const frequencyBadges = {
                'Única': '<span style="background:#ec4899;padding:2px 6px;border-radius:3px;font-size:11px;color:#fff;">única</span>',
                'Diária': '<span style="background:#06b6d4;padding:2px 6px;border-radius:3px;font-size:11px;color:#fff;">diária</span>',
                'Semanal': '<span style="background:#f59e0b;padding:2px 6px;border-radius:3px;font-size:11px;color:#fff;">semanal</span>',
                'Mensal': '<span style="background:#8b5cf6;padding:2px 6px;border-radius:3px;font-size:11px;color:#fff;">mensal</span>'
            };

            div.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                    <div>
                        <h5 style="margin:0;color:#fff;">${task.name}</h5>
                        <p style="margin:4px 0 0 0;color:var(--muted);font-size:12px;">${task.description || ''}</p>
                    </div>
                    ${frequencyBadges[task.frequency] || ''}
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
                    <div style="font-size:11px;color:var(--muted);">Criada em ${task.createdAt}</div>
                    <div style="display:flex;gap:6px;">
                        ${task.link ? `<a href="${task.link}" target="_blank" style="padding:4px 8px;border-radius:4px;background:rgba(59,130,246,0.2);border:1px solid #3b82f6;color:#3b82f6;text-decoration:none;font-size:11px;cursor:pointer;">Abrir Link</a>` : ''}
                        <button class="download-ics-item" data-airdrop-id="${currentAirdropId}" data-task-id="${task.id}" style="padding:4px 8px;border-radius:4px;background:rgba(139,92,246,0.08);border:1px solid #8b5cf6;color:#8b5cf6;cursor:pointer;font-size:11px;">.ics</button>
                        <button class="add-to-calendar" data-airdrop-id="${currentAirdropId}" data-task-id="${task.id}" style="padding:4px 8px;border-radius:4px;background:rgba(59,130,246,0.08);border:1px solid #3b82f6;color:#3b82f6;cursor:pointer;font-size:11px;">Adicionar ao Calendar</button>
                        <button class="edit-task" data-id="${task.id}" style="padding:4px 8px;border-radius:4px;background:rgba(245,158,11,0.2);border:1px solid #f59e0b;color:#f59e0b;cursor:pointer;font-size:11px;">Editar</button>
                        <button class="delete-task" data-id="${task.id}" style="padding:4px 8px;border-radius:4px;background:rgba(239,68,68,0.2);border:1px solid #ef4444;color:#ef4444;cursor:pointer;font-size:11px;">Apagar</button>
                    </div>
                </div>
            `;

            tasksList.appendChild(div);
        });

        tasksList.querySelectorAll('.edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = Number(e.target.getAttribute('data-id'));
                openTaskForm(currentAirdropId, taskId);
            });
        });

        tasksList.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = Number(e.target.getAttribute('data-id'));
                if (!confirm('Apagar esta tarefa?')) return;
                const tasks = getTasks(currentAirdropId).filter(t => t.id !== taskId);
                saveTasks(currentAirdropId, tasks);
                renderTasks();
            });
        });

        // adicionar ao Google Calendar
        tasksList.querySelectorAll('.add-to-calendar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const airdropId = Number(e.target.getAttribute('data-airdrop-id'));
                const taskId = Number(e.target.getAttribute('data-task-id'));
                const task = getTasks(airdropId).find(t => t.id === taskId);
                if (!task) return alert('Tarefa não encontrada');
                const title = task.name || 'Tarefa';
                const airdrops = JSON.parse(localStorage.getItem('airdrops') || '[]');
                const airdropObj = airdrops.find(a => a.id === airdropId) || {};
                const details = (task.description ? task.description + '\n' : '') + (task.link ? 'Link: ' + task.link + '\n' : '') + 'Airdrop: ' + (airdropObj.name || '');
                let start;
                if (task.scheduledAt) start = new Date(task.scheduledAt);
                else start = getDefault21BRT();
                const end = new Date(start.getTime() + 30*60000);
                // definir regra de recorrência simples com base em task.frequency
                let recur = null;
                try {
                    const freq = task.frequency || 'Única';
                    if (freq === 'Diária') recur = 'RRULE:FREQ=DAILY';
                    else if (freq === 'Semanal') recur = 'RRULE:FREQ=WEEKLY';
                    else if (freq === 'Mensal') recur = 'RRULE:FREQ=MONTHLY';
                } catch(err) { recur = null; }
                window.openGoogleEventEditor({title, details, startDate: start, endDate: end, recurrence: recur});
            });
        });

        // download .ics
        tasksList.querySelectorAll('.download-ics-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const airdropId = Number(e.target.getAttribute('data-airdrop-id'));
                const taskId = Number(e.target.getAttribute('data-task-id'));
                const task = getTasks(airdropId).find(t => t.id === taskId);
                if (!task) return alert('Tarefa não encontrada');
                const title = task.name || 'Tarefa';
                const airdrops = JSON.parse(localStorage.getItem('airdrops') || '[]');
                const airdropObj = airdrops.find(a => a.id === airdropId) || {};
                const details = (task.description ? task.description + '\n' : '') + (task.link ? 'Link: ' + task.link + '\n' : '') + 'Airdrop: ' + (airdropObj.name || '');
                const start = task.scheduledAt ? new Date(task.scheduledAt) : getDefault21BRT();
                const end = new Date(start.getTime() + 30*60000);
                const rrule = buildRRuleFromOptions({freq: task.frequency, interval: task.recurrenceOptions?.interval, until: task.recurrenceOptions?.until, byday: task.recurrenceOptions?.byday, startDate: start});
                const fname = `${(task.name||'tarefa').replace(/[^a-z0-9]/gi,'_').toLowerCase()}.ics`;
                
                const confirmMsg = `Confirmar download de .ics para "${title}"?\n\nRecorrência: ${window.buildRRulePreview({freq: task.frequency, interval: task.recurrenceOptions?.interval, until: task.recurrenceOptions?.until, byday: task.recurrenceOptions?.byday}) || 'Sem recorrência'}`;
                if (!confirm(confirmMsg)) return;
                
                const icsContent = generateIcs({title, details, location: airdropObj.url || '', startDate: start, endDate: end, rrule});
                downloadIcs(icsContent, fname);
            });
        });
    }

    function openTasksModal(airdropId) {
        currentAirdropId = airdropId;
        const airdrops = JSON.parse(localStorage.getItem('airdrops') || '[]');
        const airdrop = airdrops.find(a => a.id === airdropId);
        
        if (airdrop) {
            taskModalAirdropName.textContent = `Tarefas - ${airdrop.name}`;
            taskModalAirdropDesc.textContent = `Gerencie as tarefas deste airdrop (${getTasks(airdropId).length} tarefas)`;
        }

        renderTasks();
        tasksModal.style.display = 'flex';
    }

    // Eventos
    if (tasksModalClose) tasksModalClose.addEventListener('click', () => tasksModal.style.display = 'none');
    if (taskModalDone) taskModalDone.addEventListener('click', () => tasksModal.style.display = 'none');
    if (addTaskBtn) addTaskBtn.addEventListener('click', () => openTaskForm(currentAirdropId));
    if (taskFormCancel) taskFormCancel.addEventListener('click', closeTaskForm);
    if (taskFormSave) taskFormSave.addEventListener('click', saveTask);
    const taskFormAddCalendar = document.getElementById('task-form-add-calendar');
    
    // attach RRULE preview update listeners
    if (inputTaskFrequency) inputTaskFrequency.addEventListener('change', updateRRulePreview);
    if (inputTaskInterval) inputTaskInterval.addEventListener('input', updateRRulePreview);
    if (inputTaskUntilDate) inputTaskUntilDate.addEventListener('change', updateRRulePreview);
    inputTaskWeekdayElems().forEach(ch => ch.addEventListener('change', updateRRulePreview));
    if (taskFormAddCalendar) {
        taskFormAddCalendar.addEventListener('click', (e) => {
            // build event from form fields
            const title = (inputTaskName && inputTaskName.value) ? inputTaskName.value : 'Tarefa';
            const descParts = [];
            if (inputTaskDescription && inputTaskDescription.value) descParts.push(inputTaskDescription.value);
            if (inputTaskLink && inputTaskLink.value) descParts.push('\nLink: ' + inputTaskLink.value);
            const details = descParts.join('\n');
            let start;
            if (inputTaskDate && inputTaskDate.value) {
                const datePart = inputTaskDate.value;
                const timePart = (inputTaskTime && inputTaskTime.value) ? inputTaskTime.value : '21:00';
                const iso = `${datePart}T${timePart}:00-03:00`;
                start = new Date(iso);
            } else {
                start = getDefault21BRT();
            }
            const end = new Date(start.getTime() + 30*60000);
            // definir regra de recorrência simples com base na frequência
            let recur = null;
            try {
                const freq = (inputTaskFrequency && inputTaskFrequency.value) ? inputTaskFrequency.value : 'Única';
                if (freq === 'Diária') recur = 'RRULE:FREQ=DAILY';
                else if (freq === 'Semanal') recur = 'RRULE:FREQ=WEEKLY';
                else if (freq === 'Mensal') recur = 'RRULE:FREQ=MONTHLY';
            } catch (err) { recur = null; }
            window.openGoogleEventEditor({title, details, startDate: start, endDate: end, recurrence: recur});
        });
    }

    if (taskFormDownloadIcs) {
        taskFormDownloadIcs.addEventListener('click', (e) => {
            const title = (inputTaskName && inputTaskName.value) ? inputTaskName.value : 'Tarefa';
            const descParts = [];
            if (inputTaskDescription && inputTaskDescription.value) descParts.push(inputTaskDescription.value);
            if (inputTaskLink && inputTaskLink.value) descParts.push('\nLink: ' + inputTaskLink.value);
            const details = descParts.join('\n');
            let start;
            if (inputTaskDate && inputTaskDate.value) {
                const datePart = inputTaskDate.value;
                const timePart = (inputTaskTime && inputTaskTime.value) ? inputTaskTime.value : '21:00';
                const iso = `${datePart}T${timePart}:00-03:00`;
                start = new Date(iso);
            } else {
                start = getDefault21BRT();
            }
            const end = new Date(start.getTime() + 30*60000);
            const rrule = window.buildRRuleFromOptions({freq: inputTaskFrequency?.value, interval: inputTaskInterval?.value, until: inputTaskUntilDate?.value, byday: inputTaskWeekdayElems().filter(ch => ch.checked).map(ch => ch.value), startDate: start});
            const fname = `${(title||'tarefa').replace(/[^a-z0-9]/gi,'_').toLowerCase()}.ics`;
            const icsContent = window.generateIcs({title, details, location: '', startDate: start, endDate: end, rrule});
            
            // confirmation before download
            const freq = inputTaskFrequency?.value || 'Única';
            const confirmMsg = `Confirmar download de .ics para "${title}"?\n\nRecorrência: ${window.buildRRulePreview({freq, interval: inputTaskInterval?.value, until: inputTaskUntilDate?.value, byday: inputTaskWeekdayElems().filter(ch => ch.checked).map(ch => ch.value)}) || 'Sem recorrência'}`;
            if (confirm(confirmMsg)) {
                window.downloadIcs(icsContent, fname);
            }
        });
    }

    if (taskFormModal) {
        taskFormModal.addEventListener('click', (e) => {
            if (e.target === taskFormModal) closeTaskForm();
        });
    }

    // Hook: abrir tasks ao clicar no botão de menu (⋯)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('menu-airdrop')) {
            const airdropId = Number(e.target.getAttribute('data-id'));
            openTasksModal(airdropId);
        }
    });
});

/* ========== TAREFAS STANDALONE PAGE ========== */
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('tasks-search');
    const airdropFilter = document.getElementById('tasks-airdrop-filter');
    const frequencyFilter = document.getElementById('tasks-frequency-filter');
    const tasksList = document.getElementById('tasks-list');
    const totalTasksSpan = document.getElementById('total-tasks');

    if (!tasksList) return; // Só roda na página tarefas.html

    const getTasks = (airdropId) => JSON.parse(localStorage.getItem(`tasks-${airdropId}`) || '[]');
    const getAirdrops = () => JSON.parse(localStorage.getItem('airdrops') || '[]');
    const saveTasks = (airdropId, arr) => localStorage.setItem(`tasks-${airdropId}`, JSON.stringify(arr));

    function getAllTasks() {
        const airdrops = getAirdrops();
        const allTasks = [];
        airdrops.forEach(a => {
            const tasks = getTasks(a.id);
            tasks.forEach(t => {
                allTasks.push({ ...t, airdropId: a.id, airdropName: a.name });
            });
        });
        return allTasks;
    }

    function populateAirdropFilter() {
        const airdrops = getAirdrops();
        const currentValue = airdropFilter.value;
        airdropFilter.innerHTML = '<option value="">Todos os Airdrops</option>';
        airdrops.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = a.name;
            airdropFilter.appendChild(opt);
        });
        airdropFilter.value = currentValue;
    }

    function applyFilters() {
        const searchVal = (searchInput?.value || '').trim().toLowerCase();
        const airdropVal = airdropFilter?.value || '';
        const frequencyVal = frequencyFilter?.value || '';

        let tasks = getAllTasks();

        tasks = tasks.filter(t => {
            if (airdropVal && t.airdropId !== Number(airdropVal)) return false;
            if (frequencyVal && t.frequency !== frequencyVal) return false;
            if (!searchVal) return true;
            const q = searchVal;
            return (t.name && t.name.toLowerCase().includes(q)) ||
                   (t.airdropName && t.airdropName.toLowerCase().includes(q));
        });

        renderTasks(tasks);
    }

    function renderTasks(tasks) {
        if (!tasksList) return;
        tasksList.innerHTML = '';

        if (!tasks.length) {
            tasksList.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--muted); padding:40px;">Nenhuma tarefa encontrada</p>';
            if (totalTasksSpan) totalTasksSpan.textContent = '(0)';
            return;
        }

        if (totalTasksSpan) totalTasksSpan.textContent = `(${tasks.length})`;

        tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.minHeight = '200px';

            const frequencyColors = {
                'Única': '#ec4899',
                'Diária': '#06b6d4',
                'Semanal': '#f59e0b',
                'Mensal': '#8b5cf6'
            };
            const freqColor = frequencyColors[task.frequency] || '#6b7280';
            const freqBadge = `<span style="background:${freqColor};padding:4px 8px;border-radius:4px;font-size:11px;color:#fff;">${task.frequency}</span>`;

            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
                    <div>
                        <h3 style="margin:0;color:#fff;font-size:16px;">${task.name}</h3>
                        <p style="margin:6px 0 0 0;color:var(--muted);font-size:13px;"><strong>Airdrop:</strong> ${task.airdropName}</p>
                    </div>
                    ${freqBadge}
                </div>

                ${task.description ? `<p style="color:var(--muted);font-size:13px;margin:10px 0;">${task.description}</p>` : ''}

                <div style="background:rgba(255,255,255,0.03);padding:10px;border-radius:6px;margin:10px 0;font-size:12px;color:var(--muted);">
                    <strong style="color:#fff;">Criada em:</strong> ${task.createdAt}
                </div>

                ${task.scheduledAt ? `<div style="background:rgba(255,255,255,0.02);padding:8px;border-radius:6px;margin:6px 0;font-size:13px;color:var(--muted);"><strong style="color:#fff;">Agendado:</strong> ${new Date(task.scheduledAt).toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'})}</div>` : ''}

                <div style="display:flex;gap:8px;margin-top:12px;">
                    ${task.link ? `<a href="${task.link}" target="_blank" style="flex:1;padding:8px;border-radius:6px;background:rgba(59,130,246,0.2);border:1px solid #3b82f6;color:#3b82f6;text-decoration:none;font-size:12px;text-align:center;">Abrir Link</a>` : ''}
                    <button class="download-ics-standalone" data-airdrop-id="${task.airdropId}" data-task-id="${task.id}" style="flex:1;padding:8px;border-radius:6px;background:rgba(139,92,246,0.12);border:1px solid #8b5cf6;color:#8b5cf6;cursor:pointer;font-size:12px;">.ics</button>
                    <button class="add-to-calendar" data-airdrop-id="${task.airdropId}" data-task-id="${task.id}" style="flex:1;padding:8px;border-radius:6px;background:rgba(59,130,246,0.12);border:1px solid #3b82f6;color:#3b82f6;cursor:pointer;font-size:12px;">Adicionar ao Calendar</button>
                    <button class="delete-task-standalone" data-airdrop-id="${task.airdropId}" data-task-id="${task.id}" style="flex:1;padding:8px;border-radius:6px;background:rgba(239,68,68,0.2);border:1px solid #ef4444;color:#ef4444;cursor:pointer;font-size:12px;">Deletar</button>
                </div>
            `;

            tasksList.appendChild(card);
        });

        // Eventos de delete
        tasksList.querySelectorAll('.delete-task-standalone').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const airdropId = Number(e.target.getAttribute('data-airdrop-id'));
                const taskId = Number(e.target.getAttribute('data-task-id'));
                if (!confirm('Deletar esta tarefa?')) return;
                const tasks = getTasks(airdropId).filter(t => t.id !== taskId);
                saveTasks(airdropId, tasks);
                applyFilters();
            });
        });
        // Eventos: adicionar ao Google Calendar
        tasksList.querySelectorAll('.add-to-calendar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const airdropId = Number(e.target.getAttribute('data-airdrop-id'));
                const taskId = Number(e.target.getAttribute('data-task-id'));
                const task = getTasks(airdropId).find(t => t.id === taskId);
                if (!task) return alert('Tarefa não encontrada');
                const title = task.name || 'Tarefa';
                const airdropObj = getAirdrops().find(a => a.id === airdropId) || {};
                const airdropName = airdropObj.name || '';
                const details = (task.description ? task.description + '\n' : '') + (task.link ? 'Link: ' + task.link + '\n' : '') + 'Airdrop: ' + airdropName;
                let start;
                if (task.scheduledAt) start = new Date(task.scheduledAt);
                else if (window.getDefault21BRT) start = window.getDefault21BRT();
                else start = new Date((new Date()).getTime() + 5*60000);
                const end = new Date(start.getTime() + 30*60000);
                let recur = null;
                try {
                    const freq = task.frequency || 'Única';
                    if (freq === 'Diária') recur = 'RRULE:FREQ=DAILY';
                    else if (freq === 'Semanal') recur = 'RRULE:FREQ=WEEKLY';
                    else if (freq === 'Mensal') recur = 'RRULE:FREQ=MONTHLY';
                } catch(err) { recur = null; }
                window.openGoogleEventEditor({title, details, startDate: start, endDate: end, recurrence: recur});
            });
        });

        // download .ics em tarefas
        tasksList.querySelectorAll('.download-ics-standalone').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const airdropId = Number(e.target.getAttribute('data-airdrop-id'));
                const taskId = Number(e.target.getAttribute('data-task-id'));
                const task = getTasks(airdropId).find(t => t.id === taskId);
                if (!task) return alert('Tarefa não encontrada');
                const title = task.name || 'Tarefa';
                const airdropObj = getAirdrops().find(a => a.id === airdropId) || {};
                const details = (task.description ? task.description + '\n' : '') + (task.link ? 'Link: ' + task.link + '\n' : '') + 'Airdrop: ' + (airdropObj.name || '');
                const start = task.scheduledAt ? new Date(task.scheduledAt) : (window.getDefault21BRT ? window.getDefault21BRT() : new Date());
                const end = new Date(start.getTime() + 30*60000);
                const rrule = window.buildRRuleFromOptions ? window.buildRRuleFromOptions({freq: task.frequency, interval: task.recurrenceOptions?.interval, until: task.recurrenceOptions?.until, byday: task.recurrenceOptions?.byday, startDate: start}) : null;
                const fname = `${(task.name||'tarefa').replace(/[^a-z0-9]/gi,'_').toLowerCase()}.ics`;
                
                const confirmMsg = `Confirmar download de .ics para "${title}"?\n\nRecorrência: ${window.buildRRulePreview({freq: task.frequency, interval: task.recurrenceOptions?.interval, until: task.recurrenceOptions?.until, byday: task.recurrenceOptions?.byday}) || 'Sem recorrência'}`;
                if (!confirm(confirmMsg)) return;
                
                if (window.generateIcs && window.downloadIcs) {
                    const icsContent = window.generateIcs({title, details, location: airdropObj.url || '', startDate: start, endDate: end, rrule});
                    window.downloadIcs(icsContent, fname);
                } else {
                    alert('Helpers de .ics não carregados');
                }
            });
        });
    }

    // Eventos de filtro
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (airdropFilter) airdropFilter.addEventListener('change', applyFilters);
    if (frequencyFilter) frequencyFilter.addEventListener('change', applyFilters);    // Inicial
    populateAirdropFilter();
    applyFilters();
});

// Utility: open Google Calendar event editor with prefilled fields
window.openGoogleEventEditor = function({title, details, location, startDate, endDate, recurrence}){
    const toCal = (d) => {
        const dt = (d instanceof Date) ? d : new Date(d);
        const pad = (n) => String(n).padStart(2,'0');
        return dt.getUTCFullYear() + pad(dt.getUTCMonth()+1) + pad(dt.getUTCDate()) + 'T' + pad(dt.getUTCHours()) + pad(dt.getUTCMinutes()) + pad(dt.getUTCSeconds()) + 'Z';
    };
    try {
        const s = encodeURIComponent(title || '');
        const d = encodeURIComponent(details || '');
        const l = encodeURIComponent(location || '');
        const sdt = toCal(startDate || new Date());
        const edt = toCal(endDate || new Date((new Date()).getTime() + 30*60000));
        let url = `https://calendar.google.com/calendar/r/eventedit?text=${s}&details=${d}&location=${l}&dates=${sdt}/${edt}`;
        if (recurrence) {
            try {
                url += `&recur=${encodeURIComponent(recurrence)}`;
            } catch (err) {
                // ignore
            }
        }
        window.open(url, '_blank');
    } catch (err) {
        console.error('openGoogleEventEditor error', err);
    }
};

/* ========== STAKES ========== */
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stakes-list') === null) return;

    // Verificar autenticação
    if (window.requireAuth && !window.requireAuth()) return;
    
    const stakes = getUserData('stakes', []);
    if (stakes.length === 0) {
        localStorage.setItem('stakes', JSON.stringify([
            {
                id: 'st_1',
                protocol: 'Lido',
                token: 'XINBA',
                amount: 1333333,
                value: 20001795.00,
                apy: 1.3,
                status: 'Ativo',
                startDate: '2025-09-12',
                unlockDate: '2025-12-24',
                notes: 'TESTE NOVAMENTE',
                createdAt: new Date().toISOString()
            },
            {
                id: 'st_2',
                protocol: 'Lido',
                token: 'XINBA',
                amount: 1333333,
                value: 20001795.00,
                apy: 1.3,
                status: 'Locked',
                startDate: '2025-09-12',
                unlockDate: '2025-12-24',
                notes: 'TESTE NOVAMENTE FOASPAS',
                createdAt: new Date().toISOString()
            }
        ]));
        saveUserData('stakes', stakes);
    }

    const modalStakeFormId = 'stake-form-modal';
    const stakesList = document.getElementById('stakes-list');
    const addStakeBtn = document.getElementById('add-stake');
    const stakeFormModal = document.getElementById(modalStakeFormId);
    const stakeFormSave = document.getElementById('stake-form-save');
    const stakeFormCancel = document.getElementById('stake-form-cancel');
    const stakesSearch = document.getElementById('stakes-search');
    const stakesStatusFilter = document.getElementById('stakes-status-filter');

    let editingStakeId = null;

    // Carregar e exibir stakes
    const loadStakes = () => {
        const stakes = getUserData('stakes', []);
        const searchTerm = (stakesSearch.value || '').toLowerCase();
        const statusFilter = stakesStatusFilter.value || '';

        const filtered = stakes.filter(s => {
            const matchSearch = !searchTerm || 
                s.protocol.toLowerCase().includes(searchTerm) || 
                s.token.toLowerCase().includes(searchTerm);
            const matchStatus = !statusFilter || s.status === statusFilter;
            return matchSearch && matchStatus;
        });

        stakesList.innerHTML = '';
        filtered.forEach(stake => {
            const days = stake.unlockDate ? Math.max(0, Math.floor((new Date(stake.unlockDate) - new Date()) / (1000 * 60 * 60 * 24))) : null;
            const rewardAccumulated = (stake.value * stake.apy / 100 * ((new Date() - new Date(stake.startDate)) / (1000 * 60 * 60 * 24))) || 0;

            const card = document.createElement('div');
            card.className = 'card';
            card.style.cssText = `padding:20px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);position:relative;`;
            card.innerHTML = `
                <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:12px;">
                    <div>
                        <h4 style="margin:0;color:#fff;font-size:16px;">${stake.protocol}</h4>
                        <div style="display:flex;gap:8px;margin-top:8px;">
                            <span style="background:#${stake.status === 'Ativo' ? '10b981' : 'f59e0b'};color:#000;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:500;">${stake.status}</span>
                            <span style="background:#6366f1;color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;">${stake.token}</span>
                        </div>
                    </div>
                    <button data-id="${stake.id}" class="stake-menu" style="background:none;border:none;color:#aaa;font-size:20px;cursor:pointer;">⋯</button>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <div>
                        <div style="color:var(--muted);font-size:12px;margin-bottom:4px;">Quantidade</div>
                        <div style="color:#fff;font-weight:500;">${stake.amount.toLocaleString('pt-BR')} ${stake.token}</div>
                    </div>
                    <div>
                        <div style="color:var(--muted);font-size:12px;margin-bottom:4px;">Valor Total</div>
                        <div style="color:#10b981;font-weight:500;">$${stake.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    </div>
                    <div>
                        <div style="color:var(--muted);font-size:12px;margin-bottom:4px;">APY</div>
                        <div style="color:#60a5fa;font-weight:500;">${stake.apy.toFixed(2)}%</div>
                    </div>
                    <div>
                        <div style="color:var(--muted);font-size:12px;margin-bottom:4px;">Recompensas Acum.</div>
                        <div style="color:#d8b4fe;font-weight:500;">$${rewardAccumulated.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                    <div>
                        <div style="color:var(--muted);font-size:12px;margin-bottom:4px;">Início</div>
                        <div style="color:#fff;font-size:13px;">${new Date(stake.startDate).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div>
                        <div style="color:var(--muted);font-size:12px;margin-bottom:4px;">Unlock${days !== null ? ` (${days} dias)` : ''}</div>
                        <div style="color:#${days !== null && days < 30 ? 'f87171' : 'fff'};font-size:13px;">${stake.unlockDate ? new Date(stake.unlockDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
                    </div>
                </div>

                ${stake.notes ? `<div style="padding:8px;background:rgba(99,102,241,0.1);border-left:3px solid #6366f1;border-radius:4px;color:#c7d2fe;font-size:13px;margin-top:12px;">${stake.notes}</div>` : ''}

                <div class="stake-menu-dropdown" style="display:none;position:absolute;top:40px;right:20px;background:#0f172a;border:1px solid rgba(255,255,255,0.1);border-radius:8px;overflow:hidden;z-index:100;min-width:150px;">
                    <button class="stake-edit" data-id="${stake.id}" style="display:block;width:100%;text-align:left;padding:10px 16px;background:none;border:none;color:#fff;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.1);">Editar</button>
                    <button class="stake-delete" data-id="${stake.id}" style="display:block;width:100%;text-align:left;padding:10px 16px;background:none;border:none;color:#f87171;cursor:pointer;">Deletar</button>
                </div>
            `;
            stakesList.appendChild(card);

            // Menu dropdown
            const menuBtn = card.querySelector('.stake-menu');
            const dropdown = card.querySelector('.stake-menu-dropdown');
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });

            // Editar
            card.querySelector('.stake-edit').addEventListener('click', () => {
                openStakeForm(stake.id);
                dropdown.style.display = 'none';
            });

            // Deletar
            card.querySelector('.stake-delete').addEventListener('click', () => {
                if (confirm(`Tem certeza que deseja deletar o stake de ${stake.protocol}?`)) {
                    const stakes = getUserData('stakes', []);
                    const updated = stakes.filter(s => s.id !== stake.id);
                    saveUserData('stakes', updated);
                    loadStakes();
                    updateStakesMetrics();
                }
                dropdown.style.display = 'none';
            });
        });

        updateStakesMetrics();
    };

    // Atualizar métricas
    const updateStakesMetrics = () => {
        const stakes = getUserData('stakes', []);
        const activeStakes = stakes.filter(s => s.status === 'Ativo');
        const totalValue = stakes.reduce((sum, s) => sum + (s.value || 0), 0);
        const totalRewards = stakes.reduce((sum, s) => {
            const days = (new Date() - new Date(s.startDate)) / (1000 * 60 * 60 * 24);
            return sum + (s.value * s.apy / 100 * (days / 365));
        }, 0);
        const avgApy = stakes.length > 0 ? (stakes.reduce((sum, s) => sum + s.apy, 0) / stakes.length) : 0;

        document.getElementById('total-stakes').textContent = activeStakes.length;
        document.getElementById('total-value').textContent = '$' + totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        document.getElementById('total-rewards').textContent = '$' + totalRewards.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        document.getElementById('avg-apy').textContent = avgApy.toFixed(2) + '%';

        document.querySelector('.main > p').textContent = `Gerencie seus investimentos em staking (${stakes.length})`;
    };

    // Abrir formulário
    const openStakeForm = (stakeId = null) => {
        editingStakeId = stakeId;

        if (stakeId) {
            const stakes = JSON.parse(localStorage.getItem('stakes') || '[]');
            const stake = stakes.find(s => s.id === stakeId);
            if (stake) {
                document.getElementById('stake-form-title').textContent = 'Editar Stake';
                document.getElementById('stake-protocol').value = stake.protocol;
                document.getElementById('stake-token').value = stake.token;
                document.getElementById('stake-amount').value = stake.amount;
                document.getElementById('stake-value').value = stake.value;
                document.getElementById('stake-apy').value = stake.apy;
                document.getElementById('stake-status').value = stake.status;
                document.getElementById('stake-start-date').value = stake.startDate;
                document.getElementById('stake-unlock-date').value = stake.unlockDate || '';
                document.getElementById('stake-notes').value = stake.notes || '';
            }
        } else {
            document.getElementById('stake-form-title').textContent = 'Novo Stake';
            document.getElementById('stake-protocol').value = '';
            document.getElementById('stake-token').value = '';
            document.getElementById('stake-amount').value = '';
            document.getElementById('stake-value').value = '';
            document.getElementById('stake-apy').value = '';
            document.getElementById('stake-status').value = 'Ativo';
            document.getElementById('stake-start-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('stake-unlock-date').value = '';
            document.getElementById('stake-notes').value = '';
        }

        stakeFormModal.style.display = 'flex';
    };

    // Salvar stake
    const saveStake = () => {
        const protocol = document.getElementById('stake-protocol').value.trim();
        const token = document.getElementById('stake-token').value.trim();
        const amount = parseFloat(document.getElementById('stake-amount').value);
        const value = parseFloat(document.getElementById('stake-value').value);
        const apy = parseFloat(document.getElementById('stake-apy').value);
        const status = document.getElementById('stake-status').value;
        const startDate = document.getElementById('stake-start-date').value;
        const unlockDate = document.getElementById('stake-unlock-date').value;
        const notes = document.getElementById('stake-notes').value.trim();

        if (!protocol || !token || !amount || !value || !apy || !startDate) {
            alert('Preencha todos os campos obrigatórios (*)');
            return;
        }

        let stakes = getUserData('stakes', []);

        if (editingStakeId) {
            const idx = stakes.findIndex(s => s.id === editingStakeId);
            if (idx !== -1) {
                stakes[idx] = {
                    ...stakes[idx],
                    protocol,
                    token,
                    amount,
                    value,
                    apy,
                    status,
                    startDate,
                    unlockDate: unlockDate || stakes[idx].unlockDate,
                    notes
                };
            }
        } else {
            stakes.push({
                id: 'st_' + Date.now(),
                protocol,
                token,
                amount,
                value,
                apy,
                status,
                startDate,
                unlockDate,
                notes,
                createdAt: new Date().toISOString()
            });
        }

        saveUserData('stakes', stakes);
        stakeFormModal.style.display = 'none';
        loadStakes();
    };

    // Event listeners
    addStakeBtn.addEventListener('click', () => openStakeForm());
    stakeFormSave.addEventListener('click', saveStake);
    stakeFormCancel.addEventListener('click', () => {
        stakeFormModal.style.display = 'none';
    });
    stakesSearch.addEventListener('input', loadStakes);
    stakesStatusFilter.addEventListener('change', loadStakes);

    // Fechar modal ao clicar fora
    stakeFormModal.addEventListener('click', (e) => {
        if (e.target === stakeFormModal) {
            stakeFormModal.style.display = 'none';
        }
    });

    loadStakes();
});

/* ========== POOLS ========== */
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pools-list') === null) return;

    // Verificar autenticação
    if (window.requireAuth && !window.requireAuth()) return;
    
    const pools = getUserData('pools', []);
    if (pools.length === 0) {
        saveUserData('pools', []);
    }

    const modalPoolFormId = 'pool-form-modal';
    const poolsList = document.getElementById('pools-list');
    const addPoolBtn = document.getElementById('add-pool');
    const poolFormModal = document.getElementById(modalPoolFormId);
    const poolFormSave = document.getElementById('pool-form-save');
    const poolFormCancel = document.getElementById('pool-form-cancel');
    const poolsSearch = document.getElementById('pools-search');
    const poolsStatusFilter = document.getElementById('pools-status-filter');

    let editingPoolId = null;

    // Carregar e exibir pools
    const loadPools = () => {
        const pools = getUserData('pools', []);
        const searchTerm = (poolsSearch.value || '').toLowerCase();
        const statusFilter = poolsStatusFilter.value || '';

        const filtered = pools.filter(p => {
            const matchSearch = !searchTerm || 
                p.protocol.toLowerCase().includes(searchTerm) || 
                p.token.toLowerCase().includes(searchTerm);
            const matchStatus = !statusFilter || p.status === statusFilter;
            return matchSearch && matchStatus;
        });

        poolsList.innerHTML = '';
        filtered.forEach(pool => {
            const daysSinceStart = Math.floor((new Date() - new Date(pool.startDate)) / (1000 * 60 * 60 * 24));
            const rewardAccumulated = (pool.value * pool.apy / 100 * (daysSinceStart / 365)) || 0;

            const card = document.createElement('div');
            card.className = 'card';
            card.style.cssText = `padding:20px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);position:relative;`;
            card.innerHTML = `
                <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:12px;">
                    <div>
                        <h4 style="margin:0;color:#fff;font-size:16px;">${pool.protocol}</h4>
                        <div style="display:flex;gap:8px;margin-top:8px;">
                            <span style="background:#${pool.status === 'Ativo' ? '10b981' : '6b7280'};color:${pool.status === 'Ativo' ? '#000' : '#fff'};padding:4px 8px;border-radius:4px;font-size:12px;font-weight:500;">${pool.status}</span>
                            <span style="background:#6366f1;color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;">${pool.token}</span>
                        </div>
                    </div>
                    <button data-id="${pool.id}" class="pool-menu" style="background:none;border:none;color:#aaa;font-size:20px;cursor:pointer;">⋯</button>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <div>
                        <div style="color:var(--muted);font-size:12px;margin-bottom:4px;">Quantidade</div>
                        <div style="color:#fff;font-weight:500;">${pool.amount.toLocaleString('pt-BR')} ${pool.token}</div>
                    </div>
                    <div>
                        <div style="color:var(--muted);font-size:12px;margin-bottom:4px;">Valor Total</div>
                        <div style="color:#10b981;font-weight:500;">$${pool.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    </div>
                    <div>
                        <div style="color:var(--muted);font-size:12px;margin-bottom:4px;">APY</div>
                        <div style="color:#60a5fa;font-weight:500;">${pool.apy.toFixed(2)}%</div>
                    </div>
                    <div>
                        <div style="color:var(--muted);font-size:12px;margin-bottom:4px;">Recompensas Acum.</div>
                        <div style="color:#d8b4fe;font-weight:500;">$${rewardAccumulated.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    </div>
                </div>

                <div style="margin-bottom:12px;">
                    <div style="color:var(--muted);font-size:12px;margin-bottom:4px;">Início (${daysSinceStart} dias)</div>
                    <div style="color:#fff;font-size:13px;">${new Date(pool.startDate).toLocaleDateString('pt-BR')}</div>
                </div>

                ${pool.notes ? `<div style="padding:8px;background:rgba(99,102,241,0.1);border-left:3px solid #6366f1;border-radius:4px;color:#c7d2fe;font-size:13px;margin-top:12px;">${pool.notes}</div>` : ''}

                <div class="pool-menu-dropdown" style="display:none;position:absolute;top:40px;right:20px;background:#0f172a;border:1px solid rgba(255,255,255,0.1);border-radius:8px;overflow:hidden;z-index:100;min-width:150px;">
                    <button class="pool-edit" data-id="${pool.id}" style="display:block;width:100%;text-align:left;padding:10px 16px;background:none;border:none;color:#fff;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.1);">Editar</button>
                    <button class="pool-delete" data-id="${pool.id}" style="display:block;width:100%;text-align:left;padding:10px 16px;background:none;border:none;color:#f87171;cursor:pointer;">Deletar</button>
                </div>
            `;
            poolsList.appendChild(card);

            // Menu dropdown
            const menuBtn = card.querySelector('.pool-menu');
            const dropdown = card.querySelector('.pool-menu-dropdown');
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Fechar outros dropdowns
                document.querySelectorAll('.pool-menu-dropdown').forEach(d => {
                    if (d !== dropdown) d.style.display = 'none';
                });
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });

            // Editar
            card.querySelector('.pool-edit').addEventListener('click', () => {
                openPoolForm(pool.id);
                dropdown.style.display = 'none';
            });

            // Deletar
            card.querySelector('.pool-delete').addEventListener('click', () => {
                if (confirm(`Tem certeza que deseja deletar a pool de ${pool.protocol}?`)) {
                    const pools = getUserData('pools', []);
                    const updated = pools.filter(p => p.id !== pool.id);
                    saveUserData('pools', updated);
                    loadPools();
                    updatePoolsMetrics();
                }
                dropdown.style.display = 'none';
            });
        });

        updatePoolsMetrics();
    };

    // Atualizar métricas
    const updatePoolsMetrics = () => {
        const pools = getUserData('pools', []);
        const activePools = pools.filter(p => p.status === 'Ativo');
        const totalValue = pools.reduce((sum, p) => sum + (p.value || 0), 0);
        const totalRewards = pools.reduce((sum, p) => {
            const days = (new Date() - new Date(p.startDate)) / (1000 * 60 * 60 * 24);
            return sum + (p.value * p.apy / 100 * (days / 365));
        }, 0);
        const avgApy = pools.length > 0 ? (pools.reduce((sum, p) => sum + p.apy, 0) / pools.length) : 0;

        document.getElementById('total-pools').textContent = activePools.length;
        document.getElementById('total-value').textContent = '$' + totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        document.getElementById('total-rewards').textContent = '$' + totalRewards.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        document.getElementById('avg-apy').textContent = avgApy.toFixed(2) + '%';

        document.querySelector('.main > p').textContent = `Gerencie seus investimentos em pools de liquidez (${pools.length})`;
    };

    // Abrir formulário
    const openPoolForm = (poolId = null) => {
        editingPoolId = poolId;

        if (poolId) {
            const pools = getUserData('pools', []);
            const pool = pools.find(p => p.id === poolId);
            if (pool) {
                document.getElementById('pool-form-title').textContent = 'Editar Pool';
                document.getElementById('pool-protocol').value = pool.protocol;
                document.getElementById('pool-token').value = pool.token;
                document.getElementById('pool-amount').value = pool.amount;
                document.getElementById('pool-value').value = pool.value;
                document.getElementById('pool-apy').value = pool.apy;
                document.getElementById('pool-status').value = pool.status;
                document.getElementById('pool-start-date').value = pool.startDate;
                document.getElementById('pool-notes').value = pool.notes || '';
            }
        } else {
            document.getElementById('pool-form-title').textContent = 'Nova Pool';
            document.getElementById('pool-protocol').value = '';
            document.getElementById('pool-token').value = '';
            document.getElementById('pool-amount').value = '';
            document.getElementById('pool-value').value = '';
            document.getElementById('pool-apy').value = '';
            document.getElementById('pool-status').value = 'Ativo';
            document.getElementById('pool-start-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('pool-notes').value = '';
        }

        poolFormModal.style.display = 'flex';
    };

    // Salvar pool
    const savePool = () => {
        const protocol = document.getElementById('pool-protocol').value.trim();
        const token = document.getElementById('pool-token').value.trim();
        const amount = parseFloat(document.getElementById('pool-amount').value);
        const value = parseFloat(document.getElementById('pool-value').value);
        const apy = parseFloat(document.getElementById('pool-apy').value);
        const status = document.getElementById('pool-status').value;
        const startDate = document.getElementById('pool-start-date').value;
        const notes = document.getElementById('pool-notes').value.trim();

        if (!protocol || !token || !amount || !value || !apy || !startDate) {
            alert('Preencha todos os campos obrigatórios (*)');
            return;
        }

        let pools = getUserData('pools', []);

        if (editingPoolId) {
            const idx = pools.findIndex(p => p.id === editingPoolId);
            if (idx !== -1) {
                pools[idx] = {
                    ...pools[idx],
                    protocol,
                    token,
                    amount,
                    value,
                    apy,
                    status,
                    startDate,
                    notes
                };
            }
        } else {
            pools.push({
                id: 'pool_' + Date.now(),
                protocol,
                token,
                amount,
                value,
                apy,
                status,
                startDate,
                notes,
                createdAt: new Date().toISOString()
            });
        }

        saveUserData('pools', pools);
        poolFormModal.style.display = 'none';
        loadPools();
    };

    // Event listeners
    addPoolBtn.addEventListener('click', () => openPoolForm());
    poolFormSave.addEventListener('click', savePool);
    poolFormCancel.addEventListener('click', () => {
        poolFormModal.style.display = 'none';
    });
    poolsSearch.addEventListener('input', loadPools);
    poolsStatusFilter.addEventListener('change', loadPools);

    // Fechar modal ao clicar fora
    poolFormModal.addEventListener('click', (e) => {
        if (e.target === poolFormModal) {
            poolFormModal.style.display = 'none';
        }
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.pool-menu') && !e.target.closest('.pool-menu-dropdown')) {
            document.querySelectorAll('.pool-menu-dropdown').forEach(d => d.style.display = 'none');
        }
    });

    loadPools();
});