# 🚀 Guia de Deploy - Sui NFT Bootcamp

## Pré-requisitos

1. Instalar Sui CLI:
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui
```

2. Configurar wallet (se ainda não tiver):
```bash
sui client active-address
```

Se não tiver, crie uma:
```bash
sui client new-address ed25519
```

## Passo 1: Compilar o contrato

```bash
cd move
sui move build
```

## Passo 2: Publicar no Testnet

```bash
sui client publish --gas-budget 100000000
```

## Passo 3: Copiar o Package ID

Após o deploy, você verá uma saída como:

```
Published Objects:
...
PackageID: 0x1234567890abcdef...
```

**Copie o PackageID** - você precisará dele no frontend!

## Passo 4: Atualizar o frontend

Edite `frontend/src/config.ts` e cole o PackageID copiado.

## Script Automatizado

Execute:
```bash
.\scripts\deploy.ps1
```

Ou no Linux/Mac:
```bash
./scripts/deploy.sh
```

