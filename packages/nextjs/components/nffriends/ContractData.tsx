import { useAccount } from "wagmi";
import { useScaffoldContractRead, useScaffoldEventHistory, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";

export const ContractData = () => {
  const { address } = useAccount();

  const { data: mintSupply } = useScaffoldContractRead({
    contractName: "NonFungibleFriends",
    functionName: "mintedSupply",
    args: [address],
  });

  const { data: totalSupply } = useScaffoldContractRead({
    contractName: "NonFungibleFriends",
    functionName: "totalSupply",
    args: [address],
  });

  const { data: mintPrice } = useScaffoldContractRead({
    contractName: "NonFungibleFriends",
    functionName: "getMintPriceAfterFee",
    args: [address, BigInt(1)],
  });

  useScaffoldEventSubscriber({
    contractName: "NonFungibleFriends",
    eventName: "Trade",
    listener: logs => {
      logs.map(log => {
        const {
          trader,
          collectionId,
          isBuy,
          tokenAmount,
          ethAmount,
          protocolEthAmount,
          subjectEthAmount,
          mintedSupply,
          totalSupply,
        } = log.args;
        console.log(
          "📡 Trade event",
          trader,
          collectionId,
          isBuy,
          tokenAmount,
          ethAmount,
          protocolEthAmount,
          subjectEthAmount,
          mintedSupply,
          totalSupply,
        );
      });
    },
  });

  const {
    data: TradeEvents,
    isLoading: isLoadingEvents,
    error: errorReadingEvents,
  } = useScaffoldEventHistory({
    contractName: "NonFungibleFriends",
    eventName: "Trade",
    fromBlock: process.env.NEXT_PUBLIC_DEPLOY_BLOCK ? BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) : 0n,
    filters: undefined,
    blockData: true,
  });

  console.log("Events:", isLoadingEvents, errorReadingEvents, TradeEvents);

  return (
    <div className="flex flex-col justify-center items-center bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] py-10 px-5 sm:px-0 lg:py-auto max-w-[100vw] ">
      <div className="px-4">Mint Price: {String(mintPrice)}</div>
      <div className="px-4">Minted Supply: {String(mintSupply)}</div>
      <div className="px-4">Burned Supply: {String(Number(totalSupply) - Number(mintSupply))}</div>
    </div>
  );
};
