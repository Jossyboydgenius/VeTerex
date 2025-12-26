// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {VeTerex} from "../src/trex.sol";

contract VeTerexV2 is VeTerex {
    function version() external pure returns (uint256) {
        return 2;
    }
}

contract VeryMediaCompletionTest is Test {
    VeTerex internal nft;

    address internal owner = address(0xABCD);
    address internal backend = address(0xBEEF);
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        VeTerex implementation = new VeTerex();
        bytes memory initData = abi.encodeCall(VeTerex.initialize, ("VeTerex", "VTRX", owner, "ipfs://base/", backend));
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        nft = VeTerex(address(proxy));
    }

    function testBackendCanRegisterAndMint() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Book;
        string memory externalId = "isbn:9780143127741";
        string memory uri = "ipfs://media/book1.json";
        string memory name = "Book 1";

        bytes32 mediaId = nft.computeMediaId(kind, externalId);

        vm.prank(backend);
        uint256 tokenId = nft.completeAndRegisterByExternalId(alice, kind, externalId, uri, name);

        assertEq(nft.ownerOf(tokenId), alice);
        assertEq(nft.completionTokenId(alice, mediaId), tokenId);
        assertEq(nft.tokenMediaId(tokenId), mediaId);
        assertEq(nft.groupMemberCount(mediaId), 0);
        assertFalse(nft.isGroupMember(mediaId, alice));
        assertEq(nft.tokenURI(tokenId), uri);

        (bool exists, VeTerex.MediaKind storedKind, string memory storedUri) = nft.mediaInfo(mediaId);
        assertTrue(exists);
        assertEq(uint256(storedKind), uint256(kind));
        assertEq(storedUri, uri);
    }

    function testNonBackendCannotMint() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Movie;
        string memory externalId = "imdb:tt1375666";

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VeTerex.NotBackend.selector, alice));
        nft.completeAndRegisterByExternalId(alice, kind, externalId, "", "");
    }

    function testMintRevertsIfAlreadyCompleted() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Manga;
        string memory externalId = "mal:2";
        bytes32 mediaId = nft.computeMediaId(kind, externalId);

        vm.prank(backend);
        nft.completeAndRegisterByExternalId(alice, kind, externalId, "ipfs://media/manga2.json", "Manga 2");

        vm.prank(backend);
        vm.expectRevert(abi.encodeWithSelector(VeTerex.AlreadyCompleted.selector, alice, mediaId));
        nft.completeAndRegisterByExternalId(alice, kind, externalId, "ipfs://media/manga2.json", "Manga 2");
    }

    function testJoinAndLeaveGroup() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Anime;
        string memory externalId = "mal:20";
        bytes32 mediaId = nft.computeMediaId(kind, externalId);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VeTerex.NotCompleted.selector, alice, mediaId));
        nft.joinGroup(mediaId);

        vm.prank(backend);
        nft.completeAndRegisterByExternalId(alice, kind, externalId, "", "");

        vm.prank(alice);
        nft.joinGroup(mediaId);
        assertEq(nft.groupMemberCount(mediaId), 1);
        assertEq(nft.groupMemberAt(mediaId, 0), alice);
        assertTrue(nft.isGroupMember(mediaId, alice));

        vm.prank(alice);
        nft.leaveGroup(mediaId);
        assertEq(nft.groupMemberCount(mediaId), 0);
        assertFalse(nft.isGroupMember(mediaId, alice));
    }

    function testBurnClearsCompletionAndRemovesFromGroup() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Comic;
        string memory externalId = "marvel:deadpool-1";
        bytes32 mediaId = nft.computeMediaId(kind, externalId);

        vm.prank(backend);
        uint256 tokenId = nft.completeAndRegisterByExternalId(alice, kind, externalId, "", "");

        vm.prank(alice);
        nft.joinGroup(mediaId);

        vm.prank(alice);
        nft.burn(tokenId);

        assertEq(nft.completionTokenId(alice, mediaId), 0);
        assertEq(nft.groupMemberCount(mediaId), 0);
        assertFalse(nft.isGroupMember(mediaId, alice));
    }

    function testNonTransferableRevertsOnTransferAndApproval() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Movie;
        string memory externalId = "imdb:tt0137523";

        vm.prank(backend);
        uint256 tokenId = nft.completeAndRegisterByExternalId(alice, kind, externalId, "", "");

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VeTerex.NonTransferable.selector));
        nft.approve(bob, tokenId);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VeTerex.NonTransferable.selector));
        nft.setApprovalForAll(bob, true);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VeTerex.NonTransferable.selector));
        nft.transferFrom(alice, bob, tokenId);
    }

    function testTokenURIFallsBackToBaseURIAndHexMediaId() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Book;
        string memory externalId = "isbn:123";

        vm.prank(backend);
        uint256 tokenId = nft.completeAndRegisterByExternalId(alice, kind, externalId, "", "");

        string memory uri = nft.tokenURI(tokenId);
        assertTrue(bytes(uri).length > bytes("ipfs://base/").length);
        assertTrue(_startsWith(uri, "ipfs://base/"));
    }

    function testInitializeCannotBeCalledTwice() public {
        vm.prank(owner);
        vm.expectRevert();
        nft.initialize("VeTerex", "VTRX", owner, "ipfs://base/", backend);
    }

    function testUpgradeKeepsState() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Book;
        string memory externalId = "isbn:upgrade";
        bytes32 mediaId = nft.computeMediaId(kind, externalId);

        vm.prank(backend);
        uint256 tokenId = nft.completeAndRegisterByExternalId(alice, kind, externalId, "ipfs://media/u.json", "U");

        VeTerexV2 implV2 = new VeTerexV2();

        vm.prank(owner);
        nft.upgradeToAndCall(address(implV2), "");

        VeTerexV2 upgraded = VeTerexV2(address(nft));

        assertEq(upgraded.version(), 2);
        assertEq(upgraded.ownerOf(tokenId), alice);
        assertEq(upgraded.completionTokenId(alice, mediaId), tokenId);
        assertEq(upgraded.backend(), backend);
    }

    function testOnlyOwnerCanUpgrade() public {
        VeTerexV2 implV2 = new VeTerexV2();

        vm.prank(alice);
        vm.expectRevert();
        nft.upgradeToAndCall(address(implV2), "");
    }

    function _startsWith(string memory s, string memory prefix) internal pure returns (bool) {
        bytes memory sb = bytes(s);
        bytes memory pb = bytes(prefix);
        if (sb.length < pb.length) return false;
        for (uint256 i = 0; i < pb.length; i++) {
            if (sb[i] != pb[i]) return false;
        }
        return true;
    }
}
