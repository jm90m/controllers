import { abiERC721 } from '@metamask/metamask-eth-abis';
import { Web3 } from '../../standards-types';
import {
  ERC721_INTERFACE_ID,
  ERC721_METADATA_INTERFACE_ID,
  ERC721_ENUMERABLE_INTERFACE_ID,
  ERC721,
} from '../../../../constants';

export class ERC721Standard {
  private web3: Web3;

  constructor(web3: Web3) {
    this.web3 = web3;
  }

  /**
   * Query if contract implements ERC721Metadata interface.
   *
   * @param address - ERC721 asset contract address.
   * @returns Promise resolving to whether the contract implements ERC721Metadata interface.
   */
  contractSupportsMetadataInterface = async (
    address: string,
  ): Promise<boolean> => {
    return this.contractSupportsInterface(
      address,
      ERC721_METADATA_INTERFACE_ID,
    );
  };

  /**
   * Query if contract implements ERC721Enumerable interface.
   *
   * @param address - ERC721 asset contract address.
   * @returns Promise resolving to whether the contract implements ERC721Enumerable interface.
   */
  contractSupportsEnumerableInterface = async (
    address: string,
  ): Promise<boolean> => {
    return this.contractSupportsInterface(
      address,
      ERC721_ENUMERABLE_INTERFACE_ID,
    );
  };

  /**
   * Query if contract implements ERC721 interface.
   *
   * @param address - ERC721 asset contract address.
   * @returns Promise resolving to whether the contract implements ERC721 interface.
   */
  contractSupportsBase721Interface = async (
    address: string,
  ): Promise<boolean> => {
    return this.contractSupportsInterface(address, ERC721_INTERFACE_ID);
  };

  /**
   * Enumerate assets assigned to an owner.
   *
   * @param address - ERC721 asset contract address.
   * @param selectedAddress - Current account public address.
   * @param index - A collectible counter less than `balanceOf(selectedAddress)`.
   * @returns Promise resolving to token identifier for the 'index'th asset assigned to 'selectedAddress'.
   */
  getCollectibleTokenId = async (
    address: string,
    selectedAddress: string,
    index: number,
  ): Promise<string> => {
    const contract = this.web3.eth.contract(abiERC721).at(address);
    return new Promise<string>((resolve, reject) => {
      contract.tokenOfOwnerByIndex(
        selectedAddress,
        index,
        (error: Error, result: string) => {
          /* istanbul ignore if */
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        },
      );
    });
  };

  /**
   * Query for tokenURI for a given asset.
   *
   * @param address - ERC721 asset contract address.
   * @param tokenId - ERC721 asset identifier.
   * @returns Promise resolving to the 'tokenURI'.
   */
  getTokenURI = async (address: string, tokenId: string): Promise<string> => {
    const contract = this.web3.eth.contract(abiERC721).at(address);
    const supportsMetadata = await this.contractSupportsMetadataInterface(
      address,
    );
    if (!supportsMetadata) {
      throw new Error('Contract does not support ERC721 metadata interface.');
    }
    return new Promise<string>((resolve, reject) => {
      contract.tokenURI(tokenId, (error: Error, result: string) => {
        /* istanbul ignore if */
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  };

  /**
   * Query for name for a given asset.
   *
   * @param address - ERC721 asset contract address.
   * @returns Promise resolving to the 'name'.
   */
  getAssetName = async (address: string): Promise<string> => {
    const contract = this.web3.eth.contract(abiERC721).at(address);
    return new Promise<string>((resolve, reject) => {
      contract.name((error: Error, result: string) => {
        /* istanbul ignore if */
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  };

  /**
   * Query for symbol for a given asset.
   *
   * @param address - ERC721 asset contract address.
   * @returns Promise resolving to the 'symbol'.
   */
  getAssetSymbol = async (address: string): Promise<string> => {
    const contract = this.web3.eth.contract(abiERC721).at(address);
    return new Promise<string>((resolve, reject) => {
      contract.symbol((error: Error, result: string) => {
        /* istanbul ignore if */
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  };

  /**
   * Query for owner for a given ERC721 asset.
   *
   * @param address - ERC721 asset contract address.
   * @param tokenId - ERC721 asset identifier.
   * @returns Promise resolving to the owner address.
   */
  async getOwnerOf(address: string, tokenId: string): Promise<string> {
    const contract = this.web3.eth.contract(abiERC721).at(address);
    return new Promise<string>((resolve, reject) => {
      contract.ownerOf(tokenId, (error: Error, result: string) => {
        /* istanbul ignore if */
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  }

  /**
   * Query if a contract implements an interface.
   *
   * @param address - Asset contract address.
   * @param interfaceId - Interface identifier.
   * @returns Promise resolving to whether the contract implements `interfaceID`.
   */
  private contractSupportsInterface = async (
    address: string,
    interfaceId: string,
  ): Promise<boolean> => {
    const contract = this.web3.eth.contract(abiERC721).at(address);
    return new Promise<boolean>((resolve, reject) => {
      contract.supportsInterface(
        interfaceId,
        (error: Error, result: boolean) => {
          /* istanbul ignore if */
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        },
      );
    });
  };

  /**
   * Query if a contract implements an interface.
   *
   * @param address - Asset contract address.
   * @param tokenId - tokenId of a given token in the contract.
   * @returns Promise resolving an object containing the standard, tokenURI, symbol and name of the given contract/tokenId pair.
   */
  getDetails = async (
    address: string,
    tokenId?: string,
  ): Promise<{
    standard: string;
    tokenURI: string | undefined;
    symbol: string | undefined;
    name: string | undefined;
  }> => {
    const [isERC721, supportsMetadata] = await Promise.all([
      this.contractSupportsBase721Interface(address),
      this.contractSupportsMetadataInterface(address),
    ]);
    let tokenURI, symbol, name;
    if (supportsMetadata) {
      [symbol, name] = await Promise.all([
        this.getAssetSymbol(address),
        this.getAssetName(address),
      ]);

      if (tokenId) {
        tokenURI = await this.getTokenURI(address, tokenId);
      }
    }

    if (isERC721) {
      return {
        standard: ERC721,
        tokenURI,
        symbol,
        name,
      };
    }

    throw new Error("This isn't a valid ERC721 contract");
  };
}
