const { expect } = require('chai');
const { ethers } = require('hardhat');

async function deployContract(contractName, ...params) {
  const contractFactory = await ethers.getContractFactory(contractName);
  const smartContract = await contractFactory.deploy(...params);
  await smartContract.deployed();
  return smartContract;
}

describe('OneMilNftPixels - update pixel by owner - success', () => {
  let deployAcct;
  let lunaToken;
  let oneMilNftPixels;

  const pixel1001Id = 1001;
  const pixelDefaultColour = '0xff00ff';
  const pixelYellowColor = '0xffff0a';
  const tokensTotalSupply = 1e7;
  const transferAndCallSignature = 'transferAndCall(address,uint256,bytes)';
  const tokenAmount = 10;
  const pixelPrice = 10;
  const updatePrice = 10;

  before(async () => {
    [deployAcct] = await ethers.getSigners();
    lunaToken = await deployContract('LunaToken', tokensTotalSupply);
    oneMilNftPixels = await deployContract(
      'OneMilNftPixels',
      lunaToken.address,
    );
  });

  it('pixel 1001 should belong to the deployer', async () => {
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
    await lunaToken[transferAndCallSignature](
      oneMilNftPixels.address,
      tokenAmount,
      callData,
    ).then((res) => res.wait());
    expect(await oneMilNftPixels.ownerOf(pixel1001Id)).to.equal(
      deployAcct.address,
    );
  });

  it('should allow deployer to update pixel', async () => {
    const sigHash = oneMilNftPixels.interface.getSighash('update');
    const callData = ethers.utils.defaultAbiCoder.encode(
      ['bytes4', 'address', 'uint24', 'bytes3', 'uint256'],
      [sigHash, deployAcct.address, pixel1001Id, pixelYellowColor, updatePrice],
    );
    const tx = lunaToken[transferAndCallSignature](
      oneMilNftPixels.address,
      updatePrice,
      callData,
    );
    await expect(tx).to.emit(oneMilNftPixels, 'Update').withArgs(pixel1001Id);
  });

  it('should have set the colour of pixel 1001 after update', async () => {
    const pixel = await oneMilNftPixels.pixels(pixel1001Id);
    expect(pixel.colour).to.equal(pixelYellowColor);
  });

  it('should maintain the same price of pixel 1001 after update', async () => {
    const pixel = await oneMilNftPixels.pixels(pixel1001Id);
    expect(pixel.price).to.equal(pixelPrice);
  });

  it('should maintain the same owner of pixel 1001 after update', async () => {
    /* __________ */
    /* __________ */
  });

  it('should have increased balance of contract after update', async () => {
    expect(await lunaToken.balanceOf(oneMilNftPixels.address)).to.equal(
      tokenAmount + updatePrice,
    );
  });
});
