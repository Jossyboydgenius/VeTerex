.PHONY: build test fmt fmt-check deploy-very deploy-very-dry

VERY_CHAIN_ID ?= 4613
VERY_RPC_URL ?= https://rpc.verylabs.io
GAS_PRICE_WEI ?= 1000000000

-include .env

build:
	forge build --sizes

test:
	forge test -vvv

fmt:
	forge fmt

fmt-check:
	forge fmt --check

deploy-very-dry:
	forge script script/DeployVeryMediaCompletion.s.sol:DeployVeryMediaCompletion --rpc-url $(VERY_RPC_URL) --chain $(VERY_CHAIN_ID)

deploy-very:
	forge script script/DeployVeryMediaCompletion.s.sol:DeployVeryMediaCompletion --rpc-url $(VERY_RPC_URL) --chain $(VERY_CHAIN_ID) --legacy --with-gas-price $(GAS_PRICE_WEI) --broadcast
