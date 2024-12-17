import { TransportNodeUSB } from '@keystonehq/hw-transport-nodeusb';
import Solana from '@keystonehq/hw-app-sol';
import { expect } from 'chai';
  

describe('Keystone SDK Solana Integration Tests', function () {
  let sol;

  before(async function () {
    sol = new Solana.default(
      await TransportNodeUSB.connect({ timeout: 100000 }),
      "2d0bdabc"
    );
    console.log('Solana object initialized:', sol);
  });

  it('should check device lock status', async function () {
    const lockStatus = await sol.checkDeviceLockStatus();
    console.log('Device lock status:', lockStatus);
    expect(lockStatus).to.be.false; // 假设设备未锁定
  });

  it('should retrieve addresses, validate them, and sign a transaction,and sign an off-chain message', async function () {
    this.timeout(100000); // 设置更长的超时时间
  
    const expectedAddresses = [
      {
        path: "44'/501'/0'",
        address: "9c02f93054aca04bd5ff8aa8020b70b4abf47a750c8c1ee2569cb86ca4c96056",
        mfp: "2d0bdabc",
        expectedSignature: "ebf37d2ed3321b9035be8a95f7ddf416730aba194d056eb6da3c2f1984ae419df807f70ef76ec64386ef76c2f504dd653632de2dc6988852d05d35b2bdbcd601",
        expectedMessageSignature: "c592553236fb95e82d1f4992a245c120e5aefd062f1dbda1f1da1ade2d1c78a45bc1aaf461d323b6d9ef7b98915d71477466b328115fd8076aaae4d17d34c209" ,
      },
      {
        path: "44'/501'",
        address: "3c1c6bfb1c778765092e8ed7fd7bd59380f4bfa1037eab86526d8bd5fe150ca3",
        mfp: "2d0bdabc",
        expectedSignature: "78453594de567741aa7724adf133f9ff9e9e3cc5387c12b06230e3d73977380f2533ae568b27359f70ecfbf1a28779507d3afb02ea366530e23d0cab39bcdc02", 
        expectedMessageSignature: "fb4c2871c9da0f416bc793ce72a7ba3b8e4a960ce780901adc174788a8e086bb74afaf1f8b5fe488c06e71b517cee87db567d1c9dad5d7857d2bdf051f305c07",
      },
      {
        path: "44'/501'/1'/0'",
        address: "ada41fb6b94faf011a1d591dd23a24beb47a8e67bf75891e77d982e5f09ca584",
        mfp: "2d0bdabc",
        expectedSignature: "9682d60006ad29ec7b5bc12438f07c63c8b7f94813a74d41ef128514c275140a395c9c02d66e63d09014dbaaf74eb3199f8b2b0248f048935208d55273622707", 
        expectedMessageSignature: "ab314b3ac11c0503019f275e6c6166e79611fab3b62c63379eb1702f167a1aaa67f6d70e87bd126ade9f341e03fa65bbd8cd4575c7b0f1b6da84dc5e00e53004",
      },
    ];
    const txBuffer = Buffer.from(
      "010001035eb9862fe23e544a2a0969cc157cb31fd72901cc2824d536a67fb8ee911e02363b9ba3a2ebaf40c1cd672a80a8e1932b982cca8264be33c39359701e113c3da20000000000000000000000000000000000000000000000000000000000000000030303030303030303030303030303030303030303030303030303030303030301020200010c020000002a00000000000000",
      "hex"
    );
    const msgBuffer = Buffer.from("Hello, this is an off-chain message!", "utf-8");
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // 延迟函数
  
    for (const { path, address: expectedAddress, mfp: expectedMfp, expectedSignature, expectedMessageSignature } of expectedAddresses) {
      console.log(`Testing path: ${path}`);
  
      try {
        // Step 1: 获取地址
        const addressResult = await sol.getAddress(path);
        console.log(`Retrieved Address: ${addressResult.address.toString('hex')}`);
        console.log(`Retrieved Master Fingerprint: ${addressResult.mfp}`);
  
        // 验证地址和主指纹
        expect(addressResult.address.toString('hex')).to.equal(expectedAddress);
        expect(addressResult.mfp).to.equal(expectedMfp);
  
        // Step 2: 等待 5 秒再设备上输入密码
        console.log('Waiting for 5 seconds to allow device operation...');
        await delay(5000);
  
        // Step 3: 签名交易
        console.log('Sending transaction to the device for signing...');
        const signResult = await sol.signTransaction(path, txBuffer);
        const actualSignature = signResult.signature.toString('hex');
        console.log(`Retrieved Signature: ${actualSignature}`);
  
        // 验证签名结果
        expect(signResult).to.have.property('signature');
        expect(signResult.signature).to.be.instanceOf(Buffer);
        expect(actualSignature).to.equal(expectedSignature); // 断言签名是否匹配预期值
  
        // Step 4: 每个 path 签名后等待 5 秒，手动跳过签名完成页面
        console.log(`Waiting for 5 seconds before moving to the next path...`);
        await delay(5000);

        // Step 5: 签署链下消息
       console.log('Sending off-chain message to the device for signing...');
       const messageSignResult = await sol.signOffchainMessage(path, msgBuffer);
       const actualMessageSignature = messageSignResult.signature.toString('hex');
       console.log(`Retrieved Message Signature: ${actualMessageSignature}`);

       expect(messageSignResult).to.have.property('signature');
       expect(actualMessageSignature).to.equal(expectedMessageSignature);

       // Step 6: 每个 path 签名后等待 5 秒，手动跳过签名完成页面
       console.log(`Waiting for 5 seconds before moving to the next path...`);
       await delay(5000);
      } catch (error) {
        console.error(`Error during test for path ${path}:`, error.message);
        throw error;
      }  
    }
    
  });
       
});


