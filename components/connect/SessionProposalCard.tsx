import { SessionTypes } from "@walletconnect/types";
import { NextPage } from "next";
import { Fragment } from "react";
import toast, { Toaster } from "react-hot-toast";

import { IConnectCardProps } from "../../src/handlers/connect";
import ModalStore from "../../src/handlers/store/ModalStore";
import { useKryptikAuth } from "../../src/helpers/kryptikAuthHelper";
import { ColorEnum } from "../../src/helpers/utils";
import { getAddressForNetworkDb } from "../../src/helpers/utils/accountUtils";
import Button from "../buttons/Button";
import Divider from "../Divider";
import ConnectionCard from "./ConnectionCard";
import PermissionsCard from "./Permissionscard";
import { NetworkDb } from "../../src/services/models/network";
import AppDetails from "./AppDetails";

const SessionProposalCard: NextPage<IConnectCardProps> = (props) => {
  const { signClient, kryptikWallet, kryptikService } = useKryptikAuth();
  const { onRequestClose } = { ...props };
  // Get proposal data and wallet address from store
  const proposal = ModalStore.state.data?.proposal;
  console.log("proposal data:");
  console.log(proposal);
  // Ensure proposal is defined
  if (!proposal) {
    return <p>Missing proposal data</p>;
  }
  const handleAccept = async function () {
    if (!signClient) {
      toast.error("Unable to establish connection. Please try again later.");
      return;
    }
    if (proposal) {
      const namespaces: SessionTypes.Namespaces = {};
      //TODO

      // format response
      Object.keys(requiredNamespaces).forEach((key) => {
        const accounts: string[] = [];
        requiredNamespaces[key].chains.map((chainId) => {
          const network: NetworkDb | null =
            kryptikService.getNetworkDbByBlockchainId(chainId);
          if (!network) {
            // TODO: update error message/handler
            toast.error("Unable to find network.");
            return;
          }
          // default to first address
          const addy: string = getAddressForNetworkDb(kryptikWallet, network);
          accounts.push(`${chainId}:${addy}`);
        });
        namespaces[key] = {
          accounts,
          methods: requiredNamespaces[key].methods,
          events: requiredNamespaces[key].events,
        };
      });
      const { acknowledged } = await signClient.approve({
        id,
        relayProtocol: relays[0].protocol,
        namespaces,
      });
      await acknowledged();
    } else {
      toast.error("No proposal to approve.");
    }
    toast.success("App connected.");
    // close modal
    onRequestClose();
  };

  // Get required proposal data
  const { id, params } = proposal;
  const { proposer, requiredNamespaces, relays } = params;
  console.log("Namespaces:");
  console.log(requiredNamespaces);
  console.log("------");
  return (
    <ConnectionCard title={"Review Connection"} onAccept={handleAccept}>
      <AppDetails
        name={proposal.params.proposer.metadata.name}
        icon={proposal.params.proposer.metadata.icons[0]}
        description={proposal.params.proposer.metadata.description}
      />
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col space-y-2">
          {Object.keys(requiredNamespaces).map((chain) => {
            return (
              <Fragment key={chain}>
                <p className="dark:text-white font-bold">{`Review ${chain} permissions`}</p>
                <PermissionsCard
                  requiredNamespace={requiredNamespaces[chain]}
                />
              </Fragment>
            );
          })}
        </div>
      </div>
      <div></div>
    </ConnectionCard>
  );
};

export default SessionProposalCard;
