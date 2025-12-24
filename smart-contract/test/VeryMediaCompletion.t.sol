// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";

import {VeTerex} from "../src/trex.sol";

contract VeryMediaCompletionTest is Test {
    VeTerex internal nft;

    address internal owner = address(0xABCD);
    address internal registrar = address(0xBEEF);
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        nft = new VeTerex("VeTerex", "VTRX", owner, "ipfs://base/");
    }

    function testRegisterAndCompleteMintsAndJoinsGroup() public {
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Book, "isbn:9780143127741");

        vm.prank(owner);
        nft.registerMedia(mediaId, VeTerex.MediaKind.Book, "ipfs://media/book1.json");

        vm.prank(alice);
        uint256 tokenId = nft.complete(mediaId);

        assertEq(nft.ownerOf(tokenId), alice);
        assertEq(nft.completionTokenId(alice, mediaId), tokenId);
        assertEq(nft.tokenMediaId(tokenId), mediaId);
        assertEq(nft.groupMemberCount(mediaId), 0);
        assertFalse(nft.isGroupMember(mediaId, alice));
        assertEq(nft.tokenURI(tokenId), "ipfs://media/book1.json");

        vm.prank(alice);
        nft.joinGroup(mediaId);
        assertEq(nft.groupMemberCount(mediaId), 1);
        assertEq(nft.groupMemberAt(mediaId, 0), alice);
        assertTrue(nft.isGroupMember(mediaId, alice));
    }

    function testCompleteMintsIfUnregisteredWithoutRegistering() public {
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Movie, "imdb:tt1375666");

        vm.prank(alice);
        uint256 tokenId = nft.complete(mediaId);

        assertEq(nft.ownerOf(tokenId), alice);
        (bool exists,,) = nft.mediaInfo(mediaId);
        assertFalse(exists);
    }

    function testCompleteRevertsIfAlreadyCompleted() public {
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Manga, "mal:2");

        vm.prank(owner);
        nft.registerMedia(mediaId, VeTerex.MediaKind.Manga, "ipfs://media/manga2.json");

        vm.prank(alice);
        nft.complete(mediaId);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VeTerex.AlreadyCompleted.selector, alice, mediaId));
        nft.complete(mediaId);
    }

    function testJoinAndLeaveGroup() public {
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Anime, "mal:20");

        vm.prank(owner);
        nft.registerMedia(mediaId, VeTerex.MediaKind.Anime, "");

        vm.prank(alice);
        nft.complete(mediaId);

        vm.prank(alice);
        nft.joinGroup(mediaId);

        vm.prank(alice);
        nft.leaveGroup(mediaId);
        assertEq(nft.groupMemberCount(mediaId), 0);
        assertFalse(nft.isGroupMember(mediaId, alice));

        vm.prank(alice);
        nft.joinGroup(mediaId);
        assertEq(nft.groupMemberCount(mediaId), 1);
        assertTrue(nft.isGroupMember(mediaId, alice));
    }

    function testJoinGroupRevertsIfNotCompleted() public {
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Show, "tvdb:121361");

        vm.prank(owner);
        nft.registerMedia(mediaId, VeTerex.MediaKind.Show, "");

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(VeTerex.NotCompleted.selector, bob, mediaId));
        nft.joinGroup(mediaId);
    }

    function testBurnClearsCompletionAndRemovesFromGroup() public {
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Comic, "marvel:deadpool-1");

        vm.prank(owner);
        nft.registerMedia(mediaId, VeTerex.MediaKind.Comic, "");

        vm.prank(alice);
        uint256 tokenId = nft.complete(mediaId);

        vm.prank(alice);
        nft.joinGroup(mediaId);

        vm.prank(alice);
        nft.burn(tokenId);

        assertEq(nft.completionTokenId(alice, mediaId), 0);
        assertEq(nft.groupMemberCount(mediaId), 0);
        assertFalse(nft.isGroupMember(mediaId, alice));
    }

    function testNonTransferableRevertsOnTransferAndApproval() public {
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Movie, "imdb:tt0137523");

        vm.prank(owner);
        nft.registerMedia(mediaId, VeTerex.MediaKind.Movie, "");

        vm.prank(alice);
        uint256 tokenId = nft.complete(mediaId);

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
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Book, "isbn:123");

        vm.prank(owner);
        nft.registerMedia(mediaId, VeTerex.MediaKind.Book, "");

        vm.prank(alice);
        uint256 tokenId = nft.complete(mediaId);

        string memory uri = nft.tokenURI(tokenId);
        assertTrue(bytes(uri).length > bytes("ipfs://base/").length);
        assertTrue(_startsWith(uri, "ipfs://base/"));
    }

    function testRegistrarCanRegisterMedia() public {
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Book, "isbn:reg");

        vm.prank(owner);
        nft.setRegistrar(registrar, true);

        vm.prank(registrar);
        nft.registerMedia(mediaId, VeTerex.MediaKind.Book, "");

        (bool exists,,) = nft.mediaInfo(mediaId);
        assertTrue(exists);
    }

    function testNonRegistrarCannotRegisterMedia() public {
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Book, "isbn:nope");

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VeTerex.NotRegistrar.selector, alice));
        nft.registerMedia(mediaId, VeTerex.MediaKind.Book, "");
    }

    function testCanTextRequiresSharedCompletion() public {
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Movie, "imdb:dm");

        vm.prank(owner);
        nft.registerMedia(mediaId, VeTerex.MediaKind.Movie, "");

        vm.prank(alice);
        nft.complete(mediaId);

        assertFalse(nft.canText(alice, bob, mediaId));

        vm.prank(bob);
        nft.complete(mediaId);

        assertTrue(nft.canText(alice, bob, mediaId));
    }

    function testCanJoinGroupTracksMembership() public {
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Show, "tvdb:cangroup");

        vm.prank(owner);
        nft.registerMedia(mediaId, VeTerex.MediaKind.Show, "");

        assertFalse(nft.canJoinGroup(alice, mediaId));

        vm.prank(alice);
        nft.complete(mediaId);

        assertTrue(nft.canJoinGroup(alice, mediaId));

        vm.prank(alice);
        nft.joinGroup(mediaId);

        assertFalse(nft.canJoinGroup(alice, mediaId));
    }

    function testUserTokenIdsReturnsMintedTokens() public {
        bytes32 mediaId = nft.computeMediaId(VeTerex.MediaKind.Book, "isbn:tokens");

        vm.prank(owner);
        nft.registerMedia(mediaId, VeTerex.MediaKind.Book, "");

        vm.prank(alice);
        uint256 tokenId = nft.complete(mediaId);

        uint256[] memory ids = nft.userTokenIds(alice);
        assertEq(ids.length, 1);
        assertEq(ids[0], tokenId);
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
