module sui_nft_bootcamp::my_nft {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use std::string::{Self, String};
    
    // Importar o tipo USDC do módulo publicado
    use 0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC;

    // Endereço da wallet que receberá os pagamentos
    const PAYMENT_RECIPIENT: address = @0xc4dfa5b5ed3ff3756b05a44086d9a9a50aa49bb7054e159d6ba453596b58668f;

    /// Struct que representa um NFT único
    struct MyNFT has key, store {
        id: UID,
        name: String,
        url: String,
    }

    /// Constante: custo do mint em USDC (10 USDC = 10 * 10^6 pois USDC tem 6 decimais)
    const MINT_COST: u64 = 10000000; // 10 USDC = 10 * 10^6

    /// Função pública para criar e mintar um novo NFT
    /// Requer pagamento de 10 USDC
    /// Transfere o NFT para o sender e o pagamento para a wallet especificada
    public entry fun mint(
        payment: Coin<USDC>,
        name: vector<u8>,
        url: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Dividir exatamente 10 USDC do pagamento
        let mint_fee = coin::split(&mut payment, MINT_COST, ctx);
        
        // Transferir o pagamento para a wallet especificada
        transfer::public_transfer(mint_fee, PAYMENT_RECIPIENT);
        
        // Retornar o resto do coin ao sender (mesmo que vazio)
        transfer::public_transfer(payment, tx_context::sender(ctx));
        
        // Criar e transferir o NFT para o sender
        let nft = MyNFT {
            id: object::new(ctx),
            name: string::utf8(name),
            url: string::utf8(url),
        };
        
        transfer::transfer(nft, tx_context::sender(ctx));
    }

    /// Função helper para obter o custo do mint
    public fun get_mint_cost(): u64 {
        MINT_COST
    }

    /// Função helper para obter o endereço do recipient
    public fun get_payment_recipient(): address {
        PAYMENT_RECIPIENT
    }
}

