// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract HeightsToken {
    string public name = "Heights Token";
    string public symbol = "HTK";
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balances;

    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply;
        owner = msg.sender;
        balances[msg.sender] = _initialSupply;
    }

    function transfer(address _to, uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Not enough tokens");
        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
    }

    function balanceOf(address _account) public view returns (uint256) {
        return balances[_account];
    }
}
