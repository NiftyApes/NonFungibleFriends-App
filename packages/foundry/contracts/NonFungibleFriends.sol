// SPDX-License-Identifier: MIT

pragma solidity >=0.8.2 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract NonFungibleFriends is Ownable {
    address public protocolFeeDestination;
    uint256 public protocolFeePercent;
    uint256 public subjectFeePercent;

    event Trade(
        address trader,
        address collectionId,
        bool isBuy,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 protocolEthAmount,
        uint256 subjectEthAmount,
        uint256 mintedSupply,
        uint256 totalSupply
    );

    // Mapping from collection ID to token ID to owner address
    mapping(address => mapping(uint256 => address)) public owners;

    // Mapping collection ID to owner address to token count
    mapping(address => mapping(address => uint256)) public balances;

    // Mapping collection ID to minted supply, supply with burns decremented
    mapping(address => uint256) public mintedSupply;

    // Mapping collection ID to total supply, never decremented, tokenIds tracked with this value
    mapping(address => uint256) public totalSupply;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setFeeDestination(address _feeDestination) public onlyOwner {
        protocolFeeDestination = _feeDestination;
    }

    function setProtocolFeePercent(uint256 _feePercent) public onlyOwner {
        protocolFeePercent = _feePercent;
    }

    function setSubjectFeePercent(uint256 _feePercent) public onlyOwner {
        subjectFeePercent = _feePercent;
    }

    function getPrice(
        uint256 supply,
        uint256 amount
    ) public pure returns (uint256) {
        uint256 sum1 = supply == 0
            ? 0
            : ((supply - 1) * (supply) * (2 * (supply - 1) + 1)) / 6;
        uint256 sum2 = supply == 0 && amount == 1
            ? 0
            : ((supply - 1 + amount) *
                (supply + amount) *
                (2 * (supply - 1 + amount) + 1)) / 6;
        uint256 summation = sum2 - sum1;
        return (summation * 1 ether) / 16000;
    }

    function getMintPrice(
        address collectionId,
        uint256 amount
    ) public view returns (uint256) {
        return getPrice(mintedSupply[collectionId], amount);
    }

    function getBurnPrice(
        address collectionId,
        uint256 amount
    ) public view returns (uint256) {
        return getPrice(mintedSupply[collectionId] - amount, amount);
    }

    function getMintPriceAfterFee(
        address collectionId,
        uint256 amount
    ) public view returns (uint256) {
        uint256 price = getMintPrice(collectionId, amount);
        uint256 protocolFee = (price * protocolFeePercent) / 1 ether;
        uint256 subjectFee = (price * subjectFeePercent) / 1 ether;
        return price + protocolFee + subjectFee;
    }

    function getBurnPriceAfterFee(
        address collectionId,
        uint256 amount
    ) public view returns (uint256) {
        uint256 price = getBurnPrice(collectionId, amount);
        uint256 protocolFee = (price * protocolFeePercent) / 1 ether;
        uint256 subjectFee = (price * subjectFeePercent) / 1 ether;
        return price - protocolFee - subjectFee;
    }

    function getTransferFee(
        address collectionId,
        uint256 amount
    ) public view returns (uint256) {
        uint256 price = getMintPrice(collectionId, amount);
        uint256 protocolFee = (price * protocolFeePercent) / 1 ether;
        uint256 subjectFee = (price * subjectFeePercent) / 1 ether;
        return protocolFee + subjectFee;
    }

    // Nice to haves:
    // 1. Metadata URI
    function mintToken(address collectionId, uint256 amount) public payable {
        uint256 supply = mintedSupply[collectionId];
        uint256 tSupply = totalSupply[collectionId];
        require(
            supply > 0 || collectionId == msg.sender,
            "Only the tokens' subject can buy the first token"
        );
        uint256 price = getPrice(supply, amount);
        uint256 protocolFee = (price * protocolFeePercent) / 1 ether;
        uint256 subjectFee = (price * subjectFeePercent) / 1 ether;
        require(
            msg.value >= price + protocolFee + subjectFee,
            "Insufficient payment"
        );

        for (uint i; i < amount; i++) {
            owners[collectionId][tSupply + i] = msg.sender;
        }

        balances[collectionId][msg.sender] += amount;
        mintedSupply[collectionId] += amount;
        totalSupply[collectionId] += amount;

        emit Trade(
            msg.sender,
            collectionId,
            true,
            amount,
            price,
            protocolFee,
            subjectFee,
            supply + amount,
            tSupply + amount
        );
        (bool success1, ) = protocolFeeDestination.call{value: protocolFee}("");
        (bool success2, ) = collectionId.call{value: subjectFee}("");
        require(success1 && success2, "Unable to send funds");
    }

    function burnTokens(
        address collectionId,
        uint256[] calldata tokenIds
    ) public payable {
        uint256 supply = mintedSupply[collectionId];
        uint256 tSupply = totalSupply[collectionId];
        uint256 amount = tokenIds.length;
        require(supply > amount, "Cannot burn the last token");
        uint256 price = getPrice(supply - amount, amount);
        uint256 protocolFee = (price * protocolFeePercent) / 1 ether;
        uint256 subjectFee = (price * subjectFeePercent) / 1 ether;

        for (uint i; i < amount; i++) {
            require(
                owners[collectionId][tokenIds[i]] == msg.sender,
                "Msg.sender not tokenId owner"
            );
            owners[collectionId][tokenIds[i]] = address(0);
        }

        balances[collectionId][msg.sender] -= amount;
        mintedSupply[collectionId] -= amount;

        emit Trade(
            msg.sender,
            collectionId,
            false,
            amount,
            price,
            protocolFee,
            subjectFee,
            supply - amount,
            tSupply - amount
        );
        (bool success1, ) = msg.sender.call{
            value: price - protocolFee - subjectFee
        }("");
        (bool success2, ) = protocolFeeDestination.call{value: protocolFee}("");
        (bool success3, ) = collectionId.call{value: subjectFee}("");
        require(success1 && success2 && success3, "Unable to send funds");
    }

    function transferTokens(
        address collectionId,
        uint256[] calldata tokenIds,
        address to
    ) public payable {
        uint256 supply = mintedSupply[collectionId];
        uint256 tSupply = totalSupply[collectionId];
        uint256 amount = tokenIds.length;
        uint256 price = getPrice(mintedSupply[collectionId], amount);
        uint256 protocolFee = (price * protocolFeePercent) / 1 ether;
        uint256 subjectFee = (price * subjectFeePercent) / 1 ether;
        require(msg.value >= protocolFee + subjectFee, "Insufficient payment");

        for (uint i; i < amount; i++) {
            require(
                owners[collectionId][tokenIds[i]] == msg.sender,
                "Msg.sender not tokenId owner"
            );
            owners[collectionId][tokenIds[i]] = to;
        }

        balances[collectionId][msg.sender] += amount;
        balances[collectionId][to] += amount;

        emit Trade(
            to,
            collectionId,
            false,
            amount,
            price,
            protocolFee,
            subjectFee,
            supply,
            tSupply
        );
        (bool success1, ) = protocolFeeDestination.call{value: protocolFee}("");
        (bool success2, ) = collectionId.call{value: subjectFee}("");
        require(success1 && success2, "Unable to send funds");
    }
}
