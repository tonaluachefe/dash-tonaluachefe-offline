# Move NFT Contract

Este módulo Move implementa um contrato de NFT para o Sui Bootcamp com sistema de pagamento em USDC.

## Estrutura

- `Move.toml` - Configuração do pacote Move
- `sources/my_nft.move` - Contrato principal com struct MyNFT e função mint
- `sources/my_nft_test.move` - Testes do contrato

## Funcionalidades

### Pagamento
- **Custo do Mint**: 10 USDC por NFT
- **Token USDC**: `0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC`
- **Wallet de Recebimento**: `0xc4dfa5b5ed3ff3756b05a44086d9a9a50aa49bb7054e159d6ba453596b58668f`

### Função Mint
A função `mint()` requer:
- Um `Coin<USDC>` com pelo menos 10 USDC
- Nome do NFT (vector<u8>)
- URL da imagem (vector<u8>)

O contrato:
1. Divide exatamente 10 USDC do coin de pagamento
2. Transfere os 10 USDC para a wallet especificada
3. Retorna o resto do coin ao sender
4. Cria e transfere o NFT para o sender

## Como compilar

```bash
sui move build
```

## Como testar

```bash
sui move test
```

## Como fazer deploy

Veja o arquivo `DEPLOY.md` na raiz do projeto para instruções completas.




