# ⚡ Quick Start - Sui NFT Bootcamp

Guia rápido para começar a usar o projeto.

## 🚀 Setup Rápido

### 1. Instalar Sui CLI

```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui
```

### 2. Compilar Contrato

```bash
cd move
sui move build
```

### 3. Deploy (Copie o Package ID!)

```bash
sui client publish --gas-budget 100000000
```

### 4. Configurar Frontend

1. Edite `frontend/src/config.ts`
2. Cole o Package ID

### 5. Rodar Frontend

```bash
cd frontend
npm install
npm run dev
```

## ✅ Checklist

- [ ] Sui CLI instalado
- [ ] Contrato compilado sem erros
- [ ] Deploy realizado no testnet
- [ ] Package ID copiado e configurado
- [ ] Frontend instalado e rodando
- [ ] Wallet Sui instalada no navegador

## 🎯 Próximos Passos

1. Acesse http://localhost:5173
2. Conecte sua wallet
3. Mint seu primeiro NFT!

---

Para mais detalhes, veja `SUI_BOOTCAMP_README.md`

