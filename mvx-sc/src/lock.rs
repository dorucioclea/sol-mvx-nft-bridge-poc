#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(
    ManagedVecItem,
    TopEncode,
    TopDecode,
    NestedEncode,
    NestedDecode,
    PartialEq,
    Clone,
    Debug,
    TypeAbi,
)]
pub struct DataOut<M: ManagedTypeApi> {
    pub locked_tokens: ManagedVec<M, EsdtTokenPayment<M>>,
    pub unlocked_tokens: ManagedVec<M, EsdtTokenPayment<M>>,
    pub is_locking_paused: bool,
    pub is_unlocking_paused: bool,
}

#[multiversx_sc::contract]
pub trait LockNfts {
    #[init]
    fn init(&self) {
        self.is_locking_paused().set(true);
        self.is_unlocking_paused().set(true);
    }

    #[upgrade]
    fn upgrade(&self) {
        self.is_locking_paused().set(true);
        self.is_unlocking_paused().set(true);
    }

    #[only_owner]
    #[endpoint(whitelistTokenIds)]
    fn whitelist_token_ids(
        &self,
        token_ids: MultiValueEncoded<TokenIdentifier>,
    ) {
        for tid in token_ids.into_iter() {
            self.locking_token_ids().insert(tid);
        }
    }

    #[only_owner]
    #[endpoint(unWhitelistTokenIds)]
    fn un_whitelist_token_ids(
        &self,
        token_ids: MultiValueEncoded<TokenIdentifier>,
    ) {
        for tid in token_ids.into_iter() {
            self.locking_token_ids().swap_remove(&tid);
        }
    }

    #[only_owner]
    #[endpoint(addToAdminlist)]
    fn add_to_admin_list(&self, addresses: MultiValueEncoded<ManagedAddress>){
        for address in addresses.into_iter(){
            self.admin_list().insert(address);
        }
    }

    #[only_owner]
    #[endpoint(removeFromAdminlist)]
    fn remove_from_admin_list(&self, addresses: MultiValueEncoded<ManagedAddress>){
        for address in addresses.into_iter(){
            self.admin_list().swap_remove(&address);
        }
    }

    #[endpoint(setIsLockingPaused)]
    fn set_is_locking_paused(&self, is_paused: bool) {
        let caller = self.blockchain().get_caller();
        require!(self.admin_list().contains(&caller), "Caller not admin");

        self.is_locking_paused().set(is_paused);
    }

    #[endpoint(setIsUnlockingPaused)]
    fn set_is_unlocking_paused(&self, is_paused: bool) {
        let caller = self.blockchain().get_caller();
        require!(self.admin_list().contains(&caller), "Caller not admin");

        self.is_unlocking_paused().set(is_paused);
    }

    #[payable("*")]
    #[endpoint(lock)]
    fn lock(&self) {
        require!(self.is_locking_paused().get()==false, "Locking paused");
        let payments = self.call_value().all_esdt_transfers();
        require!(payments.len() > 0usize, "Need to lock at least 1");
        
        let caller = self.blockchain().get_caller();

        let mut locked_tokens = self.locked_tokens(&caller);
        for payment in payments.iter() {
            require!(self.locking_token_ids().contains(&payment.token_identifier), "Invalid token id");
            locked_tokens.push(&payment);
        }
    

        let number_of_locked_nfts = self.locked_tokens(&caller).len();
        if number_of_locked_nfts > 0 {
            self.addresses_that_locked().insert(caller);
        }
    }

    #[only_owner]
    #[endpoint(unlockForAddress)]
    fn unlock(&self, address: ManagedAddress, tokens_unlocked: MultiValueEncoded<MultiValue3<TokenIdentifier,u64,BigUint>>){
        require!(self.is_unlocking_paused().get()==false, "Unlocking paused");

        let mut payments = ManagedVec::new();
        for token in tokens_unlocked.into_iter(){
            let (token_id,nonce, amount) = token.into_tuple();
            let token_payment = EsdtTokenPayment::new(token_id, nonce, amount);
            self.unlocked_tokens(&address).push(&token_payment);
            payments.push(token_payment);
        }
        if payments.len() > 0 {
            self.send().direct_multi(&address, &payments);
        }
    }


