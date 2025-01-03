// src/pages/NFTDetailsPage.jsx
import { ethers } from "ethers";
import React, { useState, useEffect } from "react";
import NFTDetails from "../components/NFTDetails";
import { contractABI, contractAddress, nftAbi, tokenabi } from "../lib/data";
import { getOwner, vaults, makeOffer_, vaultCounter } from "../lib/functions";
import {
  buyTokens,
  cancelSellOffer,
  getSellOffer,
  getTotalSellOffers,
  getTotalTokenHolder,
  name,
  symbol,
} from "../lib/tokenFunc";
import { useRecoilState } from "recoil";
import { iAtom } from "../atoms/state";
import Navbar from "../components/navbar";

const TokenSalePage = () => {
  // const [i, setI] = useRecoilState(iAtom);
  const [metamask, setMetamask] = useState()
  const [acc, setAcc] = useState()

  const [nft, setNFT] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState();
  const [shareAmnt, setShareAmnt] = useState(0);
  const [contract, setContract] = useState();
  const [tcontract, setTContract] = useState();
  const [tname, setTName] = useState("");
  const [tsymbol, setTSymbol] = useState("");
  const [getSellOffers, setGetSellOffers] = useState([]);
  const [_NFTcontract, set_NFTcontract] = useState([]);

  useEffect(() => {
    const loadProvider = async () => {
      if (window.ethereum) {
        const ethersProvider = new ethers.providers.Web3Provider(
          window.ethereum
        );
        setProvider(ethersProvider);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signers = ethersProvider.getSigner();
        setSigner(signers);

        const _contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signers
        );
        setContract(_contract);

        //fetch the total vaultcount for now we are hardcoding it to 1
        const vaultCount = await vaultCounter(_contract);

        //from vault counter fetching all vaults
        let vaultsARR = [];
        let NftAddrs = [];
        for (let i = 1; i <= vaultCount; i++) {
          const vaultTX = await vaults(_contract, i);
          vaultsARR.push(vaultTX);
          // console.log(vaultTX);
          let tempAADrs = {
            addr: vaultsARR[i - 1][0],
            tokenId: vaultsARR[i - 1][1].toNumber(),
          };
          NftAddrs.push(tempAADrs);
        }
        console.log(vaultsARR);
        let tokenAddr_ = vaultsARR[0][3]; //oth ka
        console.log(tokenAddr_);

        const _Tcontract = new ethers.Contract(tokenAddr_, tokenabi, signers);
        setTContract(_Tcontract);

        const totalsellOffers = (
          await getTotalTokenHolder(_Tcontract)
        ).toNumber();

        let getSellOffers_ = [];
        for (let i = 0; i < totalsellOffers; i++) {

          let temp = await getSellOffer(_Tcontract, i);
          if(temp[1]!=0){
            console.log(temp[1])
            getSellOffers_.push(temp);
          }
          
        }
        setGetSellOffers(getSellOffers_);
        console.log(getSellOffers);
        const _name = await name(_Tcontract);
        const _symbol = await symbol(_Tcontract);
        setTName(_name);
        setTSymbol(_symbol);
        console.log(tname, tsymbol);
      } else {
        alert("MetaMask is not installed. Please install it to use this app.");
      }
    };

    loadProvider();
  }, []);

  return (
    <center>
      <Navbar></Navbar>
      <div className='flex justify-center m-3 flex-col items-center '>
        <button className='bg-black text-white px-4 p-2 rounded-lg text-xl' onClick={async function () {
          if (window.ethereum) {
            const ethersProvider = new ethers.providers.Web3Provider(
              window.ethereum
            );
            setMetamask(window.ethereum)
            setProvider(ethersProvider);
    
            const accounts = await window.ethereum.request({
              method: "eth_requestAccounts",
            });
            const signer = ethersProvider.getSigner();
            setSigner(signer);
            window.ethereum.on("accountsChanged", async ()=>{
              const accounts = await provider.send("eth_requestAccounts", []);
              const account = accounts[0];
              setAcc(account);
              alert("Account is Changed");
          });
    
            const _contract = new ethers.Contract(
              contractAddress,
              contractABI,
              signer
            );
            setContract(_contract);
            setAcc(accounts[0])
            await fetchVaultsAndNFTs(_contract, signer, accounts[0]);
          } else {
            alert("install metamask")
          }

        }}>{signer ? "Address: " + acc : " Connect MetaMask"}</button>
        {/* <p className='text-cyan-300'>*Make Sure You Have Added amoy TestNet to your Metamask*</p> */}
      </div>
      <div>
        <div className="bg-slate-100  pb-2">
          <div className="text-4xl m-2 font-bold">Name: {tname}</div>
          <div className="text-4xl m-2 font-bold">Symbol: {tsymbol} </div>
        </div>

        <div className="grid grid-cols-3">
          {getSellOffers.map(function (i) {
            return (
              <div className=" m-2 p-1 bg-slate-100 border border-slate-900 rounded-md ">
                <div className="text-lg font-medium">
                <div className="m-2 font-bold text-lg bg-white "> Seller Address:  <div className=" font-medium text-sm" >{i[0]}</div> </div>
                  <div className="m-2 font-semibold text-lg">
                    Price Per Share: {ethers.utils.formatEther(i[2])} Matic
                  </div>
                 
                  <div className="m-2 font-semibold text-lg">
                    Available share for sellout:{" "}
                    {ethers.utils.formatEther(i[1])}
                  </div>
                </div>
                <div className="m-2">
                  <input
                    className=" p-2 m-3 bg-white "
                    type="number"
                    placeholder="Shares to buy"
                    onChange={function (e) {
                      setShareAmnt(e.target.value);
                    }}
                  />

                  <button
                    className="p-2 m-1 bg-red-700 text-white rounded-md"
                    onClick={async function (j) {
                      const tx = await buyTokens(
                        tcontract,
                        i[0],
                        shareAmnt,
                        i[2]
                      );
                      console.log(tx);
                    }}
                  >
                    BuyToken
                  </button>
                  {/* <button
                    className="p-2 m-1 bg-red-700 text-white rounded-md"
                    onClick={async function (j) {
                      const tx = await cancelSellOffer(
                        tcontract );
                      console.log(tx);
                    }}
                  >
                    Cancel Sell 
                  </button> */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </center>
  );
};

export default TokenSalePage;
