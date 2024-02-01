PROXY=https://devnet-api.multiversx.com
CHAIN_ID="D"

WALLET="../../wallet.pem"
USER="../../wallet2.pem"
USER_PUB_KEY="erd..."

ADDRESS=$(mxpy data load --key=address-devnet)
DEPLOY_TRANSACTION=$(mxpy data load --key=deployTransaction-devnet)

MINTER_CODE="./data-nft-lease.wasm"

deploy(){
    mxpy --verbose contract deploy \
    --bytecode output/locknfts.wasm \
    --metadata-not-readable \
    --metadata-payable-by-sc \
    --pem ${WALLET} \
    --proxy ${PROXY} \
    --chain ${CHAIN_ID} \
    --gas-limit 150000000 \
    --send \
    --recall-nonce \
    --outfile="./interaction/deploy-devnet.interaction.json" || return

    TRANSACTION=$(mxpy data parse --file="./interaction/deploy-devnet.interaction.json" --expression="data['emittedTransactionHash']")
    ADDRESS=$(mxpy data parse --file="./interaction/deploy-devnet.interaction.json" --expression="data['contractAddress']")

    mxpy data store --key=address-devnet --value=${ADDRESS}
    mxpy data store --key=deployTransaction-devnet --value=${TRANSACTION}
}



whitelistTokenIds() {
    
    # $1 = token identifier

    token_identifier="0x$(echo -n ${1} | xxd -p -u | tr -d '\n')"

    mxpy --verbose contract call ${ADDRESS} \
    --recall-nonce \
    --pem ${WALLET} \
    --gas-limit=6000000 \
    --function="whitelistTokenIds" \
    --arguments ${token_identifier} \
    --proxy ${PROXY} \
    --chain ${CHAIN_ID} \
    --send  || return  

}


setIsLockingPaused() {

    mxpy --verbose contract call ${ADDRESS} \
    --recall-nonce \
    --pem ${WALLET} \
    --gas-limit=6000000 \
    --function="setIsLockingPaused" \
    --arguments $1 \
    --proxy ${PROXY} \
    --chain ${CHAIN_ID} \
    --send  || return

}

setIsUnlockingPaused() {


    mxpy --verbose contract call ${ADDRESS} \
    --recall-nonce \
    --pem ${WALLET} \
    --gas-limit=6000000 \
    --function="setIsUnlockingPaused" \
    --arguments $1 \
    --proxy ${PROXY} \
    --chain ${CHAIN_ID} \
    --send  || return


}


addToAdminlist() {

    # $1 = address
    
    address="0x$(mxpy wallet bech32 --decode ${1})"

    mxpy --verbose contract call ${ADDRESS} \
    --recall-nonce \
    --pem ${WALLET} \
    --gas-limit=6000000 \
    --function="addToAdminlist" \
    --arguments $address \
    --proxy ${PROXY} \
    --chain ${CHAIN_ID} \
    --send  || return

}


lock() {
    #   $1 = NFT/SFT Token Identifier,
    #   $2 = NFT/SFT Token Nonce,
    #   $3 = NFT/SFT Token Amount,


    method="0x$(echo -n 'lock' | xxd -p -u | tr -d '\n')"
    token_identifier="0x$(echo -n ${1} | xxd -p -u | tr -d '\n')"

    mxpy --verbose contract call $USER_PUB_KEY \
    --recall-nonce \
    --pem=${USER} \
    --gas-limit=6000000 \
    --function="ESDTNFTTransfer" \
    --arguments $token_identifier $2 $3 ${ADDRESS} $method  \
    --proxy ${PROXY} \
    --chain ${CHAIN_ID} \
    --send || return


}



addToAdminlist() {
    # $1 = address
    address="0x$(mxpy wallet bech32 --decode ${1})"

    mxpy --verbose contract call ${ADDRESS} \
    --recall-nonce \
    --pem ${WALLET} \
    --gas-limit=6000000 \
    --function="addToAdminlist" \
    --arguments $address \
    --proxy ${PROXY} \
    --chain ${CHAIN_ID} \
    --send  || return

}