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
        string memory uri = "ipfs://media/book1.json";
        string memory name = "Book 1";

        bytes32 mediaId = nft.computeMediaId(kind, uri, name);

        vm.prank(backend);
        uint256 tokenId = nft.completeAndRegisterByExternalId(alice, kind, uri, name);

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

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VeTerex.NotBackend.selector, alice));
        nft.completeAndRegisterByExternalId(alice, kind, "", "");
    }

    function testMintRevertsIfAlreadyCompleted() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Manga;
        string memory uri = "ipfs://media/manga2.json";
        string memory name = "Manga 2";
        bytes32 mediaId = nft.computeMediaId(kind, uri, name);

        vm.prank(backend);
        nft.completeAndRegisterByExternalId(alice, kind, uri, name);

        vm.prank(backend);
        vm.expectRevert(abi.encodeWithSelector(VeTerex.AlreadyCompleted.selector, alice, mediaId));
        nft.completeAndRegisterByExternalId(alice, kind, uri, name);
    }

    function testJoinAndLeaveGroup() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Anime;
        string memory uri = "ipfs://media/anime20.json";
        string memory name = "Anime 20";
        bytes32 mediaId = nft.computeMediaId(kind, uri, name);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VeTerex.NotCompleted.selector, alice, mediaId));
        nft.joinGroup(mediaId);

        vm.prank(backend);
        nft.completeAndRegisterByExternalId(alice, kind, uri, name);

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
        string memory uri = "ipfs://media/deadpool-1.json";
        string memory name = "Deadpool 1";
        bytes32 mediaId = nft.computeMediaId(kind, uri, name);

        vm.prank(backend);
        uint256 tokenId = nft.completeAndRegisterByExternalId(alice, kind, uri, name);

        vm.prank(alice);
        nft.joinGroup(mediaId);

        vm.prank(alice);
        nft.burn(tokenId);

        assertEq(nft.completionTokenId(alice, mediaId), 0);
        assertEq(nft.groupMemberCount(mediaId), 0);
        assertFalse(nft.isGroupMember(mediaId, alice));
    }

    function testGetSimilarsReturnsOtherCompleters() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Show;
        string memory uri = "ipfs://media/breaking-bad.json";
        string memory name = "Breaking Bad";

        vm.prank(backend);
        uint256 aliceTokenId = nft.completeAndRegisterByExternalId(alice, kind, uri, name);

        vm.prank(backend);
        uint256 bobTokenId = nft.completeAndRegisterByExternalId(bob, kind, uri, name);

        uint256[] memory aliceNfts = new uint256[](1);
        aliceNfts[0] = aliceTokenId;
        address[] memory aliceSimilars = nft.getsimilars(alice, aliceNfts);
        assertEq(aliceSimilars.length, 1);
        assertEq(aliceSimilars[0], bob);

        uint256[] memory bobNfts = new uint256[](1);
        bobNfts[0] = bobTokenId;
        address[] memory bobSimilars = nft.getsimilars(bob, bobNfts);
        assertEq(bobSimilars.length, 1);
        assertEq(bobSimilars[0], alice);

        vm.expectRevert(abi.encodeWithSelector(VeTerex.NotTokenOwner.selector, alice, bobTokenId));
        uint256[] memory wrongNfts = new uint256[](1);
        wrongNfts[0] = bobTokenId;
        nft.getsimilars(alice, wrongNfts);
    }

    function testGetSimilarsUpdatesAfterBurn() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Anime;
        string memory uri = "ipfs://media/burn-similars.json";
        string memory name = "Burn Similars";

        vm.prank(backend);
        uint256 aliceTokenId = nft.completeAndRegisterByExternalId(alice, kind, uri, name);

        vm.prank(backend);
        uint256 bobTokenId = nft.completeAndRegisterByExternalId(bob, kind, uri, name);

        vm.prank(bob);
        nft.burn(bobTokenId);

        uint256[] memory aliceNfts = new uint256[](1);
        aliceNfts[0] = aliceTokenId;
        address[] memory aliceSimilars = nft.getsimilars(alice, aliceNfts);
        assertEq(aliceSimilars.length, 0);
    }

    function testGetSimilarsAcrossMultipleNftsIsUnionAndUnique() public {
        VeTerex.MediaKind kindA = VeTerex.MediaKind.Book;
        VeTerex.MediaKind kindB = VeTerex.MediaKind.Movie;
        string memory uriA = "ipfs://media/a.json";
        string memory uriB = "ipfs://media/b.json";
        string memory nameA = "A";
        string memory nameB = "B";

        vm.prank(backend);
        uint256 aliceA = nft.completeAndRegisterByExternalId(alice, kindA, uriA, nameA);
        vm.prank(backend);
        uint256 aliceB = nft.completeAndRegisterByExternalId(alice, kindB, uriB, nameB);

        vm.prank(backend);
        nft.completeAndRegisterByExternalId(bob, kindA, uriA, nameA);
        vm.prank(backend);
        nft.completeAndRegisterByExternalId(bob, kindB, uriB, nameB);

        address charlie = address(0xC0FFEE);
        vm.prank(backend);
        nft.completeAndRegisterByExternalId(charlie, kindB, uriB, nameB);

        uint256[] memory aliceNfts = new uint256[](2);
        aliceNfts[0] = aliceA;
        aliceNfts[1] = aliceB;

        address[] memory similars = nft.getsimilars(alice, aliceNfts);
        assertEq(similars.length, 2);
        assertTrue((similars[0] == bob && similars[1] == charlie) || (similars[0] == charlie && similars[1] == bob));
    }

    function testNonTransferableRevertsOnTransferAndApproval() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Movie;
        string memory uri = "ipfs://media/fight-club.json";
        string memory name = "Fight Club";

        vm.prank(backend);
        uint256 tokenId = nft.completeAndRegisterByExternalId(alice, kind, uri, name);

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
        string memory uri = "";
        string memory name = "Book 123";

        vm.prank(backend);
        uint256 tokenId = nft.completeAndRegisterByExternalId(alice, kind, uri, name);

        string memory tokenUri = nft.tokenURI(tokenId);
        assertTrue(bytes(tokenUri).length > bytes("ipfs://base/").length);
        assertTrue(_startsWith(tokenUri, "ipfs://base/"));
    }

    function testInitializeCannotBeCalledTwice() public {
        vm.prank(owner);
        vm.expectRevert();
        nft.initialize("VeTerex", "VTRX", owner, "ipfs://base/", backend);
    }

    function testUpgradeKeepsState() public {
        VeTerex.MediaKind kind = VeTerex.MediaKind.Book;
        string memory uri = "ipfs://media/u.json";
        string memory name = "U";
        bytes32 mediaId = nft.computeMediaId(kind, uri, name);

        vm.prank(backend);
        uint256 tokenId = nft.completeAndRegisterByExternalId(alice, kind, uri, name);

        VeTerexV2 implV2 = new VeTerexV2();

        vm.prank(owner);
        nft.upgradeTo(address(implV2));

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
        nft.upgradeTo(address(implV2));
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
