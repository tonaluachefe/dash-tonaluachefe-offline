import { useState } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { TransactionBlock, getFullnodeUrl, SuiClient } from '@mysten/sui.js';
import { PACKAGE_ID } from './config';
import './App.css';

// Constantes
const USDC_TYPE = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
const MINT_COST = 10000000; // 10 USDC = 10 * 10^6 (6 decimais)

function App() {
  const { currentWallet, connect, disconnect, signAndExecuteTransactionBlock, currentAccount } = useWalletKit();
  const [nftName, setNftName] = useState('');
  const [nftUrl, setNftUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      setError('Erro ao conectar wallet');
      console.error(err);
    }
  };

  const handleMint = async () => {
    if (!currentWallet || !currentAccount) {
      setError('Conecte sua wallet primeiro');
      return;
    }

    if (!nftName.trim() || !nftUrl.trim()) {
      setError('Preencha nome e URL do NFT');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Conectar ao cliente Sui
      const client = new SuiClient({ url: getFullnodeUrl('testnet') });
      
      // Obter os coins USDC do usuário
      const coins = await client.getCoins({
        owner: currentAccount.address,
        coinType: USDC_TYPE,
      });

      if (coins.data.length === 0) {
        setError('Você não possui USDC. Você precisa de 10 USDC para mintar um NFT.');
        setLoading(false);
        return;
      }

      // Calcular o total de USDC disponível
      let totalUSDC = BigInt(0);
      coins.data.forEach((coin) => {
        totalUSDC += BigInt(coin.balance);
      });

      if (totalUSDC < BigInt(MINT_COST)) {
        setError(`Você não possui USDC suficiente. Necessário: 10 USDC. Você tem: ${Number(totalUSDC) / 1000000} USDC`);
        setLoading(false);
        return;
      }

      // Criar transação
      const tx = new TransactionBlock();
      
      // Obter o primeiro coin que tenha saldo suficiente, ou combinar coins
      let paymentCoin;
      if (coins.data.length === 1 && BigInt(coins.data[0].balance) >= BigInt(MINT_COST)) {
        // Usar o coin diretamente se tiver saldo suficiente
        paymentCoin = tx.object(coins.data[0].coinObjectId);
      } else {
        // Combinar todos os coins e depois dividir o necessário
        const primaryCoin = tx.object(coins.data[0].coinObjectId);
        const remainingCoins = coins.data.slice(1).map(coin => tx.object(coin.coinObjectId));
        
        if (remainingCoins.length > 0) {
          tx.mergeCoins(primaryCoin, remainingCoins);
        }
        
        paymentCoin = primaryCoin;
      }

      // Dividir exatamente 10 USDC para pagamento
      const [payment] = tx.splitCoins(paymentCoin, [MINT_COST]);
      
      // Chamar a função mint com o pagamento
      tx.moveCall({
        target: `${PACKAGE_ID}::my_nft::mint`,
        arguments: [
          payment, // Coin de pagamento
          tx.pure(Array.from(new TextEncoder().encode(nftName))),
          tx.pure(Array.from(new TextEncoder().encode(nftUrl))),
        ],
      });

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });

      setResult(`NFT mintado com sucesso! Transaction: ${result.digest}`);
      setNftName('');
      setNftUrl('');
    } catch (err: any) {
      setError(err.message || 'Erro ao mintar NFT');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>🎨 Sui NFT Bootcamp</h1>
        <p className="subtitle">Mint seu NFT na Sui Network</p>

        {!currentWallet ? (
          <div className="connect-section">
            <button className="btn btn-primary" onClick={handleConnect}>
              🔗 Conectar Wallet
            </button>
            <p className="info">Conecte sua wallet Sui para começar</p>
          </div>
        ) : (
          <div className="mint-section">
            <div className="wallet-info">
              <span>Conectado: {currentWallet.name}</span>
              <button className="btn btn-secondary" onClick={disconnect}>
                Desconectar
              </button>
            </div>

            <div className="form">
              <div className="form-group">
                <label>Nome do NFT</label>
                <input
                  type="text"
                  value={nftName}
                  onChange={(e) => setNftName(e.target.value)}
                  placeholder="Ex: Meu Primeiro NFT"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>URL da Imagem</label>
                <input
                  type="url"
                  value={nftUrl}
                  onChange={(e) => setNftUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.png"
                  disabled={loading}
                />
              </div>

              <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#60a5fa' }}>
                  💰 Minting Cost: <strong>10 USDC</strong>
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                  Payment will be sent to: 0xc4dfa5b5...58668f
                </p>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleMint}
                disabled={loading || !nftName.trim() || !nftUrl.trim()}
              >
                {loading ? 'Mintando...' : '✨ Mint NFT (10 USDC)'}
              </button>
            </div>

            {error && (
              <div className="alert alert-error">
                ❌ {error}
              </div>
            )}

            {result && (
              <div className="alert alert-success">
                ✅ {result}
              </div>
            )}
          </div>
        )}

        <div className="footer">
          <p>Package ID: <code>{PACKAGE_ID}</code></p>
          <p className="note">⚠️ Certifique-se de atualizar o Package ID após o deploy</p>
        </div>
      </div>
    </div>
  );
}

export default App;

