import { useState } from "react";
import { useRouter } from "next/router";
import { AddressInput } from "../scaffold-eth/Input/AddressInput";
import { BurnTokens } from "./BurnTokens";
import { TransferTokens } from "./TransferTokens";
import { CopyIcon } from "./assets/CopyIcon";
import { DiamondIcon } from "./assets/DiamondIcon";
import { HareIcon } from "./assets/HareIcon";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import { CollectionData } from "~~/components/nffriends/CollectionData";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export const MintTokens = () => {
  const router = useRouter();
  const { address } = useAccount({ onConnect: () => setTargetAddress(address) });

  const [searchBarValue, setSearchBarValue] = useState("");
  const [targetAddress, setTargetAddress] = useState(address);

  console.log("targetAddress", targetAddress);
  console.log("router", router);

  const { data: mintPrice } = useScaffoldContractRead({
    contractName: "NonFungibleFriends",
    functionName: "getMintPriceAfterFee",
    args: [targetAddress, BigInt(1)],
  });

  let formatedMintPrice = 0;
  if (mintPrice) {
    formatedMintPrice = Number(formatEther(mintPrice));
  }

  const { writeAsync: mintToken, isLoading } = useScaffoldContractWrite({
    contractName: "NonFungibleFriends",
    functionName: "mintToken",
    args: [targetAddress, BigInt(1)],
    value: `${formatedMintPrice}`,
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
    },
  });

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    router.push(`/nffriends?collection=${searchBarValue}`);
    setTargetAddress(searchBarValue);
  };

  return (
    <div>
      Collection {targetAddress}
      <CollectionData targetAddress={targetAddress}></CollectionData>
      <div className="flex bg-base-300 relative pb-10">
        <DiamondIcon className="absolute top-24" />
        <CopyIcon className="absolute bottom-0 left-36" />
        <HareIcon className="absolute right-0 bottom-24" />
        <div className="flex flex-col w-full mx-5 sm:mx-8 2xl:mx-20">
          <form onSubmit={handleSearch} className="flex items-center justify-end mb-5 space-x-3 mx-5">
            <AddressInput
              value={searchBarValue}
              name="Collection Search Bar"
              placeholder="Enter Collection Address"
              onChange={e => setSearchBarValue(e)}
            ></AddressInput>
            <button className="btn btn-sm btn-primary" type="submit">
              Search
            </button>
          </form>

          <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-80 rounded-2xl shadow-lg border-2 border-primary">
            <span className="text-4xl sm:text-6xl text-black">The Mint Curve_</span>

            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-5">
              <div className="flex rounded-full border border-primary p-1 flex-shrink-0">
                <div className="flex rounded-full border-2 border-primary p-1">
                  <button
                    className="btn btn-primary rounded-full capitalize font-normal font-white w-24 flex items-center gap-1 hover:gap-2 transition-all tracking-widest"
                    onClick={() => mintToken()}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>
                        Mint <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
              <BurnTokens targetAddress={targetAddress}></BurnTokens>
              <TransferTokens targetAddress={targetAddress}></TransferTokens>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
