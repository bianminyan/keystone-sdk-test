/// <reference types="node" />
import { TransportHID } from '@keystonehq/hw-transport-usb';
export default class Solana {
    private transport;
    private mfp;
    /**
     * Constructs a new instance of the class.
     *
     * @param transport - An object of type TransportWebUSB
     * @param mfp - Optional parameter of type string, default is undefined, but the mfp should exist in the signing process.
     */
    constructor(transport: TransportHID, mfp?: string);
    private precheck;
    private sendToDevice;
    private checkDeviceLockStatus;
    /**
    * Retrieves the public key (address) for a given derivation path from the hardware device.
    *
    * This method sends a request to the connected hardware device to derive the public key
    * for the specified path using the ED25519 curve and SLIP-10 derivation algorithm.
    * It also updates the master fingerprint (mfp) of the instance.
    *
    * @param path - The derivation path for the desired public key, e.g., "m/44'/501'/0'"
    * @param dislay - A boolean flag to indicate whether to display the address on the device (not used in current implementation due to compitable with ledger js sdk)
    * @returns A Promise that resolves to an object containing:
    *          - address: A Buffer containing the derived public key
    *          - mfp: A string representing the master fingerprint of the wallet
    * @throws Will throw an error if the device communication fails or if the response is incomplete
    *
    * @example
    * solana.getAddress("44'/501'/0'").then(r => r.address)
    */
    getAddress(path: string, dislay?: boolean): Promise<{
        address: Buffer;
        mfp: string;
    }>;
    private sign;
    /**
    * Signs a Solana transaction using the specified derivation path.
    *
    * This method sends the transaction to the hardware device for signing using the private key
    * derived from the given path.
    *
    * @param path - The derivation path of the private key to use for signing, e.g., "m/44'/501'/0'/0'"
    * @param txBuffer - A Buffer containing the serialized transaction to be signed
    * @returns A Promise that resolves to an object containing:
    *          - signature: A Buffer containing the transaction signature
    * @throws Will throw an error if the signing process fails or if the device is not properly initialized
    * @example
    * solana.signTransaction("44'/501'/0'", txBuffer).then(r => r.signature)
    */
    signTransaction(path: string, txBuffer: Buffer): Promise<{
        signature: Buffer;
    }>;
    /**
    * Signs an off-chain message using the specified derivation path.
    *
    * This method sends the message to the hardware device for signing using the private key
    * derived from the given path.
    *
    * @param path - The derivation path of the private key to use for signing, e.g., "m/44'/501'/0'"
    * @param msgBuffer - A Buffer containing the off-chain message to be signed
    * @returns A Promise that resolves to an object containing:
    *          - signature: A Buffer containing the message signature
    * @throws Will throw an error if the signing process fails or if the device is not properly initialized
    */
    signOffchainMessage(path: string, msgBuffer: Buffer): Promise<{
        signature: Buffer;
    }>;
    /**
    * Retrieves the configuration information of the connected hardware device.
    *
    * This method sends a request to the device to get its version information,
    * then parses the response to extract the firmware version and wallet master fingerprint.
    *
    * @returns A Promise that resolves to an object containing:
    *          - version: A string representing the firmware version of the device
    *          - mfp: A string representing the master fingerprint of the wallet
    * @throws Will throw an error if the device communication fails or if the response cannot be parsed
    */
    getAppConfig(): Promise<any>;
}
//# sourceMappingURL=index.d.ts.map