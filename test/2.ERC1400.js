var CryptoJS  = require("./node_modules/crypto-js");
const ERC1400 = artifacts.require("ERC1400");
const ERC1820Registry = artifacts.require("ERC1820Registry");
var expect = require('chai').expect;
const utils = require("./helpers/utils");
let base = "0x";

contract("ERC1400", (accounts) => {

    let [issuer, originalOwner, buyer, spender, operator, controller, certificateSigner ] = accounts;
	let contractInstance;
	let registryInstance;
	let defaultPartition_0 = base + CryptoJS.SHA256("defaultPartition_0").toString();
	let defaultPartition_1 = base + CryptoJS.SHA256("defaultPartition_1").toString();
	let doc_name = base + CryptoJS.SHA256("House name").toString();
	let doc_hash = base + CryptoJS.SHA256("House descritpiton hash").toString();
	let example_doc = base + CryptoJS.SHA256("Example of a document guaranteening ownership provided with transfer of tokens").toString();
	
	beforeEach(async () => {
		registryInstance = await ERC1820Registry.new({from: issuer});
        	contractInstance = await ERC1400.new('HouseToken','HT',10**2, [controller], [defaultPartition_0, defaultPartition_1],[certificateSigner], {from: issuer});
		await contractInstance.setERC1820(registryInstance.address, {from: issuer});
		await contractInstance.setInterface({from: issuer});
		await contractInstance.setDocument( doc_name,'https://mock_link_to_document.com', doc_hash, {from: controller});
		await contractInstance.approveCertificate(contractInstance.address, originalOwner, "Approval", "The originalOwner has been approved",1671461820,'https://mock_link_to_document.com' ,{from: certificateSigner});
		let issuance_info = base + CryptoJS.SHA256("Additional info atatched to the issuance").toString();
		await contractInstance.issue(originalOwner, 10**6, issuance_info, {from: issuer});
    });
	
	context("Asserting state of variables after inital coins are minted", async () => {
	
		it("Check whether supply of tokens is initiated appropriately" , async () => {
		    const totalSupply = await contractInstance.totalSupply();
			expect(totalSupply.toString()).to.equal((10**6).toString());
			const isIssuable = await contractInstance.isIssuable();
			expect(isIssuable).to.equal(false);
		})
		
		it("Check that all funds are originally owned by originalOwner" , async () => {
			const balanceOwner = await contractInstance.balanceOf(originalOwner);
			expect(balanceOwner.toString()).to.equal((10**6).toString());
			const balancebuyer = await contractInstance.balanceOf(buyer);
			expect(balancebuyer.toString()).to.equal((0).toString());
			const balancespender = await contractInstance.balanceOf(spender);
			expect(balancespender.toString()).to.equal((0).toString());
		})
	})
	
	
	context("Asserting the functionality of adding & reading & removing documents related to the underlying asset", async () => {
		
		it("Preventing to add documents relating to the property description by anyone who is not a controller" , async () => {
			let doc_name_1 = base + CryptoJS.SHA256("House financials").toString();
			let doc_hash_1 = base + CryptoJS.SHA256("House financials hash").toString();
			await utils.shouldThrow(contractInstance.setDocument(doc_name_1,'https://mock_link_to_document.com' , doc_hash_1, {from: issuer}));
		})
	
		it("Adding additional documents relating to the property description and asserting whether all documents can be retrieved appropriatelly" , async () => {
			let doc_name_1 = base + CryptoJS.SHA256("House financials").toString();
			let doc_hash_1 = base + CryptoJS.SHA256("House financials hash").toString();
			const setDoc = await contractInstance.setDocument(doc_name_1,'https://mock_link_to_document.com' , doc_hash_1, {from: controller});
			expect(setDoc.logs[0].args.documentHash).to.equal(doc_hash_1); //check that the result was correctly emitted
			const docs = await contractInstance.getAllDocuments(); 
			expect(docs[0]).to.equal(doc_hash); //check that the mapping has registered the first, original document
			expect(docs[1]).to.equal(doc_hash_1); //check that the mapping has registered the additional document
		})
		
		it("Removing additional documents relating to the property" , async () => {
			let doc_name_1 = base + CryptoJS.SHA256("House financials").toString();
			let doc_hash_1 = base + CryptoJS.SHA256("House financials hash").toString();
			const setDoc = await contractInstance.setDocument(doc_name_1,'https://mock_link_to_document.com' , doc_hash_1, {from: controller});
			expect(setDoc.logs[0].args.documentHash).to.equal(doc_hash_1); //check that the result was correctly emitted
			const removeDoc = await contractInstance.removeDocument(doc_name_1, {from: controller});
			expect(removeDoc.logs[0].args.documentHash).to.equal(doc_hash_1);
		})
		
	})
	
	
	context("Testing the ability to create and remove operators for various accounts", async () => {
	
		it("Adding a new operators for a given account" , async () => {
			const isOp = await contractInstance.isOperator(operator, buyer);
			expect(isOp).to.equal(false);
			
			await contractInstance.authorizeOperator(operator, {from: buyer});
			const isOp1 = await contractInstance.isOperator(operator, buyer);
			expect(isOp1).to.equal(true);
			const isOp_partition = await contractInstance.isOperatorForPartition(defaultPartition_0,operator, buyer);
			expect(isOp_partition).to.equal(true);
		})
		
		it("Adding a new operators for a given account for a given partition" , async () => {
			const isOp = await contractInstance.isOperatorForPartition(defaultPartition_0,operator, buyer);
			expect(isOp).to.equal(false);
			
			await contractInstance.authorizeOperatorByPartition(defaultPartition_0,operator, {from: buyer});
			const isOp1 = await contractInstance.isOperatorForPartition(defaultPartition_0,operator, buyer);
			expect(isOp1).to.equal(true);
		})
		
	
		it("Remove a operators for a given account " , async () => {
			await contractInstance.authorizeOperator(operator, {from: spender});
			const isOp = await contractInstance.isOperator(operator, spender);
			expect(isOp).to.equal(true);
			const isOp_partition = await contractInstance.isOperatorForPartition(defaultPartition_0,operator, spender);
			expect(isOp_partition).to.equal(true);
			
			await contractInstance.revokeOperator(operator, {from: spender});
			const isOp1 = await contractInstance.isOperator(operator, spender);
			expect(isOp1).to.equal(false);
			const isOp_partition1 = await contractInstance.isOperatorForPartition(defaultPartition_0,operator, spender);
			expect(isOp_partition1).to.equal(false);
		})
		
		it("Remove a operators for a given account for a given partition " , async () => {
			await contractInstance.authorizeOperatorByPartition(defaultPartition_0,operator, {from: spender});
			const isOp = await contractInstance.isOperatorForPartition(defaultPartition_0,operator, spender);
			expect(isOp).to.equal(true);
			
			await contractInstance.revokeOperatorByPartition(defaultPartition_0, operator, {from: spender});
			const isOp1 = await contractInstance.isOperatorForPartition(defaultPartition_0,operator, spender);
			expect(isOp1).to.equal(false);
		})
	})

	context("Testing the ability to perform transfers across accounts for ERC1400 interface", async () => {
	
		it("Preventing to making a transfer from the originalOwner to a first buyer (with data) without the buyer undergoing KYC" , async () => {
			await utils.shouldThrow(contractInstance.transferWithData(buyer, 20, example_doc, {from: originalOwner}));
		})
		
	
		it("Making a transfer from the originalOwner to a first buyer (with data)" , async () => {
			const approval = await contractInstance.approveCertificate(contractInstance.address, buyer, "Approval", "The buyer has been approved", 1671461820 ,'https://mock_link_to_document.com' ,{from: certificateSigner});
			expect(approval.receipt.status).to.equal(true);
			const transfer = await contractInstance.transferWithData(buyer, 10**4, example_doc, {from: originalOwner});
			expect(transfer.logs[0].args.from).to.equal(originalOwner);
			expect(transfer.logs[0].args.to).to.equal(buyer);
			expect(transfer.logs[0].args.value.toString()).to.equal((10**4).toString());
		})
		
		it("Making a transfer from the originalOwner to a first buyer (with data) by specifying a partition" , async () => {
			const approval = await contractInstance.approveCertificate(contractInstance.address, buyer, "Approval", "The buyer has been approved", 1671461820 ,'https://mock_link_to_document.com' ,{from: certificateSigner});
			expect(approval.receipt.status).to.equal(true);
			const transfer = await contractInstance.transferByPartition(defaultPartition_0,buyer, 10**4, example_doc, {from: originalOwner});
			expect(transfer.logs[0].args.from).to.equal(originalOwner);
			expect(transfer.logs[0].args.to).to.equal(buyer);
			expect(transfer.logs[0].args.value.toString()).to.equal((10**4).toString());
		})
		
		
	    it("Preventing a transfer from the originalOwner to a first buyer (with data) as amount is bigger than originalOwner's balance" , async () => {
			const approval = await contractInstance.approveCertificate(contractInstance.address, buyer, "Approval", "The buyer has been approved", 1671461820 ,'https://mock_link_to_document.com' ,{from: certificateSigner});
			expect(approval.receipt.status).to.equal(true);
			await utils.shouldThrow(contractInstance.transferWithData(buyer, 10**8, example_doc, {from: originalOwner}));
		})
		
		it("Preventing to make a transfer from the originalOwner to a first buyer (with data) as an unauthorized operator" , async () => {
			const approval = await contractInstance.approveCertificate(contractInstance.address, buyer, "Approval", "The buyer has been approved", 1671461820 ,'https://mock_link_to_document.com' ,{from: certificateSigner});
			expect(approval.receipt.status).to.equal(true);
			await utils.shouldThrow(contractInstance.transferFromWithData(originalOwner, buyer, 10**4, example_doc, {from: operator}));
		})	
			
		
		it("Making a transfer from the originalOwner to a first buyer (with data) as an authorized operator" , async () => {
			const approval = await contractInstance.approveCertificate(contractInstance.address, buyer, "Approval", "The buyer has been approved", 1671461820 ,'https://mock_link_to_document.com' ,{from: certificateSigner});
			expect(approval.receipt.status).to.equal(true);
			await contractInstance.authorizeOperator(operator, {from: originalOwner});
			
			const transfer = await contractInstance.transferFromWithData(originalOwner, buyer, 10**4, example_doc, {from: operator});
			expect(transfer.logs[1].args.operator).to.equal(operator);
			expect(transfer.logs[1].args.from).to.equal(originalOwner);
			expect(transfer.logs[1].args.to).to.equal(buyer);
			expect(transfer.logs[1].args.value.toString()).to.equal((10**4).toString());
		})
		
		it("Making a transfer from the originalOwner to a first buyer (with data) as an authorized operator by specifying a partition" , async () => {
			const approval = await contractInstance.approveCertificate(contractInstance.address, buyer, "Approval", "The buyer has been approved", 1671461820 ,'https://mock_link_to_document.com' ,{from: certificateSigner});
			expect(approval.receipt.status).to.equal(true);
			await contractInstance.authorizeOperator(operator, {from: originalOwner});
			
			let example_doc_operator = base + CryptoJS.SHA256("Example of a document provided by the operator during transfer of tokens").toString();
			const transfer = await contractInstance.operatorTransferByPartition(defaultPartition_0,originalOwner, buyer, 10**4, example_doc, example_doc_operator, {from: operator});			
			expect(transfer.logs[1].args.fromPartition).to.equal(defaultPartition_0);
			expect(transfer.logs[1].args.operator).to.equal(operator);
			expect(transfer.logs[1].args.from).to.equal(originalOwner);
			expect(transfer.logs[1].args.to).to.equal(buyer);
			expect(transfer.logs[1].args.value.toString()).to.equal((10**4).toString());
		})
				
		
		it("Making a transfer from the originalOwner to a first buyer (with data) as an authorized controller" , async () => {
			const approval = await contractInstance.approveCertificate(contractInstance.address, buyer, "Approval", "The buyer has been approved", 1671461820 ,'https://mock_link_to_document.com' ,{from: certificateSigner});
			expect(approval.receipt.status).to.equal(true);
			
			const transfer = await contractInstance.transferFromWithData(originalOwner, buyer, 10**2, example_doc, {from: controller});
			expect(transfer.logs[1].args.operator).to.equal(controller);
			expect(transfer.logs[1].args.from).to.equal(originalOwner);
			expect(transfer.logs[1].args.to).to.equal(buyer);
			expect(transfer.logs[1].args.value.toString()).to.equal((10**2).toString());
		})
		
		
		
	})
	
	context("Testing the ability to perform transfers across accounts for ERC20 interface", async () => {
	
		it("Approve spender to spend on behalf of buyer" , async () => {
			const approval = await contractInstance.approve(spender, 10**2, {from: buyer});
			expect(approval.logs[0].args.owner).to.equal(buyer);
			expect(approval.logs[0].args.spender).to.equal(spender);
			expect(approval.logs[0].args.value.toString()).to.equal((10**2).toString());

		})
		
	
		it("Allow spender to spend on behalf of the buyer" , async () => {
			await contractInstance.approveCertificate(contractInstance.address, buyer, "Approval", "The buyer has been approved", 1671461820 ,'https://mock_link_to_document.com' ,{from: certificateSigner});
			const transfer = await contractInstance.transferWithData(buyer, 10**4, example_doc, {from: originalOwner});
			await contractInstance.approveCertificate(contractInstance.address, spender, "Approval", "The buyer has been approved", 1671461820 ,'https://mock_link_to_document.com' ,{from: certificateSigner});			
			await contractInstance.approve(spender, 10**2, {from: buyer});
			const transfer_1 = await contractInstance.transferFromWithData(buyer, spender, 10**2, example_doc, {from: spender});
			expect(transfer_1.logs[1].args.operator).to.equal(spender);
		})
		
		it("Prevent spender to spend on behalf of the buyer due to insufficient allowance" , async () => {
			await contractInstance.approveCertificate(contractInstance.address, buyer, "Approval", "The buyer has been approved", 1671461820 ,'https://mock_link_to_document.com' ,{from: certificateSigner});
			const transfer = await contractInstance.transferWithData(buyer, 10**4, example_doc, {from: originalOwner});
			await contractInstance.approveCertificate(contractInstance.address, spender, "Approval", "The buyer has been approved", 1671461820 ,'https://mock_link_to_document.com' ,{from: certificateSigner});			
			await contractInstance.approve(spender, 10**2, {from: buyer});
			await utils.shouldThrow(contractInstance.transferFromWithData(buyer, spender, 10**4, example_doc, {from: spender}));

		})
	})
	
})
