# Dash@tonaluachefe-offline

Dashboard offline para gerenciamento de investimentos em criptomoedas, airdrops, stakes e pools de liquidez.

## 🚀 Funcionalidades

- **Airdrops**: Gerenciamento completo de projetos de airdrop com categorias, status e acompanhamento de recompensas
- **Stakes**: Controle de investimentos em staking com cálculo automático de recompensas e datas de unlock
- **Pools**: Gerenciamento de pools de liquidez sem período de lock
- **Wallets**: Cadastro e gerenciamento de carteiras
- **Dashboard**: Visão geral com métricas combinadas e gráficos
- **Tarefas**: Sistema de tarefas vinculadas aos airdrops com suporte a recorrência
- **Admin Panel**: Painel administrativo para visualizar todos os usuários e suas estatísticas

## 🔐 Segurança

- Sistema de autenticação com login/registro
- Dados isolados por usuário (localStorage)
- Painel administrativo com controle de acesso
- Credenciais admin criptografadas e ofuscadas

## 📁 Estrutura do Projeto

```
Dash@tonaluachefe-offline/
│
├── index.html              # Página inicial
├── login.html              # Página de login
├── register.html           # Página de registro
├── dashboard.html          # Dashboard principal
├── airdrops.html          # Gerenciamento de airdrops
├── stakes.html            # Gerenciamento de stakes
├── pools.html             # Gerenciamento de pools
├── wallets.html           # Gerenciamento de wallets
├── tarefas.html           # Sistema de tarefas
├── admin.html             # Painel administrativo
│
└── assets/
    ├── css/
    │   ├── site-base.css  # Estilos base
    │   └── style.css      # Estilos principais
    └── js/
        ├── app.js         # Lógica principal da aplicação
        ├── auth.js        # Sistema de autenticação
        ├── admin.js       # Painel administrativo
        └── ics-helpers.js # Helpers para Google Calendar
```

## 🛠️ Como Usar

### Executar Localmente

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd Dash@tonaluachefe-offline
```

2. Abra o arquivo `index.html` no navegador ou use um servidor local:
   - **PowerShell**: Execute `.\start-server.ps1` ou `.\server.ps1`
   - **VS Code**: Use a extensão Live Server
   - **Python**: `python -m http.server 8000`

3. Acesse `http://localhost:8000` (ou a porta configurada)

### Primeiro Acesso

- **Admin Principal**: `tonaluachefe@gmail.com` / `lordzeus`
- **Admin Padrão**: `admin@admin.com` / `lordzeus`

Ou crie uma nova conta através da página de registro.

## 📊 Métricas Disponíveis

O dashboard exibe 8 métricas principais:
1. **Ativos**: Airdrops ativos
2. **Completos**: Projetos finalizados
3. **Consistência**: Taxa de conclusão
4. **Mensal**: Lucro líquido
5. **Bruta**: Receita bruta total
6. **Custos**: Custos totais
7. **Stakes**: Total investido em stakes
8. **Pools**: Rendimento de pools

## 💾 Armazenamento

Todos os dados são armazenados localmente no navegador usando `localStorage`. Cada usuário tem seus dados isolados e seguros.

## 🔧 Tecnologias

- HTML5
- CSS3
- JavaScript (Vanilla)
- LocalStorage API
- Canvas API (para gráficos)

## 📝 Notas

- Sistema totalmente offline (não requer servidor backend)
- Dados armazenados localmente no navegador
- Compatível com todos os navegadores modernos

## 📄 Licença

Este projeto é privado e confidencial.

