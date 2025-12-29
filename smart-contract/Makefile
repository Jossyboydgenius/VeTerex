.PHONY: build test fmt fmt-check deploy-very deploy-very-dry verify-very-impl verify-very-proxy encode-proxy-ctor

VERY_CHAIN_ID ?= 4613
VERY_RPC_URL ?= https://rpc.verylabs.io
GAS_PRICE_WEI ?= 1000000000
VERY_VERIFIER_URL ?= https://veryscan.io/api
VERYSCAN_API_KEY ?=

-include .env

ifeq ($(strip $(VERYSCAN_API_KEY)),)
VERIFY_API_KEY_FLAG :=
else
VERIFY_API_KEY_FLAG := --verifier-api-key $(VERYSCAN_API_KEY)
endif

build:
	forge build --sizes

test:
	forge test -vvv

fmt:
	forge fmt

fmt-check:
	forge fmt --check

deploy-very-dry:
	forge script script/DeployVeryMediaCompletion.s.sol:DeployVeryMediaCompletion --rpc-url $(VERY_RPC_URL) --chain $(VERY_CHAIN_ID) --legacy --with-gas-price $(GAS_PRICE_WEI) -vvvv

deploy-very:
	forge script script/DeployVeryMediaCompletion.s.sol:DeployVeryMediaCompletion --rpc-url $(VERY_RPC_URL) --chain $(VERY_CHAIN_ID) --legacy --with-gas-price $(GAS_PRICE_WEI) --broadcast

verify-very-impl:
	forge verify-contract --rpc-url $(VERY_RPC_URL) --chain $(VERY_CHAIN_ID) --verifier custom --verifier-url $(VERY_VERIFIER_URL) $(VERIFY_API_KEY_FLAG) --num-of-optimizations 200 --compiler-version 0.8.30 $(ADDRESS) src/trex.sol:VeTerex

encode-proxy-ctor:
	cast abi-encode "constructor(address,bytes)" $(IMPLEMENTATION_ADDRESS) $(INIT_DATA)

verify-very-proxy:
	forge verify-contract --rpc-url $(VERY_RPC_URL) --chain $(VERY_CHAIN_ID) --verifier custom --verifier-url $(VERY_VERIFIER_URL) $(VERIFY_API_KEY_FLAG) --num-of-optimizations 200 --compiler-version 0.8.30 --constructor-args $$(cast abi-encode "constructor(address,bytes)" $(IMPLEMENTATION_ADDRESS) $(INIT_DATA)) $(PROXY_ADDRESS) lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy
