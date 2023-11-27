const { expect } = require('chai');
const { ethers } = require('hardhat');

async function deployContract(contractName, ...params) {
  const contractFactory = await ethers.getContractFactory(contractName);
  const smartContract = await contractFactory.deploy(...params);
  await smartContract.deployed();
  return smartContract;
}

describe('OneMilNftPixels - buy pixel - failure', () => {
  let deployAcct;
  let buyer1Acct;
  // accepted ERC1363 compliant token
  let lunaToken;
  // not accepted ERC1363 compliant token
  let meowToken;
  // not accepted ERC20 token
  let purrToken;
  let oneMilNftPixels;

  const pixel1001Id = 1001;
  const pixelDefaultColour = '0xff00ff';
  const tokensTotalSupply = 1e7;
  const transferAndCallSignature = 'transferAndCall(address,uint256,bytes)';

  before(async () => {
    [deployAcct, buyer1Acct] = await ethers.getSigners();
    lunaToken = await deployContract('LunaToken', tokensTotalSupply);
    oneMilNftPixels = await deployContract(
      'OneMilNftPixels',
      lunaToken.address,
    );
    meowToken = await deployContract('MeowToken', tokensTotalSupply);
    purrToken = await deployContract('PurrToken', tokensTotalSupply);
  });

  it('should not allow to call buy function directly', async () => {
    const tx = oneMilNftPixels
      .connect(deployAcct)
      .buy(deployAcct.address, pixel1001Id, pixelDefaultColour, 99)
      .then((txResponse) => txResponse.wait());
    await expect(tx).to.be.revertedWith(
      'ERC1363Payable: accepts purchases in Lunas only',
    );
  });

  it('should not allow to buy pixels with any other ERC1363 compliant token other than Luna Token, namely with MeowToken', async () => {
    const tokenAmount = 10;
    const sigHash = oneMilNftPixels.interface.getSighash('buy');
    const callData = ethers.utils.defaultAbiCoder.encode(
      ['bytes4', 'address', 'uint24', 'bytes3', 'uint256'],
      [
        sigHash,
        deployAcct.address,
        pixel1001Id,
        pixelDefaultColour,
        tokenAmount,
      ],
    );

    const tx = meowToken[transferAndCallSignature](
      oneMilNftPixels.address,
      tokenAmount,
      callData,
    );
    await expect(tx).to.be.revertedWith(
      'ERC1363Payable: accepts purchases in Lunas only',
    );
  });

  it('should not allow to buy pixels with any other ERC20 compliant token other than Luna Token, namely with PurrToken', async () => {
    const tokenAmount = 10;
    const sigHash = oneMilNftPixels.interface.getSighash('buy');
    const callData = ethers.utils.defaultAbiCoder.encode(
      ['bytes4', 'address', 'uint24', 'bytes3', 'uint256'],
      [
        sigHash,
        deployAcct.address,
        pixel1001Id,
        pixelDefaultColour,
        tokenAmount,
      ],
    );
    // adding `transferAndCall` function to ERC20 s/c interface
    const fakePurrWithTransferAndCall = new ethers.Contract(
      purrToken.address,
      [
        ...purrToken.interface.fragments,
        `function ${transferAndCallSignature}`,
      ],
      deployAcct,
    );
    // trying to call `transferAndCall` on deployed ERC20 contract
    // this tx results in a call of `fallback` function on the Purr token
    const tx = fakePurrWithTransferAndCall[transferAndCallSignature](
      oneMilNftPixels.address,
      tokenAmount,
      callData,
    );
    await expect(tx).to.be.revertedWith('Unknown function call');
  });

  it('should not allow anyone to purchase pixel with zero (0) Lunas', async () => {
    const tokenAmount = 0;
    const sigHash = oneMilNftPixels.interface.getSighash('buy');
    const callData = ethers.utils.defaultAbiCoder.encode(
      ['bytes4', 'address', 'uint24', 'bytes3', 'uint256'],
      [
        sigHash,
        deployAcct.address,
        pixel1001Id,
        pixelDefaultColour,
        tokenAmount,
      ],
    );
    const tx = lunaToken[transferAndCallSignature](
      oneMilNftPixels.address,
      tokenAmount,
      callData,
    );
    await expect(tx).to.be.revertedWith(
      'Stop fooling me! Are you going to pay?',
    );
  });

  it('should not allow anyone to purchase pixels if they do not have Lunas', async () => {
    const tokenAmount = 100;
    const sigHash = oneMilNftPixels.interface.getSighash('buy');
    const callData = ethers.utils.defaultAbiCoder.encode(
      ['bytes4', 'address', 'uint24', 'bytes3', 'uint256'],
      [
        sigHash,
        deployAcct.address,
        pixel1001Id,
        pixelDefaultColour,
        tokenAmount,
      ],
    );
    const tx = lunaToken
      .connect(buyer1Acct)
      [transferAndCallSignature](
        oneMilNftPixels.address,
        tokenAmount,
        callData,
      );
    await expect(tx).to.be.revertedWith(
      'ERC20: transfer amount exceeds balance',
    );
  });

  it('should not allow anyone to purchase pixel with low payment', async () => {
    const tokenAmount = 1;
    const sigHash = oneMilNftPixels.interface.getSighash('buy');
    const callData = ethers.utils.defaultAbiCoder.encode(
      ['bytes4', 'address', 'uint24', 'bytes3', 'uint256'],
      [
        sigHash,
        deployAcct.address,
        pixel1001Id,
        pixelDefaultColour,
        tokenAmount,
      ],
    );
    const tx = lunaToken[transferAndCallSignature](
      oneMilNftPixels.address,
      tokenAmount,
      callData,
    );
    await expect(tx).to.be.reverted;
  });

  it('Luna token balance should not change after failed buy attempt', async () => {
    expect(await lunaToken.balanceOf(deployAcct.address)).to.equal(
      tokensTotalSupply,
    );
    expect(await lunaToken.balanceOf(oneMilNftPixels.address)).to.equal(0);
  });

  it('Meow token balance should not change after failed buy attempt', async () => {
    /* __________ */
    /* __________ */
  });

  it('Purr token balance should not change after failed buy attempt', async () => {
    expect(await purrToken.balanceOf(deployAcct.address)).to.equal(
      tokensTotalSupply,
    );
    expect(await purrToken.balanceOf(oneMilNftPixels.address)).to.equal(0);
  });
});
