#[test_only]
module sui_nft_bootcamp::my_nft_test {
    use sui_nft_bootcamp::my_nft::{Self, MyNFT};
    use sui::test_scenario::{Self, Scenario};
    use sui::tx_context;

    #[test]
    fun test_mint_nft() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Testar mint de NFT
        my_nft::mint(
            b"Test NFT",
            b"https://example.com/image.png",
            ctx
        );
        
        test_scenario::end(scenario);
    }
}

