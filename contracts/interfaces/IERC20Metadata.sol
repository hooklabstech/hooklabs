// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Read-only ERC-20 token data used during token inspection.
/// @dev An interface only: it is not a token implementation or a deployable contract.
interface IERC20Metadata {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}
