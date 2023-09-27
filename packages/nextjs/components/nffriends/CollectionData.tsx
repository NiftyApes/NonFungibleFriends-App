import { useScaffoldContractRead, useScaffoldEventHistory, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";

interface IProps {
  targetAddress?: string;
}

export const CollectionData = ({ targetAddress }: IProps) => {
  const { data: mintSupply } = useScaffoldContractRead({
    contractName: "NonFungibleFriends",
    functionName: "mintedSupply",
    args: [targetAddress],
  });

  const { data: totalSupply } = useScaffoldContractRead({
    contractName: "NonFungibleFriends",
    functionName: "totalSupply",
    args: [targetAddress],
  });

  const { data: mintPrice } = useScaffoldContractRead({
    contractName: "NonFungibleFriends",
    functionName: "getMintPriceAfterFee",
    args: [targetAddress, BigInt(1)],
  });

  console.log("totalSupply", totalSupply);

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
