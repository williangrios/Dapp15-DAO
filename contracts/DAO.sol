// SPDX-License-Identifier: None
pragma solidity 0.8.17;

contract DAO {
    
//collect investors money
//keep track of investors contribution with shares
//allow investors to transfer shares
//allow investment proposals to be created and voted
//executes successful invsetiment proposals
    
    struct Proposal {
        uint id;
        string name;
        uint amount;
        address payable recipient;
        uint votes;
        uint end;
        bool executed;
    }

    mapping(address => bool) public  investors;
    mapping (address => uint) public shares;
    mapping (uint => Proposal) public proposals;
    //voter cannot vote twice
    mapping (address => mapping(uint => bool)) public votes;
    uint public totalShares;
    uint public availableFunds;
    uint public contributionEnd;
    uint public nextProposalId = 0;
    uint public voteTime;
    uint public quorum;
    address public admin;
    
    //contribution time in days
    constructor(uint contributionTime, uint _voteTime, uint _quorum) {
        require(_quorum > 0 , "Quorum must be > 0");
        contributionEnd = block.timestamp + (contributionTime * 86400);
        voteTime = _voteTime;
        quorum = _quorum;
        admin = msg.sender;
    }

    function contribute() payable external {
        require (block.timestamp < contributionEnd, "The time to contribution ends");
        investors[msg.sender] = true;
        shares[msg.sender] += msg.value;
        totalShares += msg.value;
        availableFunds += msg.value;
    }

    function redeemShare(uint amount) external {
        require(shares[msg.sender] >= amount, "Not enough shares to redeem");
        require(availableFunds >= amount, "Not enough available funds");
        shares[msg.sender] -= amount;
        availableFunds -= amount;
        payable(msg.sender).transfer(amount);
    }

    function transferShare(uint amount, address to) external {
        require(shares[msg.sender] >= amount, "Not enough shares to transfer");
        shares[msg.sender] -= amount;
        shares[to] += amount;
        investors[to] = true;
    }

    function createProposal(string memory name, uint amount, address payable recipient, uint offset) onlyInvestors() external {
        require(availableFunds >= amount, "Amount too big");
        proposals[nextProposalId] = Proposal(nextProposalId, name, amount, recipient, 0, block.timestamp + offset, false);
        availableFunds -= amount;
        nextProposalId ++;
    }

    function vote(uint proposalId) onlyInvestors() external {
        Proposal storage proposal = proposals[proposalId];
        require(votes[msg.sender][proposalId] == false, "Investor can only vote once for a proposal.");
        require(block.timestamp < proposal.end, "Can only vote until proposal end");
        votes[msg.sender][proposalId] = true;
        proposal.votes += shares[msg.sender];
    }

    function executeProposal(uint proposalId) onlyAdmin() external{
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.end, "Cannot execute a proposal before end");
        require(proposal.executed == false, "Cannot execute a proposal already executed");
        require((proposal.votes /totalShares) *100 >= quorum , "Cannot execute a proposal with votes below quorum");
        _transferEther(proposal.amount, proposal.recipient);
    }

    function withdrawEther (uint amount, address payable to) onlyAdmin() external {
        _transferEther(amount, to);
    }

    function getUserShares (address userAddres) external view returns (uint) {
        return shares[userAddres];
    }

    function getProposal(uint proposalId) view external returns(Proposal memory){
        return proposals[proposalId];
    }

    fallback() payable external{
        availableFunds += msg.value;
    }

    receive() payable external{
        availableFunds += msg.value;
    }

    function _transferEther(uint amount, address payable to) internal{
        require(amount <= availableFunds, "Not enough available funds");
        availableFunds -= amount;
        to.transfer(amount);
    }

    modifier onlyInvestors() {
        require(investors[msg.sender] == true, "Only investors");
        _;
    }

    modifier onlyAdmin(){
        require(msg.sender == admin, "Only Admin");
        _;
    }


}


