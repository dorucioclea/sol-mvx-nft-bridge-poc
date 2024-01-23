// Code generated by the multiversx-sc build system. DO NOT EDIT.

////////////////////////////////////////////////////
////////////////// AUTO-GENERATED //////////////////
////////////////////////////////////////////////////

// Init:                                 1
// Endpoints:                           24
// Async Callback (empty):               1
// Total number of exported functions:  26

#![no_std]
#![allow(internal_features)]
#![feature(lang_items)]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc_wasm_adapter::endpoints! {
    locknfts
    (
        init => init
        upgrade => upgrade
        whitelistTokenIds => whitelist_token_ids
        unWhitelistTokenIds => un_whitelist_token_ids
        addToAdminlist => add_to_admin_list
        removeFromAdminlist => remove_from_admin_list
        setIsLockingPaused => set_is_locking_paused
        setIsUnlockingPaused => set_is_unlocking_paused
        lock => lock
        unlockForAddress => unlock
        getAllDataForUser => fetch_all_data
        getNumberOfAddressesThatLocked => get_number_of_addresses_that_locked
        getNumberOfAddressesThatUnlocked => get_number_of_addresses_that_unlocked
        getAddressesThatLocked => get_addresses_that_locked
        getAddressesThatUnlocked => get_addresses_that_unlocked
        getAllLockers => get_all_lockers
        getAllUnlockers => get_all_unlockers
        getLockingTokenIds => locking_token_ids
        isLockingPaused => is_locking_paused
        isUnlockingPaused => is_unlocking_paused
        getRawLockedTokens => locked_tokens
        getRawUnlockedTokens => unlocked_tokens
        addressesThatLocked => addresses_that_locked
        addressesThatUnlocked => addresses_that_unlocked
        getAdminList => admin_list
    )
}

multiversx_sc_wasm_adapter::async_callback_empty! {}
