import type { NextPage } from "next";
import { ContractData } from "~~/components/nffriends/ContractData";
import { ContractInteraction } from "~~/components/nffriends/ContractInteraction";

const NonFungibleFriends: NextPage = () => {
  return (
    <>
      <div className="grid lg:grid-cols-2 flex-grow" data-theme="exampleUi">
        <ContractInteraction />
        <ContractData />
      </div>
    </>
  );
};

export default NonFungibleFriends;
