import type { NextPage } from "next";
import { MintTokens } from "~~/components/nffriends/MintTokens";

const NonFungibleFriends: NextPage = () => {
  return (
    <>
      <div className="grid lg:grid-cols-2 flex-grow" data-theme="exampleUi">
        <MintTokens />
      </div>
    </>
  );
};

export default NonFungibleFriends;
