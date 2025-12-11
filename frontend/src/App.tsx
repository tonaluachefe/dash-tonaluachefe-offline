import { useState } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { Transaction } from '@mysten/sui.js/transactions';
import { PACKAGE_ID } from './config';
import './App.css';

function App() {
  const { currentWallet, connect, disconnect, signAndExecuteTransactionBlock } = useWalletKit();
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
    if (!currentWallet) {
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
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::my_nft::mint`,
        arguments: [
          tx.pure.string(nftName),
          tx.pure.string(nftUrl),
        ],
      });

      const result = await signAndExecuteTransactionBlock({
        transaction: tx,
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

              <button
                className="btn btn-primary"
                onClick={handleMint}
                disabled={loading || !nftName.trim() || !nftUrl.trim()}
              >
                {loading ? 'Mintando...' : '✨ Mint NFT'}
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

