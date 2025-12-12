#[test_only]
module sui_nft_bootcamp::my_nft_test {
    use sui_nft_bootcamp::my_nft::{Self, MyNFT};
    use sui::test_scenario::{Self, Scenario};
    use sui::tx_context;
    use sui::coin;
    use 0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC;

    #[test]
    fun test_mint_nft() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Criar um coin de teste USDC com saldo suficiente (15 USDC)
        let payment = coin::mint_for_testing<USDC>(15000000, ctx); // 15 USDC
        
        // Testar mint de NFT com pagamento
        my_nft::mint(
            payment,
            b"Test NFT",
            b"https://example.com/image.png",
            ctx
        );
        
        test_scenario::end(scenario);
    }
}




