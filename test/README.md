# Testing the functionality of the primary market

The respective files that can be found in this folder test the primary market functionality of the asset tokenization using a template housing property. The testing procedure is split into two parts. Firstly, the initiation of a new contract representing the asset is assessed using file ```1.Initiation.js```. Secondly, the functionalities associated with primary market behavior are put under investigation using file ```2.ERC1400.js```. 

On top of that, two additional files stored in folders **helpers** and **node_modules** are provided and utilized during the testing to assert whether a certain function results in revert, if desired, as well as to create hashing of text strings respectively. The choice to separate these functions away from the main testing files was made to increase readability.  

>It should be noted that for the following tests, [truffle environment](https://github.com/trufflesuite/truffle) was used. In order to replicate the testing procedure in an appropriate matter, the user must use the truffle configuration file that can be found in test folder under the name ```truffle-config.js```.  Additionally, in order to execute local testing in a safe manner, as well as to obtain mock public addresses representing potential users of the product, a command line tool ```ganache-CLI``` is utilized.

## Testing contract initiation using ```1.Initiation.js```

As outlined above, the first test assesses whether the contract is initiated in an appropriate manner. Given that each performed test will initiate a creation of a new contract, it was decided for better readability to include certain functionalities into a **beforeEach** hook that will trigger itself as the first thing when any test is performed. The code is summarized in a snippet below.

	beforeEach(async () => {
		registryInstance = await ERC1820Registry.new({from: issuer});
        	contractInstance = await ERC1400.new('HouseToken','HT',10**3, [controller], 
                           [defaultPartition_0], [certificateSigner], {from: issuer});
		await contractInstance.setERC1820(registryInstance.address, {from: issuer});
		await contractInstance.setInterface({from: issuer});

As can be observed from the code snippet, the first step in contract creation requires an initiation of ERC1820 registry that will be responsible for tracking of functions that the ERC1400 contract implements as well as of changes & migrations made to the given contract. Secondly, the actual ERC1400 contract representing asset tokenization is initiated using template house name, template token symbol & granularity, hash representation of default token partition and mock addresses for controllers & certificate signers. The contract is created by a mock issuer, which should represent a XTerra employee. Lastly, helper functions that set up ERC1820 in a desired manner are equally triggered by the XTerra issuer.


#### Asserting appropriate contract initiation, initial document handling and partition enlargement
Firstly, it is essential to understand whether all variables defined during ERC1400 contract initiation have been stored correctly and can be retrieved with the appropriate functions. Thus, the first test puts this under examination.

Secondly, once the contract is initiated the issuer must attach a document containing information on the property itself as well as the property's financial report that is then emitted on the blockchain so that any regulator can access this information if needed. Thus, the second test focuses on asserting proper functioning of functions relevant for document handling.

Lastly, it might be desirable to have multiple partitions of the token available, e.g., for the purpose of asset collateralization. Therefore, the contract must be able to update its set of partition even after contract initiation and the third test is examining exactly that.

#### Testing the issuance of initial coins that are to be sold in primary market
The second set of tests asserts an appropriate issuance of coins to be sold to initial investors given that the process must adhere to certain regulatory standards. Firstly, the coins can be issued only once the original owner of the property finalizes KYC and AML procedures with XTerra, thus qualifying as trustworthy individual. At the same time the issuance of the coins must materialize within time horizon when the KYC and AML certificates provided to the asset owner are still valid. Finally, the coins must be issued by XTerra employee who will at the issuance transfer all of them to the original property owner.

# Testing functionalities associated with primary market behavior using ```2.ERC1400.js```
Once it can be assured that the ERC1820 and ERC1400 are created in a desired manner, it is time to start investigating whether all functions necessary for primary market functioning work as anticipated.

Similarly to before, a **beforeEach** hook representing the initiation of the ERC1820 and ERC1400 is included to be triggered at the start of each of the tests. The hook used above is enlarged by additional functions that firstly emit on the blockchain the necessary document related to the property, secondly perform KYC and AML for the original owner of the property and lastly issue original coins that are directly transferred into ownership of the original property owner. The final version of the hook is provided in the code snippet below.

	beforeEach(async () => {
		registryInstance = await ERC1820Registry.new({from: issuer});
        	contractInstance = await ERC1400.new('HouseToken','HT',10**2, [controller],
        	[defaultPartition_0, defaultPartition_1],[certificateSigner], {from: issuer});
		await contractInstance.setERC1820(registryInstance.address, {from: issuer});
		await contractInstance.setInterface({from: issuer});
		await contractInstance.setDocument( doc_name,'https://mock_link_to_document.com', 
		doc_hash, {from: controller});
		await contractInstance.approveCertificate(contractInstance.address, originalOwner, 
		"Approval", "The originalOwner has been	approved",1671461820,
		'https://mock_link_to_document.com' ,{from: certificateSigner});
		let issuance_info = base + CryptoJS.SHA256("Additional info atatched to the 
		issuance").toString();
		await contractInstance.issue(originalOwner, 10**6, issuance_info, {from: issuer});
    });

#### Asserting state of variables after initial coins are minted
Firstly, it is crucial to assess whether the total supply of the coins after the issuance corresponds to the amount defined during the issuance. Similarly, it is necessary to check that all the coins are initially held by the original owner of the asset and that any potential buyer comes into the primary market with zero holdings.

#### Asserting the functionality of adding & reading & removing documents related to the underlying asset
It can be anticipated that for some property assets the documents emitted on the chain will need to be updated to carry the most recent information or new documents will have to added to comply with regulations. At the same time, some documents might become irrelevant and thus, it is necessary to have a functionality in place that can remove such documents from the blockchain. Finally, it is crucial that such operations can be performed only be a controller or original contract issuer that are certified valid by XTerra to prevent malicious behavior of users. Thus, the second set of tests puts all of this under investigation.

#### Testing the ability to create and remove operators for various accounts
The individual investors who purchase a part of the asset in the primary market have the ability to define operators- blockchain accounts that are able to perform operations & transfers on behalf of these users. Such operators could be defined by the investors globally (for all existing token partitions) or locally (only for certain partition, e.g., collateralization). At the same time, the users must have the ability to remove the operators if desired and the operators must be able to renounce their position if needed. Therefore, the third set of tests focuses on these functionalities.

#### Testing the ability to perform transfers across accounts
The most crucial part of the primary market functioning is the ability to execute transfers from the original asset owner to the investors. For a transfer to be valid, all interested investors have to undergo KYC and AML and have their certificate issued and not yet expired. At the same time, it must be possible for the original owner to specify a partition from which the coins shall be transferred in case multiple partitions exists. Moreover, the original owner must not be able to transfer more coins than he currently owns. Lastly, in case of a regulatory breach a controller certified by XTerra must be able to perform transfers on behalf of the users.

#### Testing the ability to perform transfers across accounts for ERC20 interface
The final set of tests puts under investigation the functionalities that have to be implemented for WORD?? with ERC20 interface. The users must be able to define spender accounts who can spend on their behalf (very similar role to that of the operator but with less powers) and such spenders must be able to spend only up to the amount defined by the original user. 


















 
