multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[multiversx_sc::module]
pub trait EventsModule {
    #[event("lockEvent")]
    fn lock_event(
        &self,
        #[indexed] caller: &ManagedAddress,
        #[indexed] token_identifier: &TokenIdentifier,
        #[indexed] nonce: &u64,
        #[indexed] amount: &BigUint,
    );
}
