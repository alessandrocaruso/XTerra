var CryptoJS  = require("./node_modules/crypto-js");
const ERC1400 = artifacts.require("ERC1400");
const ERC1820Registry = artifacts.require("ERC1820Registry");
var expect = require('chai').expect;
const utils = require("./helpers/utils");
let base = "0x";

contract("ERC1400_initiation", (accounts) => {

    let [issuer, originalOwner, buyer1, buyer2, operator, controller, certificateSigner ] = accounts;
	let registryInstance;
	let contractInstance;
	let defaultPartition_0 = base + CryptoJS.SHA256("defaultPartition_0").toString();
	let defaultPartition_1 = base + CryptoJS.SHA256("defaultPartition_1").toString();
	
	
	beforeEach(async () => {
		registryInstance = await ERC1820Registry.new({from: issuer});
        	contractInstance = await ERC1400.new('HouseToken','HT',10**3, [controller], [defaultPartition_0], [certificateSigner], {from: issuer});
		await contractInstance.setERC1820(registryInstance.address, {from: issuer});
		await contractInstance.setInterface({from: issuer});
    });

	context("Testing the contract initiation and inital document handling", async () => {
	
		it("Asserting whether all state variables have been initiated correctly" , async () => {
			const name = await contractInstance.domainName()
			expect(name).to.equal('HouseToken');
			const symbol = await contractInstance.symbol();
			expect(symbol).to.equal('HT');
			const granularity = await contractInstance.granularity();
			expect(granularity.toString()).to.equal((10**3).toString());
			const controllers = await contractInstance.controllers();
			expect(controllers[0]).to.equal(controller);
			const totalSupply = await contractInstance.totalSupply();
			expect(totalSupply.toString()).to.equal((0).toString());
			const signer = await contractInstance.isCertificateSigner(contractInstance.address, certificateSigner);
			expect(signer).to.equal(true);	
		})
		
		it("Adding documents relating to the property description" , async () => {
			let doc_name = base + CryptoJS.SHA256("House name").toString();
			let doc_hash = base + CryptoJS.SHA256("House descritpiton hash").toString();
			const result = await contractInstance.setDocument(doc_name, 'https://mock_link_to_document.com' , doc_hash, {from: controller});
			expect(result.logs[0].args.documentHash).to.equal(doc_hash); //check that the result was correctly emitted
			const doc = await contractInstance.getDocument(doc_name); 
			expect(doc[1]).to.equal(doc_hash); //check that the mapping has registered new document, more tests will follow
		})
		
		it("Enlarge default partition setting to include multiple partitions" , async () => {
			await contractInstance.setDefaultPartitions([defaultPartition_0, defaultPartition_1], {from: issuer});
		})
		
	})
	
	context("Testing the functionality after inital coins are minted", async () => {
	
		it("Prevent from issuing coins as non-owner" , async () => {
			let issuance_info = base + CryptoJS.SHA256("Additional info atatched to the issuance").toString();
			await utils.shouldThrow(contractInstance.issue(originalOwner, 10**6, issuance_info, {from: originalOwner}));
		})
		
		it("Prevent from issuing if the originalOwner has not completed KYC" , async () => {
			let issuance_info = base + CryptoJS.SHA256("Additional info atatched to the issuance").toString();
			await utils.shouldThrow(contractInstance.issue(originalOwner, 10**6, issuance_info,{from: issuer}));
		})
		
		it("Prevent from issuing if the originalOwner has expired certificate" , async () => {
			let issuance_info = base + CryptoJS.SHA256("Additional info atatched to the issuance").toString();
			const approval = await contractInstance.approveCertificate(contractInstance.address, originalOwner, "Approval", "The originalOwner has been approved", 100 ,'https://mock_link_to_document.com' ,{from: certificateSigner});
			await utils.shouldThrow(contractInstance.issue(originalOwner, 10**6, issuance_info,{from: issuer}));
		})
		
		it("Issue newly minted token by an issuer who has completed KYC" , async () => {
			let issuance_info = base + CryptoJS.SHA256("Additional info atatched to the issuance").toString();
			const approval = await contractInstance.approveCertificate(contractInstance.address, originalOwner, "Approval", "The originalOwner has been approved", 1671461820 ,'https://mock_link_to_document.com' ,{from: certificateSigner});
			expect(approval.receipt.status).to.equal(true);
			
			const issuance = await contractInstance.issue(originalOwner, 10**6, issuance_info, {from: issuer});
			expect(issuance.receipt.status).to.equal(true);
		})
					
	})
	
	
})
