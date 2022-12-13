import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import './App.css';

import {  useState, useEffect } from 'react';
import { ethers } from "ethers";
import {ToastContainer, toast} from "react-toastify";
import { _toEscapedUtf8String } from "ethers/lib/utils";

import WRHeader from 'wrcomponents/dist/WRHeader';
import WRFooter from 'wrcomponents/dist/WRFooter';
import WRInfo from 'wrcomponents/dist/WRInfo';
import WRContent from 'wrcomponents/dist/WRContent';
import WRTools from 'wrcomponents/dist/WRTools';

import DaoContract from './artifacts/contracts/DAO.sol/DAO.json';

function App() {
  
  const [userAccount, setUserAccount] = useState('');
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
  
  const addressContract = '0x209A2EC61bF71BDEB974a0376c3BB8006D843163';
  
  let contractDeployed = null;
  let contractDeployedSigner = null;
  
  async function getProvider(connect = false){
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    if (contractDeployed == null){
      contractDeployed = new ethers.Contract(addressContract, DaoContract.abi, provider)
    }
    if (contractDeployedSigner == null){
      if (connect){
        let userAcc = await provider.send('eth_requestAccounts', []);
        setUserAccount(userAcc[0]);
      }
      contractDeployedSigner = new ethers.Contract(addressContract, DaoContract.abi, provider.getSigner());
    }
  }

  useEffect(() => {
    getData()
  }, [])
  

  async function disconnect(){
    try {
      setUserAccount('');
    } catch (error) {
      
    }
  }

  function formatDate(dateTimestamp){
    let date = new Date(parseInt(dateTimestamp));
    let dateFormatted = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + "  " + date.getHours() + ":" + date.getMinutes();
    return dateFormatted;
  }

  function toastMessage(text) {
    toast.info(text)  ;
  }

  async function getData(connect = false) {
    await getProvider(connect);
    setQuorum((await contractDeployed.quorum()).toString())
    const nextProp = (await contractDeployed.nextProposalId()).toString()
    setNextProposalId(nextProp)
    setAvailableFunds((await contractDeployed.availableFunds()).toString())
    setTotalShares((await contractDeployed.totalShares()).toString())
    setContributionEnd((await contractDeployed.contributionEnd()).toString())
    setVoteTime((await contractDeployed.voteTime()).toString())

    let arrayProposals = [];
    for (let i = 0 ; i <= nextProp -1; i ++){
      
      let newProposal = await contractDeployed.getProposal(i);
      arrayProposals.push(newProposal);
    }
    setProposals(arrayProposals);
    toastMessage('Data loaded')
  }
  
  async function handleContribute(){
    await getProvider(true);
    try {
      console.log(contractDeployedSigner);
      const resp  = await contractDeployedSigner.contribute({value: inputValueToContribute});  
      toastMessage("Contribute ok.")
    } catch (error) {
      console.log(error);
    }
  }

  async function handleCreateProposal(){
    await getProvider(true);
    try {
      const resp  = await contractDeployedSigner.createProposal(inputProposalName, inputProposalValue, inputProposalRecipient, Date.now() + ( voteTime * 86400 + 1000 ));  
      toastMessage("Proposal created.")
    } catch (error) {
      toastMessage(error.message);
    }
  }

  async function handleRedeem(){
    await getProvider(true);
    try {
      const resp  = await contractDeployedSigner.redeemShare(inputRedeemAmount);  
      toastMessage("Redeem ok.")
    } catch (error) {
      toastMessage(error.message);
    }
  }

  async function handleTransferShare(){
    await getProvider(true);
    try {
      const resp  = await contractDeployedSigner.transferShare(inputTransferAmount, inputTransferTo);  
      toastMessage("Transfer share ok.")
    } catch (error) {
      toastMessage(error.message);
    }
  }

  async function handleVote(proposalId){
    await getProvider(true);
    try {
      const resp  = await contractDeployedSigner.vote(proposalId);  
      toastMessage("Voted.")
    } catch (error) {
      toastMessage(error.message);
    }
  }
  
  async function handleExecute(proposalId){
    await getProvider(true);
    try {
      const resp  = await contractDeployedSigner.executeProposal(proposalId);  
      toastMessage("Executed.")
    } catch (error) {
      toastMessage(error.message);
    }
  }

  return (
    <div className="App">
      <ToastContainer position="top-center" autoClose={5000}/>
      <WRHeader title="DONATE DAO" image={true} />
      <WRInfo chain="Goerli testnet" />
      <WRContent>
        
        {
          userAccount =='' ?<>
            <h2>Connect your wallet</h2>
            <button onClick={() => getData(true)}>Connect</button>
          </>
          
          :(<>
            <h2>User data</h2>
            <p>User account: {userAccount}</p>
            <button onClick={disconnect}>Disconnect</button></>)
        }
        
        <hr/>
        <h2>Contract data</h2>
        <p>Avaliable funds: {availableFunds}</p>
        <p>Proposals: {nextProposalId}</p>
        <p>Total shares: {totalShares}</p>
        {/* <p>Contribution end: {contributionEnd}</p> */}
        <p>Quorum: {quorum}%</p>
        <p>Vote Time: {voteTime}</p>
        <hr/>

        <h2>Do you want contribute?</h2>
        <input type="text" placeholder="Value to contribute" onChange={(e) => setInputValueToContribute(e.target.value)} value={inputValueToContribute} />
        <button onClick={handleContribute}>Contribute</button>
        <hr/>

        <h2>Create proposal (just contributors)</h2>
        <input type="text" placeholder="Proposal name" onChange={(e) => setInputProposalName(e.target.value)} value={inputProposalName} />
        <input type="text" placeholder="Proposal value" onChange={(e) => setInputProposalValue(e.target.value)} value={inputProposalValue} />
        <input type="text" placeholder="Recipient" onChange={(e) => setInputProposalRecipient(e.target.value)} value={inputProposalRecipient} />
        <button onClick={handleCreateProposal}>Create</button>
        <hr/>

        <h2>Redeem share</h2>
        <input type="text" placeholder="Amount" onChange={(e) => setInputRedeemAmount(e.target.value)} value={inputRedeemAmount} />
        <button onClick={handleRedeem}>Redeem</button>
        <hr/>

        <h2>Transfer share</h2>
        <input type="text" placeholder="To address" onChange={(e) => setInputTransferTo(e.target.value)} value={inputTransferTo} />
        <input type="text" placeholder="Amount" onChange={(e) => setInputTransferAmount(e.target.value)} value={inputTransferAmount} />
        <button onClick={handleTransferShare}>Transfer</button>
        <hr/>
        
        <h2>Proposals</h2>
        { proposals.length > 0 ?
          <table>
            <thead>
              <tr>
                <td style={{width: 100}}>Id</td>
                <td style={{width: 100}}>Name</td>
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
                  <td><button onClick={() => handleVote(item.id)}>Vote Yes</button></td>
                  <td>{item.executed ? <>Already executed</> :
                     <><button onClick={() => handleExecute(item.id)}>Execute</button></>}</td>
                  
                </tr>
              )}                
            </tbody>
          </table>:<p>No Proposals registered</p>
        }

      </WRContent>
      <WRTools react={true} hardhat={true} bootstrap={true} solidity={true} css={true} javascript={true} ethersjs={true} />
      <WRFooter /> 
    </div>
  );
}

export default App;
