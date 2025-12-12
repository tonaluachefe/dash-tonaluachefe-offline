# Frontend - Sui NFT Bootcamp

Frontend React para mintar NFTs no Sui Network.

## Instalação

```bash
cd frontend
npm install
```

## Configuração

1. Após fazer deploy do contrato Move, copie o Package ID
2. Edite `src/config.ts` e cole o Package ID:
```typescript
export const PACKAGE_ID = "0xSEU_PACKAGE_ID_AQUI";
```

## Executar

```bash
npm run dev
```

Acesse: http://localhost:5173

## Build para produção

```bash
npm run build
```

## Funcionalidades

- ✅ Conectar wallet Sui
- ✅ Mint NFT com nome e URL
- ✅ Validação de campos
- ✅ Feedback visual de sucesso/erro
- ✅ Interface responsiva e moderna




