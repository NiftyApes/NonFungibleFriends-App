import { useState } from "react";
import { formatEther } from "viem";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

interface IProps {
  targetAddress?: string;
}

export const TransferTokens = ({ targetAddress }: IProps) => {
  const [transferTokenId, setTransferTokenId] = useState("");
  const [toAddress, setToAddress] = useState("");

  const { data: transferPrice } = useScaffoldContractRead({
    contractName: "NonFungibleFriends",
    functionName: "getTransferFee",
    args: [targetAddress, BigInt(1)],
  });

  let formatedTransferPrice = 0;
  if (transferPrice) {
    formatedTransferPrice = Number(formatEther(transferPrice));
  }

  const { writeAsync: transferTokens, isLoading } = useScaffoldContractWrite({
    contractName: "NonFungibleFriends",
    functionName: "transferTokens",
    args: [targetAddress, [BigInt(transferTokenId)], toAddress],
    value: `${formatedTransferPrice}`,
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
    },
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Token ID to Transfer"
        className="input font-bai-jamjuree w-full px-5 bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] border border-primary text-lg sm:text-2xl placeholder-white uppercase"
        onChange={e => setTransferTokenId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Transfer Recipient Address"
        className="input font-bai-jamjuree w-full px-5 bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] border border-primary text-lg sm:text-2xl placeholder-white uppercase"
        onChange={e => setToAddress(e.target.value)}
      />
      <div className="flex rounded-full border border-primary p-1 flex-shrink-0">
        <div className="flex rounded-full border-2 border-primary p-1">
          <button
            className="btn btn-primary rounded-full capitalize font-normal font-white w-24 flex items-center gap-1 hover:gap-2 transition-all tracking-widest"
            onClick={() => transferTokens()}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                Transfer <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
