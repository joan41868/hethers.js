pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GLDToken is ERC20 {
    event Mint(address addr, uint256 amount);
    constructor() ERC20("Gold", "GLD") {
        emit Mint(msg.sender, 10000);
        _mint(msg.sender, 10000);
    }

    function mint(uint256 amount) public{
        emit Mint(msg.sender, amount);
        _mint(msg.sender, amount);
    }
}
