// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract VeTerex is Initializable, ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    using Strings for uint256;

    enum MediaKind {
        Unknown,
        Book,
        Movie,
        Anime,
        Comic,
        Manga,
        Show
    }

    error MediaAlreadyRegistered(bytes32 mediaId);
    error MediaNotRegistered(bytes32 mediaId);
    error AlreadyCompleted(address user, bytes32 mediaId);
    error NotCompleted(address user, bytes32 mediaId);
    error NotGroupMember(address user, bytes32 mediaId);
    error NotTokenOwner(address user, uint256 tokenId);
    error NotRegistrar(address caller);
    error NotBackend(address caller);
    error NonTransferable();

    event MediaRegistered(bytes32 indexed mediaId, MediaKind indexed kind, string uri);
    event MediaURISet(bytes32 indexed mediaId, string uri);
    event MediaCompleted(address indexed user, bytes32 indexed mediaId, uint256 indexed tokenId);
    event GroupJoined(address indexed user, bytes32 indexed mediaId);
    event GroupLeft(address indexed user, bytes32 indexed mediaId);
    event BaseURISet(string baseURI);
    event RegistrarSet(address indexed registrar, bool allowed);
    event MediaKindSet(bytes32 indexed mediaId, MediaKind indexed kind);

    struct MediaItem {
        MediaKind kind;
        bool exists;
        string uri;
        string name;
    }

    address public backend;

    uint256 public nextTokenId;

    string private _baseTokenURI;

    mapping(bytes32 mediaId => MediaItem) private _media;
    mapping(uint256 tokenId => bytes32 mediaId) public tokenMediaId;
    mapping(address user => mapping(bytes32 mediaId => uint256 tokenId)) public completionTokenId;

    mapping(address user => uint256[] tokenIds) private _userTokenIds;
    mapping(address user => mapping(uint256 tokenId => uint256 indexPlusOne)) private _userTokenIndexPlusOne;

    mapping(bytes32 mediaId => address[] users) private _mediaCompleters;
    mapping(bytes32 mediaId => mapping(address user => uint256 indexPlusOne)) private _mediaCompleterIndexPlusOne;

    mapping(bytes32 mediaId => address[]) private _groupMembers;
    mapping(bytes32 mediaId => mapping(address user => uint256 indexPlusOne)) private _groupIndexPlusOne;
    mapping(address registrar => bool allowed) public isRegistrar;

    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        address initialOwner,
        string memory baseURI_,
        address backend_
    ) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(initialOwner);

        nextTokenId = 1;
        _baseTokenURI = baseURI_;
        backend = backend_;
        emit BaseURISet(baseURI_);
    }

    function computeMediaId(MediaKind kind, string calldata uri, string calldata name) public pure returns (bytes32) {
        return keccak256(abi.encode(kind, uri, name));
    }

    function setRegistrar(address registrar, bool allowed) external onlyOwner {
        isRegistrar[registrar] = allowed;
        emit RegistrarSet(registrar, allowed);
    }

    function setBackend(address backend_) external onlyOwner {
        backend = backend_;
    }

    modifier onlyBackend() {
        if (msg.sender != backend) revert NotBackend(msg.sender);
        _;
    }

    //NFTS FOR COMPLETIONS
    // @dora - first (system didnt any record of dora meaning no nft)
    // @dora - lydia (check if registered), lydia

    /// @notice Backend can register media with a name and URI and mint to a user in one call.
    function completeAndRegisterByExternalId(address to, MediaKind kind, string calldata uri, string calldata name)
        external
        onlyBackend
        returns (uint256 tokenId)
    {
        bytes32 mediaId = computeMediaId(kind, uri, name);
        if (!_media[mediaId].exists) {
            _media[mediaId] = MediaItem({kind: kind, exists: true, uri: uri, name: name});
            emit MediaRegistered(mediaId, kind, uri);
        }
        tokenId = _complete(to, mediaId);
    }

    function setMediaURI(bytes32 mediaId, string calldata uri) external onlyOwner {
        if (!_media[mediaId].exists) revert MediaNotRegistered(mediaId);
        _media[mediaId].uri = uri;
        emit MediaURISet(mediaId, uri);
    }

    function setMediaKind(bytes32 mediaId, MediaKind kind) external onlyOwner {
        if (!_media[mediaId].exists) revert MediaNotRegistered(mediaId);
        _media[mediaId].kind = kind;
        emit MediaKindSet(mediaId, kind);
    }

    function mediaInfo(bytes32 mediaId) external view returns (bool exists, MediaKind kind, string memory uri) {
        MediaItem storage item = _media[mediaId];
        return (item.exists, item.kind, item.uri); //@todo return nft name too
    }

    function _complete(address user, bytes32 mediaId) internal returns (uint256 tokenId) {
        if (completionTokenId[user][mediaId] != 0) revert AlreadyCompleted(user, mediaId);

        tokenId = nextTokenId++;
        tokenMediaId[tokenId] = mediaId;
        completionTokenId[user][mediaId] = tokenId;

        _safeMint(user, tokenId);
        _userTokenIds[user].push(tokenId);
        _userTokenIndexPlusOne[user][tokenId] = _userTokenIds[user].length;
        _addMediaCompleter(user, mediaId);

        emit MediaCompleted(user, mediaId, tokenId);
    }

    function hasCompleted(address user, bytes32 mediaId) external view returns (bool) {
        return completionTokenId[user][mediaId] != 0;
    }

    function userTokenIds(address user) external view returns (uint256[] memory) {
        return _userTokenIds[user];
    }

    function canText(address from, address to, bytes32 mediaId) public view returns (bool) {
        return completionTokenId[from][mediaId] != 0 && completionTokenId[to][mediaId] != 0;
    }

    function canJoinGroup(address user, bytes32 mediaId) external view returns (bool) {
        return completionTokenId[user][mediaId] != 0 && _groupIndexPlusOne[mediaId][user] == 0;
    }

    function joinGroup(bytes32 mediaId) external {
        if (completionTokenId[msg.sender][mediaId] == 0) revert NotCompleted(msg.sender, mediaId);
        _joinGroup(msg.sender, mediaId);
    }

    function leaveGroup(bytes32 mediaId) external {
        uint256 indexPlusOne = _groupIndexPlusOne[mediaId][msg.sender];
        if (indexPlusOne == 0) revert NotGroupMember(msg.sender, mediaId);

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = _groupMembers[mediaId].length - 1;

        if (index != lastIndex) {
            address last = _groupMembers[mediaId][lastIndex];
            _groupMembers[mediaId][index] = last;
            _groupIndexPlusOne[mediaId][last] = index + 1;
        }

        _groupMembers[mediaId].pop();
        delete _groupIndexPlusOne[mediaId][msg.sender];

        emit GroupLeft(msg.sender, mediaId);
    }

    function isGroupMember(bytes32 mediaId, address user) external view returns (bool) {
        return _groupIndexPlusOne[mediaId][user] != 0;
    }

    function groupMemberCount(bytes32 mediaId) external view returns (uint256) {
        return _groupMembers[mediaId].length;
    }

    function groupMemberAt(bytes32 mediaId, uint256 index) external view returns (address) {
        return _groupMembers[mediaId][index];
    }

    function burn(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner(msg.sender, tokenId);
        bytes32 mediaId = tokenMediaId[tokenId];

        delete tokenMediaId[tokenId];
        delete completionTokenId[msg.sender][mediaId];
        _removeUserTokenId(msg.sender, tokenId);
        _removeMediaCompleter(msg.sender, mediaId);
        _removeGroupMember(msg.sender, mediaId);

        _burn(tokenId);
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
        emit BaseURISet(baseURI_);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        bytes32 mediaId = tokenMediaId[tokenId];

        string memory uri = _media[mediaId].uri;
        if (bytes(uri).length != 0) return uri;

        string memory base = _baseURI();
        if (bytes(base).length == 0) return "";
        return string.concat(base, uint256(mediaId).toHexString(32));
    }

    function approve(address, uint256) public pure override {
        revert NonTransferable();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert NonTransferable();
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert NonTransferable();
        return super._update(to, tokenId, auth);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function upgradeTo(address newImplementation) external payable onlyProxy {
        upgradeToAndCall(newImplementation, "");
    }

    function _joinGroup(address user, bytes32 mediaId) internal {
        if (_groupIndexPlusOne[mediaId][user] != 0) return;
        _groupMembers[mediaId].push(user);
        _groupIndexPlusOne[mediaId][user] = _groupMembers[mediaId].length;
        emit GroupJoined(user, mediaId);
    }

    function _removeGroupMember(address user, bytes32 mediaId) internal {
        uint256 indexPlusOne = _groupIndexPlusOne[mediaId][user];
        if (indexPlusOne == 0) return;

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = _groupMembers[mediaId].length - 1;

        if (index != lastIndex) {
            address last = _groupMembers[mediaId][lastIndex];
            _groupMembers[mediaId][index] = last;
            _groupIndexPlusOne[mediaId][last] = index + 1;
        }

        _groupMembers[mediaId].pop();
        delete _groupIndexPlusOne[mediaId][user];

        emit GroupLeft(user, mediaId);
    }

    function _removeUserTokenId(address user, uint256 tokenId) internal {
        uint256 indexPlusOne = _userTokenIndexPlusOne[user][tokenId];
        if (indexPlusOne == 0) return;

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = _userTokenIds[user].length - 1;

        if (index != lastIndex) {
            uint256 last = _userTokenIds[user][lastIndex];
            _userTokenIds[user][index] = last;
            _userTokenIndexPlusOne[user][last] = index + 1;
        }

        _userTokenIds[user].pop();
        delete _userTokenIndexPlusOne[user][tokenId];
    }

    function getusernft(address user) public view returns (uint256[] memory userNfts) {
        return _userTokenIds[user];
    }

    function getsimilars(address user, uint256[] calldata _nft) public view returns (address[] memory commonusers) {
        uint256 max = 0;
        for (uint256 i = 0; i < _nft.length; i++) {
            uint256 tokenId = _nft[i];
            if (ownerOf(tokenId) != user) revert NotTokenOwner(user, tokenId);
            bytes32 mediaId = tokenMediaId[tokenId];
            max += _mediaCompleters[mediaId].length;
        }

        if (max == 0) return new address[](0);

        address[] memory tmp = new address[](max);
        uint256 out = 0;

        for (uint256 i = 0; i < _nft.length; i++) {
            bytes32 mediaId = tokenMediaId[_nft[i]];
            address[] storage completers = _mediaCompleters[mediaId];

            for (uint256 j = 0; j < completers.length; j++) {
                address candidate = completers[j];
                if (candidate == user) continue;

                bool seen = false;
                for (uint256 k = 0; k < out; k++) {
                    if (tmp[k] == candidate) {
                        seen = true;
                        break;
                    }
                }

                if (!seen) {
                    tmp[out] = candidate;
                    out++;
                }
            }
        }

        commonusers = new address[](out);
        for (uint256 i = 0; i < out; i++) {
            commonusers[i] = tmp[i];
        }
    }

    function _addMediaCompleter(address user, bytes32 mediaId) internal {
        if (_mediaCompleterIndexPlusOne[mediaId][user] != 0) return;
        _mediaCompleters[mediaId].push(user);
        _mediaCompleterIndexPlusOne[mediaId][user] = _mediaCompleters[mediaId].length;
    }

    function _removeMediaCompleter(address user, bytes32 mediaId) internal {
        uint256 indexPlusOne = _mediaCompleterIndexPlusOne[mediaId][user];
        if (indexPlusOne == 0) return;

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = _mediaCompleters[mediaId].length - 1;

        if (index != lastIndex) {
            address last = _mediaCompleters[mediaId][lastIndex];
            _mediaCompleters[mediaId][index] = last;
            _mediaCompleterIndexPlusOne[mediaId][last] = index + 1;
        }

        _mediaCompleters[mediaId].pop();
        delete _mediaCompleterIndexPlusOne[mediaId][user];
    }
}
