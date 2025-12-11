module sui_nft_bootcamp::my_nft {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};

    /// Struct que representa um NFT único
    struct MyNFT has key, store {
        id: UID,
        name: String,
        url: String,
    }

    /// Função pública para criar e mintar um novo NFT
    /// Transfere o NFT diretamente para o sender
    public entry fun mint(
        name: vector<u8>,
        url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let nft = MyNFT {
            id: object::new(ctx),
            name: string::utf8(name),
            url: string::utf8(url),
        };
        
        transfer::transfer(nft, tx_context::sender(ctx));
    }
}

