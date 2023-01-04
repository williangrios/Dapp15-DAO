import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import './App.css';

import {  useState, useEffect } from 'react';
import { ethers } from "ethers";
import {ToastContainer, toast} from "react-toastify";

import WRHeader from 'wrcomponents/dist/WRHeader';
import WRFooter, { async } from 'wrcomponents/dist/WRFooter';
import WRInfo from 'wrcomponents/dist/WRInfo';
import WRContent from 'wrcomponents/dist/WRContent';
import WRTools from 'wrcomponents/dist/WRTools';
import Button from "react-bootstrap/Button";

import { format6FirstsAnd6LastsChar, formatDate } from "./utils";
import meta from "./assets/metamask.png";

import DaoContract from './artifacts/contracts/DAO.sol/DAO.json';

function App() {
  
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({});
  const [provider, setProvider] = useState();
  const [contract, setContract] = useState();
  const [signer, setSigner] = useState();
  
  const [yourShares, setYourShares] = useState('');

  const [availableFunds, setAvailableFunds] = useState('');
  const [nextProposalId, setNextProposalId]= useState('');
  const [totalShares, setTotalShares]= useState('');
  const [contributionEnd, setContributionEnd]= useState('');
  const [voteTime, setVoteTime]= useState('');
  const [quorum, setQuorum]= useState('');
  const [proposals, setProposals]= useState([]);

  const [inputValueToContribute, setInputValueToContribute] = useState('');

  const [inputProposalName, setInputProposalName] = useState('');
  const [inputProposalValue, setInputProposalValue] = useState('');
  const [inputProposalRecipient, setInputProposalRecipient] = useState('');

  const [inputRedeemAmount, setInputRedeemAmount] = useState('');

  const [inputTransferTo, setInputTransferTo] = useState('');
  const [inputTransferAmount, setInputTransferAmount] = useState('');
  
  const contractAddress = '0x049f1204Eca78c3F597CB93264b34A89076589F1';

  async function handleConnectWallet (){
    try {
      setLoading(true)
      let userAcc = await provider.send('eth_requestAccounts', []);
      setUser({account: userAcc[0], connected: true});

      const contrSig = new ethers.Contract(contractAddress, DaoContract.abi, provider.getSigner())
      setSigner( contrSig)

    } catch (error) {
      if (error.message == 'provider is undefined'){
        toastMessage('No provider detected.')
      } else if(error.code === -32002){
        toastMessage('Check your metamask')
      }
    } finally{
      setLoading(false);
    }
  }

  useEffect(() => {
    
    async function getData() {
      try {
        const {ethereum} = window;
        if (!ethereum){
          toastMessage('Metamask not detected');
          return
        }
  
        const prov =  new ethers.providers.Web3Provider(window.ethereum);
        setProvider(prov);

        const contr = new ethers.Contract(contractAddress, DaoContract.abi, prov);
        setContract(contr);
        
        if (! await isGoerliTestnet()){
          toastMessage('Change to goerli testnet.')
          return;
        }

        //contract data
        setQuorum((await contr.quorum()).toString())
        const nextProp = (await contr.nextProposalId()).toString()
        setNextProposalId(nextProp)
        setAvailableFunds((await contr.availableFunds()).toString())
        setTotalShares((await contr.totalShares()).toString())
        setContributionEnd((await contr.contributionEnd()).toString())
        setVoteTime((await contr.voteTime()).toString())

        let arrayProposals = [];
        for (let i = 0 ; i <= nextProp -1; i ++){
          
          let newProposal = await contr.getProposal(i);
          arrayProposals.push(newProposal);
        }
        setProposals(arrayProposals);
        toastMessage('Data loaded')
        
      } catch (error) {
        toastMessage(error.reason)        
      }
      
    }

    getData()  
    
  }, [])
  
  function isConnected(){
    if (!user.connected){
      toastMessage('You are not connected!')
      return false;
    }
    
    return true;
  }

  async function isGoerliTestnet(){
    const goerliChainId = "0x5";
    const respChain = await getChain();
    return goerliChainId == respChain;
  }

  async function getChain() {
    const currentChainId = await  window.ethereum.request({method: 'eth_chainId'})
    return currentChainId;
  }

  async function handleDisconnect(){
    try {
      setUser({});
      setSigner(null);
    } catch (error) {
      toastMessage(error.reason)
    }
  }

  function toastMessage(text) {
    toast.info(text)  ;
  }

  
  async function handleContribute(){
    try {
      if (!isConnected()) {
        return;
      }
      if (! await isGoerliTestnet()){
        toastMessage('Change to goerli testnet.')
        return;
      }
      setLoading(true);
      const resp  = await signer.contribute({value: inputValueToContribute});  
      toastMessage("Please wait.")
      await resp.wait();
      toastMessage("Contribute ok.")
    } catch (error) {
      toastMessage(error.reason)      
    } finally{
      setLoading(false);
    }
  }

  async function handleCreateProposal(){
    try {
      if (!isConnected()) {
        return;
      }
      if (! await isGoerliTestnet()){
        toastMessage('Change to goerli testnet.')
        return;
      }
      setLoading(true);
      const resp  = await signer.createProposal(inputProposalName, inputProposalValue, inputProposalRecipient, Date.now() + ( voteTime * 86400 + 1000 ));  
      toastMessage("Please wait.")
      await resp.wait();
      toastMessage("Proposal created.")
    } catch (error) {
      toastMessage(error.reason)      
    } finally{
      setLoading(false);
    }
  }

  async function handleRedeem(){
    try {
      if (!isConnected()) {
        return;
      }
      if (! await isGoerliTestnet()){
        toastMessage('Change to goerli testnet.')
        return;
      }
      setLoading(true);
      const resp  = await signer.redeemShare(inputRedeemAmount);  
      toastMessage("Please wait.")
      await resp.wait();
      toastMessage("Redeem ok.")
    } catch (error) {
      toastMessage(error.reason)      
    } finally{
      setLoading(false);
    }
    
  }

  async function handleTransferShare(){
    try {
      if (!isConnected()) {
        return;
      }
      if (! await isGoerliTestnet()){
        toastMessage('Change to goerli testnet.')
        return;
      }
      setLoading(true);
      const resp  = await signer.transferShare(inputTransferAmount, inputTransferTo);  
      toastMessage("Please wait.")
      await resp.wait();
      toastMessage("Transfer share ok.")
    } catch (error) {
      toastMessage(error.reason)      
    } finally{
      setLoading(false);
    }
    
  }

  async function handleVote(proposalId){
    
    try {
      if (!isConnected()) {
        return;
      }
      if (! await isGoerliTestnet()){
        toastMessage('Change to goerli testnet.')
        return;
      }
      setLoading(true);
      const resp  = await signer.vote(proposalId);  
      toastMessage("Please wait.")
      await resp.wait();
      toastMessage("Voted.")
    } catch (error) {
      toastMessage(error.reason)      
    } finally{
      setLoading(false);
    }

  }
  
  async function handleExecute(proposalId){
    try {
      if (!isConnected()) {
        return;
      }
      if (! await isGoerliTestnet()){
        toastMessage('Change to goerli testnet.')
        return;
      }
      setLoading(true);
      const resp  = await signer.executeProposal(proposalId);  
      toastMessage("Please wait.")
      await resp.wait();
      toastMessage("Executed.")
    } catch (error) {
      toastMessage(error.reason)      
    } finally{
      setLoading(false);
    }
  }

  return (
    <div className="App">
      <ToastContainer position="top-center" autoClose={5000}/>
      <WRHeader title="DONATE DAO" image={true} />
      <WRInfo chain="Goerli" testnet={true} />
      <WRContent>
        
      <h1>DAO</h1>
        {loading && 
          <h1>Loading....</h1>
        }
        { !user.connected ?<>
            <Button className="commands" variant="btn btn-primary" onClick={handleConnectWallet}>
              <img src={meta} alt="metamask" width="30px" height="30px"/>Connect to Metamask
            </Button></>
          : <>
            <label>Welcome {format6FirstsAnd6LastsChar(user.account)}</label>
            <button className="btn btn-primary commands" onClick={handleDisconnect}>Disconnect</button>
          </>
        }
        <hr/> 

        <h2>Contract data</h2>
        <label>Avaliable funds: {availableFunds}</label>
        <label>Proposals: {nextProposalId}</label>
        <label>Total shares: {totalShares}</label>
        <label>Quorum: {quorum}%</label>
        <label>Vote Time: {voteTime}</label>
        <hr/>

        <h2>Do you want contribute?</h2>
        <input type="text" className="commands" placeholder="Value to contribute" onChange={(e) => setInputValueToContribute(e.target.value)} value={inputValueToContribute} />
        <button className="btn btn-primary commands" onClick={handleContribute}>Contribute</button>
        <hr/>

        <h2>Create proposal (just contributors)</h2>
        <input type="text" className="commands" placeholder="Proposal name" onChange={(e) => setInputProposalName(e.target.value)} value={inputProposalName} />
        <input type="text"  className="commands" placeholder="Proposal value" onChange={(e) => setInputProposalValue(e.target.value)} value={inputProposalValue} />
        <input type="text" className="commands" placeholder="Recipient" onChange={(e) => setInputProposalRecipient(e.target.value)} value={inputProposalRecipient} />
        <button className="btn btn-primary commands" onClick={handleCreateProposal}>Create</button>
        <hr/>

        <h2>Redeem share</h2>
        <input type="text" className="commands" placeholder="Amount" onChange={(e) => setInputRedeemAmount(e.target.value)} value={inputRedeemAmount} />
        <button className="btn btn-primary commands" onClick={handleRedeem}>Redeem</button>
        <hr/>

        <h2>Transfer share</h2>
        <input type="text" className="commands" placeholder="To address" onChange={(e) => setInputTransferTo(e.target.value)} value={inputTransferTo} />
        <input type="text" className="commands" placeholder="Amount" onChange={(e) => setInputTransferAmount(e.target.value)} value={inputTransferAmount} />
        <button className="btn btn-primary commands" onClick={handleTransferShare}>Transfer</button>
        <hr/>
        
        <h2>Proposals</h2>
        { proposals.length > 0 ?
          <table className="table">
            <thead>
              <tr>
                <td style={{width: 100}}>Id</td>
                <td style={{width: 100}}>Proposal</td>
                <td style={{width: 100}}>Amount</td>
                <td style={{width: 100}}>Recipient</td>
                <td style={{width: 100}}>Votes</td>
                <td style={{width: 100}}>End</td>
                <td style={{width: 100}}>Vote</td>
                <td style={{width: 100}}>Executed</td>
              </tr>
            </thead>
            <tbody>
              {
              proposals.map((item, ind) =>  
                <tr key={ind}>
                  <td>{(item.id).toString()}</td>
                  <td>{item.name}</td>
                  <td>{(item.amount).toString()}</td>
                  <td>{item.recipient}</td>
                  <td>{(item.votes).toString()}</td>
                  <td>{formatDate((item.end))}</td>
                  <td><button className="btn btn-primary" onClick={() => handleVote(item.id)}>Vote Yes</button></td>
                  <td>{item.executed ? <>Already executed</> :
                     <><button className="btn btn-primary" onClick={() => handleExecute(item.id)}>Execute</button></>}</td>
                </tr>
              )}                
            </tbody>
          </table>:<p>No Proposals registered</p>
        }

      </WRContent>
      <WRTools react={true} hardhat={true} alchemy={true} bootstrap={true} solidity={true} css={true} javascript={true} ethersjs={true} />
      <WRFooter /> 
    </div>
  );
}

export default App;
