# 🚀 Sui NFT Bootcamp - DApp Completo

Projeto completo de DApp para mintar NFTs na Sui Network, desenvolvido para o Sui Bootcamp.

## 📁 Estrutura do Projeto

```
.
├── move/                 # Contrato Move
│   ├── Move.toml        # Configuração do pacote
│   ├── sources/         # Código fonte Move
│   │   └── my_nft.move  # Contrato principal
│   └── README.md        # Documentação do contrato
│
├── frontend/            # Frontend React
│   ├── src/
│   │   ├── App.tsx     # Componente principal
│   │   ├── config.ts   # Configuração (Package ID)
│   │   └── ...
│   ├── package.json
│   └── README.md
│
├── scripts/             # Scripts de deploy
│   └── deploy.ps1      # Script PowerShell para deploy
│
├── DEPLOY.md           # Guia de deploy
└── README.md           # Este arquivo
```

## 🎯 Funcionalidades

### Contrato Move
- ✅ Struct `MyNFT` com campos `id`, `name`, `url`
- ✅ Função `mint()` pública que cria e transfere NFT
- ✅ Suporte a `key` e `store` abilities

### Frontend React
- ✅ Conexão com wallet Sui (Wallet Kit)
- ✅ Interface para mintar NFT
- ✅ Validação de campos
- ✅ Feedback visual de transações
- ✅ Design moderno e responsivo

## 🛠️ Pré-requisitos

1. **Sui CLI**: [Instalar Sui](https://docs.sui.io/build/install)
2. **Node.js**: v18 ou superior
3. **Wallet Sui**: Sui Wallet extension ou Sui Wallet mobile

## 📝 Passo a Passo

### 1. Compilar o Contrato Move

```bash
cd move
sui move build
```

### 2. Testar o Contrato (Opcional)

```bash
sui move test
```

### 3. Fazer Deploy no Testnet

```bash
# Opção 1: Usando o script
cd ..
.\scripts\deploy.ps1

# Opção 2: Manualmente
cd move
sui client publish --gas-budget 100000000
```

**⚠️ IMPORTANTE**: Copie o `PackageID` que aparecer após o deploy!

### 4. Configurar o Frontend

1. Edite `frontend/src/config.ts`
2. Cole o Package ID copiado:
```typescript
export const PACKAGE_ID = "0xSEU_PACKAGE_ID_AQUI";
```

### 5. Instalar Dependências do Frontend

```bash
cd frontend
npm install
```

### 6. Executar o Frontend

```bash
npm run dev
```

Acesse: http://localhost:5173

### 7. Usar a DApp

1. Clique em "Conectar Wallet"
2. Escolha sua wallet Sui
3. Preencha o nome e URL do NFT
4. Clique em "Mint NFT"
5. Confirme a transação na wallet
6. Aguarde a confirmação!

## 📦 Tecnologias Utilizadas

- **Move**: Linguagem de programação para contratos Sui
- **React**: Framework frontend
- **TypeScript**: Tipagem estática
- **Vite**: Build tool e dev server
- **@mysten/sui.js**: SDK oficial da Sui
- **@mysten/wallet-kit**: Kit de integração de wallets

## 🔧 Comandos Úteis

### Move
```bash
# Compilar
sui move build

# Testar
sui move test

# Publicar
sui client publish --gas-budget 100000000

# Ver objetos
sui client objects
```

### Frontend
```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

## 📚 Recursos

- [Documentação Sui](https://docs.sui.io/)
- [Sui Move Book](https://move-language.github.io/move/)
- [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajojpbepmmgbbp)

## 🐛 Troubleshooting

### Erro ao compilar Move
- Verifique se o Sui CLI está instalado: `sui --version`
- Certifique-se de estar na pasta `move/`

### Erro ao conectar wallet
- Instale a extensão Sui Wallet no navegador
- Certifique-se de que a wallet está desbloqueada

### Erro ao mintar
- Verifique se o Package ID está correto em `frontend/src/config.ts`
- Certifique-se de ter SUI tokens para gas no testnet
- Verifique o console do navegador para mais detalhes

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais no Sui Bootcamp.

## 🙏 Contribuições

Este é um projeto de bootcamp. Sinta-se livre para usar como referência!

---

**Desenvolvido com ❤️ para o Sui Bootcamp**




