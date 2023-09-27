import { useState } from "react";
import { formatEther } from "viem";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

interface IProps {
  targetAddress?: string;
}

export const BurnTokens = ({ targetAddress }: IProps) => {
  const [burnTokenId, setBurnTokenId] = useState("");

  const { data: burnPrice } = useScaffoldContractRead({
    contractName: "NonFungibleFriends",
    functionName: "getBurnPriceAfterFee",
    args: [targetAddress, BigInt(1)],
  });

  let formatedBurnPrice = 0;
  if (burnPrice) {
    formatedBurnPrice = Number(formatEther(burnPrice));
  }

  const { writeAsync: burnToken, isLoading } = useScaffoldContractWrite({
    contractName: "NonFungibleFriends",
    functionName: "burnTokens",
    args: [targetAddress, [BigInt(burnTokenId)]],
    value: `${formatedBurnPrice}`,
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
    },
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Token ID to burn"
        className="input font-bai-jamjuree w-full px-5 bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] border border-primary text-lg sm:text-2xl placeholder-white uppercase"
        onChange={e => setBurnTokenId(e.target.value)}
      />
      <div className="flex rounded-full border border-primary p-1 flex-shrink-0">
        <div className="flex rounded-full border-2 border-primary p-1">
          <button
            className="btn btn-primary rounded-full capitalize font-normal font-white w-24 flex items-center gap-1 hover:gap-2 transition-all tracking-widest"
            onClick={() => burnToken()}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                Burn <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
