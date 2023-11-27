// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import 'hardhat/console.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import 'erc-payable-token/contracts/token/ERC1363/IERC1363.sol';
import 'erc-payable-token/contracts/token/ERC1363/IERC1363Receiver.sol';

contract OneMilNftPixels is ERC721, Ownable, IERC1363Receiver {
    constructor() ERC721('OneMilNftPixels', 'NFT1MPX') Ownable() {
        // Additional constructor logic if needed
    }
    uint256 public minPriceIncrement;
    uint256 public updatePrice;
    uint256 public compensation;

    /**
     * @dev Compensations paid to pixels' former owners, when they are bought over.
     * Compensations are withdrawn from the accepted token OneMilNftPixels balance
     */
    mapping(address => uint256) public compensationBalances;
    struct Pixel {
        bytes3 colour;
        uint256 price;
    }
    Pixel[1_000_000] public pixels;

    /**
     * @dev The ERC1363 token accepted
     */
    IERC1363 public acceptedToken;

    /**
     * @dev Emitted when the owner of a pixel updates it
     */
   event Update(uint24 indexed tokenId);

    /**
     * @dev Emitted when the contract owner performs admin
     */
    event OwnerAdmin();

    /**
     * @dev Emitted when the `sender` withdraws compensation
     */
    event WithdrawCompensation(address indexed to, uint256 amount);

    /**
     * @dev Emitted when `amount` tokens are moved from one account (`sender`) to
     * this by operator (`operator`) using {transferAndCall} or {transferFromAndCall}.
     */
    event TokensReceived(
        address indexed operator,
        address indexed sender,
        uint256 amount,
        bytes data
    );

    /**
     * @dev Emitted when the allowance of this for a `sender` is set by
     * a call to {approveAndCall}. `amount` is the new allowance.
     */
    event TokensApproved(address indexed sender, uint256 amount, bytes data);

    modifier acceptedTokenOnly() {
        require(
            _msgSender() == address(acceptedToken),
            'ERC1363Payable: accepts purchases in Lunas only'
        );
        _;
    }

    constructor(IERC1363 _acceptedToken)
        /* TODO (5) call contructors of inherited contracts */
    {
        require(
            address(_acceptedToken) != address(0),
            'ERC1363Payable: acceptedToken is zero address'
        );
        require(
            _acceptedToken.supportsInterface(type(IERC1363).interfaceId),
            "Your token doesn't support ERC1363"
        );
        acceptedToken = _acceptedToken;

        minPriceIncrement = 10;
        updatePrice = 10;
        compensation = 10;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721)
        returns (bool)
    {
        return
            interfaceId == type(IERC1363Receiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Allow withdrawal of compensations to a specified address.
     * If the balance of the NFT contract is 0 or msg.sender has 0 compensation balance, call will revert.
     */
    function withdrawCompensation(IERC1363Receiver to) public {
        uint256 balance = IERC1363(acceptedToken).balanceOf(address(this));
        uint256 compensationBalance = compensationBalances[_msgSender()];

        // check if there are sufficient funds in the compensation balance
        require(balance >= compensationBalance, 'Insufficient balance!');
        require(compensationBalance > 0, 'Insufficient compensation balance!');

        // transfer msg.sender's compensation LUNAs to the address specified in `to`. If caller is EOA, call ERC20 transfer()
        bool withdrawalSuccess = (_msgSender() == tx.origin)
            ? acceptedToken.transfer(address(to), compensationBalance) // EOA
            : acceptedToken.transferAndCall(address(to), compensationBalance); // SC
        require(withdrawalSuccess, 'withdraw failed');
        // SECURITY HINT: modify this
        compensationBalances[_msgSender()] = 0;

        emit WithdrawCompensation(address(to), compensationBalance);
    }

    /**
     * @dev Purchase pixel and update its colour.
     * If pixel is not currently owned, NFT is minted.
     * If pixel is already owned, NFT is transferred.
     *
     * - `id` is the offset of the pixel, where `offset = y * width + x`
     * - `colour` is an RGB value in hexadecimal,
     *   e.g. `0xFF00FF` is `rgb(255, 0, 255)` (purple)
     */
    /* TODO (6) buy function name and params */
        public acceptedTokenOnly
    {
        Pixel storage pixel = pixels[id];
        require(
            /* TODO (8) condition for require */,
            'should increment on current price'
        );
        /* TODO (9) assign value(s) to pixel */
        if (ERC721._exists(id)) {
            // purchasing an pixel already in existence

            // compensate the previous owner of the ERC721 token with a small amount of LUNAs
            compensationBalances[ERC721.ownerOf(id)] += compensation;

            ERC721._transfer(ERC721.ownerOf(id), sender, id);
        } else {
            // purchasing a previously untouched pixel
            ERC721._safeMint(sender, id);
        }
    }

    /**
     * @dev Purchase pixel and update its colour
     *
     * - `id` is the offset of the pixel, where `offset = y * width + x`.
     *   Assuming 1e6 pixels in a square, this is `offset = y * 1000 + x`.
     * - `colour` is an RGB value in hexadecimal,
     *   e.g. `0xFF00FF` is `rgb(255, 0, 255)` (purple).
     */
    /* TODO (10) update function name and params */
        public acceptedTokenOnly
    {
        require(
            /* TODO (12) condition for require */,
            'should pay update price'
        );
        require(
            ERC721.ownerOf(id) == sender,
            'only owner allowed'
        );
        Pixel storage pixel = pixels[id];
        /* TODO (13) assign value(s) to pixel */

        /* TODO (14) log an event */
    }

    function ownerAdmin(
        bool withdraw,
        uint256 minPriceIncrementNew,
        uint256 updatePriceNew
    ) public onlyOwner {
        minPriceIncrement = minPriceIncrementNew;
        updatePrice = updatePriceNew;
        if (withdraw) {
            // check Luna balance of the current NFT contract
            uint256 balance = IERC1363(acceptedToken).balanceOf(address(this));
            if (balance > 0) {
                // transfer all Lunas to the NFT owner's address
                bool success = IERC1363(acceptedToken).transfer(
                    Ownable(this).owner(),
                    balance
                );
                require(success, 'send failed');
            }
        }
        emit OwnerAdmin();
    }

    /**
     * @notice Handle the receipt of ERC1363 tokens
     * @dev Any ERC1363 smart contract calls this function on the recipient
     * after a `transfer` or a `transferFrom`. This function MAY throw to revert and reject the
     * transfer. Return of other than the magic value MUST result in the
     * transaction being reverted.
     * Note: the token contract address is always the message sender.
     * @param operator address The address which called `transferAndCall` or `transferFromAndCall` function
     * @param sender address The address which are token transferred from
     * @param amount uint256 The amount of tokens transferred
     * @param data bytes Additional data with no specified format
     * @return `bytes4(keccak256("onTransferReceived(address,address,uint256,bytes)"))`
     *  unless throwing
     */
    function onTransferReceived(
        address operator,
        address sender,
        uint256 amount,
        bytes calldata data
    ) external override(IERC1363Receiver) acceptedTokenOnly returns (bytes4) {
        require(amount > 0, 'Stop fooling me! Are you going to pay?');

        emit TokensReceived(operator, sender, amount, data);

        _transferReceived(sender, amount, data);

        return IERC1363Receiver(this).onTransferReceived.selector;
    }

    /**
     * @dev Called after validating a `onTransferReceived`.
     * param _sender The address which are token transferred from
     * param _amount The amount of tokens transferred
     * param _data Additional data with no specified format
     */
    function _transferReceived(
        address /* _sender */,
        uint256 /* _amount */,
        bytes memory _data
    ) private {
        (
            bytes4 selector,
            address newOwner,
            uint24 pixelId,
            bytes3 colour,
            uint256 amount
        ) = abi.decode(_data, (bytes4, address, uint24, bytes3, uint256));
        // SECURITY HINT: modify this
        bytes memory callData = abi.encodeWithSelector(
            selector,
            newOwner,
            pixelId,
            colour,
            amount
        );
        (bool success, ) = address(this).delegatecall(callData);
        require(success, 'Function call failed');
    }

    receive() external payable {
        revert('Accepts purchases in Luna tokens only');
    }

    fallback() external {
        revert('Unknown function call');
    }
}
