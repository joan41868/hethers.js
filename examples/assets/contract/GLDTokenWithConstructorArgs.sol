// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GLDTokenWithConstructorArgs is ERC20 {
    event Mint(address addr, uint256 amount);
    uint internal counter = 1;

    constructor(uint256 _amt) ERC20("Gold", "GLD") {
        emit Mint(msg.sender, _amt);
        _mint(msg.sender, _amt);
    }

    function mint(uint256 amount) public {
        emit Mint(msg.sender, amount);
        _mint(msg.sender, amount);
    }

    function getInternalCounter() public view returns(uint) {
        return counter;
    }
}