    #[view(getAllDataForUser)]
    fn fetch_all_data(&self, address: OptionalValue<ManagedAddress>) -> DataOut<Self::Api> {
        let unwrapped_address = address.into_option().unwrap_or_else(|| {self.blockchain().get_caller()});

        let data_out = DataOut{
            locked_tokens: self.locked_tokens(&unwrapped_address).iter().collect(),
            unlocked_tokens: self.unlocked_tokens(&unwrapped_address).iter().collect(),
            is_locking_paused: self.is_locking_paused().get(),
            is_unlocking_paused: self.is_unlocking_paused().get(),
        };

        return data_out;
    }


    #[view(getNumberOfAddressesThatLocked)]
    fn get_number_of_addresses_that_locked(&self) -> usize {
        return self.addresses_that_locked().len();
    }

    #[view(getNumberOfAddressesThatUnlocked)]
    fn get_number_of_addresses_that_unlocked(&self) -> usize {
        return self.addresses_that_unlocked().len();
    }

    #[view(getAddressesThatLocked)]
    fn get_addresses_that_locked(&self) -> MultiValueEncoded<ManagedAddress> {
        return self.addresses_that_locked().iter().collect();
    }

    #[view(getAddressesThatUnlocked)]
    fn get_addresses_that_unlocked(&self) -> MultiValueEncoded<ManagedAddress> {
        return self.addresses_that_unlocked().iter().collect();
    }

    #[view(getAllLockers)]
    fn get_all_lockers(&self) -> MultiValueEncoded<MultiValue2<ManagedAddress,ManagedVec<EsdtTokenPayment>>> {
        let mut lockers = MultiValueEncoded::new();
        for user in self.addresses_that_locked().iter(){
            let mut locked_tokens = ManagedVec::new();
            for item in self.locked_tokens(&user).iter(){
                locked_tokens.push(item);
            }
            lockers.push(MultiValue2::from((user, locked_tokens)));
        }
        return lockers;
    }

    #[view(getAllUnlockers)]
    fn get_all_unlockers(&self) -> MultiValueEncoded<MultiValue2<ManagedAddress,ManagedVec<EsdtTokenPayment>>> {
        let mut unlockers = MultiValueEncoded::new();
        for user in self.addresses_that_locked().iter(){
            let mut unlocked_tokens = ManagedVec::new();
            for nonce in self.locked_tokens(&user).iter(){
                unlocked_tokens.push(nonce);
            }
            unlockers.push(MultiValue2::from((user, unlocked_tokens)));
        }
        return unlockers;
    }

    #[view(getLockingTokenIds)]
    #[storage_mapper("locking_token_ids")]
    fn locking_token_ids(&self) -> UnorderedSetMapper<TokenIdentifier>;

    #[view(isLockingPaused)]
    #[storage_mapper("is_locking_paused")]
    fn is_locking_paused(&self) -> SingleValueMapper<bool>;

    #[view(isUnlockingPaused)]
    #[storage_mapper("is_unlocking_paused")]
    fn is_unlocking_paused(&self) -> SingleValueMapper<bool>;

    #[view(getRawLockedTokens)]
    #[storage_mapper("locked_tokens")]
    fn locked_tokens(&self, address: &ManagedAddress) -> VecMapper<EsdtTokenPayment>;

    #[view(getRawUnlockedTokens)]
    #[storage_mapper("unlocked_tokens")]
    fn unlocked_tokens(&self, address: &ManagedAddress) -> VecMapper<EsdtTokenPayment>;

    #[view(addressesThatLocked)]
    #[storage_mapper("addresses_that_locked")]
    fn addresses_that_locked(&self) -> UnorderedSetMapper<ManagedAddress>;

    #[view(addressesThatUnlocked)]
    #[storage_mapper("addresses_that_unlocked")]
    fn addresses_that_unlocked(&self) -> UnorderedSetMapper<ManagedAddress>;

    #[view(getAdminList)]
    #[storage_mapper("admin_list")]
    fn admin_list(&self) -> UnorderedSetMapper<ManagedAddress>;
}
