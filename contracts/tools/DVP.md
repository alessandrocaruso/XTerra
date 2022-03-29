![Codefi](../../images/DVP/codefi.png)

# Delivery-vs-payment smart contract description

The below explains the adjustments taken to the DVP to allow specific functionalities required in order to facilitate the primary sale of the asset. From the Objective section onwards, this file is as provided by Consensys. 

The current implementation of the DVP, while supporting a wide range of functionalities, supports only Escrow trades for XTerra. This is because currently only a specific set of functionalities is ensured to be working for Real Estate tokens. The secondary market functionalities are still to be checked and fully developed before ready for deployment. 

The process of the primary sale of any Real Estate Token has been implemented and finalised by the XTerra team and is defined below. Hence, at the current stage, XTerra is capability of facilitating an initial sale of a real estate asset but without seemless possibility to retrade the token on the secondary market. Indeed, should one which to sell their token. XTerra will need to be contacted to arrange such a trade

1. Listing Date
   Creation of the ERC1400 contract with an address, with the original owner being the holder of 100% of the minted tokens. 
2. Selling Period
   Interested buyers can submit purchase requests onto the platform, which are executed using the RequestTrade function, where a request is created without the specification of any holder. Requests can be made as long as the requests do not exceed total supply, which is currently checked off-chain. This might actually have to come from on-chain to prevent people making requests outside of the platform thereby potentially exceeding the limit of totalbalance. 
3. Sale Date
   Amount of tokens sold gets evaluated using the computePropertyOffer function. Based on this value, the three scenarios are evaluated. Firstly, if the threshold X has not been achieved, the token does not get sold, in which case all of the users can simply cancel their trades (cancelTrade function) and thereby take the money out of the DVP contract. If the threshold has been achieved but the token is not sold 100%, XTerra will issue a final trade request to purchase the remaining balance of the real estate token. If the token has been fully sold, the sale will proceed without any extra step. The sale proceeds a code that will accept all trades for the real estate token on behalf of the seller. Furthermore, controllers will approve and validate each of the trades before finally executing the trades on the buyers/sellers behalf. The enableExecution function takes care of this process making use of another 2 internal functions that have been built for this purpose. 
   
## Deployment
The steps for correct implementation are as follows: 

1. Deploy ERC1820Registry.sol
2. Deploy DVP.sol
3. Set controllers of Stablecoin token - requires address of USDTether
4. Deploy ERC1400.sol - correct steps for deployment provided in ERC1400.md
5. Set controllers of ERC1400 token trades
6. Test functions and request/make trades from Stablecoin to ERC1400
   
   
## Objective

The purpose of the contract is to allow secure token transfers/exchanges between 2 stakeholders (called holder1 and holder2).
It is used for secondary market assets transfers.

From now on, an operation in the DVP smart contract (transfer/exchange) is called a trade.
Depending on the type of trade, one/multiple token transfers will be executed.

## How does it work?

The simplified workflow is the following:
1. A trade request is created in the DVP smart contract, it specifies:
```
- The token holder(s) involved in the trade
- The trade executer (optional)
- An expiration date
- Details on the first token (address, requested amount, standard)
- Details on the second token (address, requested amount, standard)
- Whether the tokens need to be escrowed in the DVP contract or not
- The current status of the trade (pending / executed / forced / cancelled)
```
2. The trade is accepted by both token holders
3. [OPTIONAL] The trade is approved by token controllers (only if requested by tokens controllers)
4. The trade is executed (either by the executer in case the executer is specified, or by anyone)

![dvp](../../images/DVP/dvp.png)

# Features

#### Standard-agnostic
The DVP smart contract is standard-agnostic, it supports ETH, ERC20, ERC721, ERC1400.
The advantage of using an ERC1400 token is to leverages its hook property, thus requiring ONE single
transaction (operatorTransferByPartition()) to send tokens to the DVP smart contract instead of TWO
with the ERC20 token standard (approve() + transferFrom()).

#### Off-chain payment
The contract can be used as escrow contract while waiting for an off-chain payment.
Once payment is received off-chain, the token sender realeases the tokens escrowed in
the DVP contract to deliver them to the recipient.

#### Escrow vs swap mode
In case escrow mode is selected, tokens need to be escrowed in DVP smart contract
before the trade can occur.
In case swap mode is selected, tokens are not escrowed in the DVP. Instead, the DVP
contract is only allowed to transfer tokens ON BEHALF of their owners. When trade is
executed, an atomic token swap occurs.

#### Expiration date
The trade can be cancelled by both parties in case expiration date is passed.

#### Claims
The executer has the ability to force or cancel the trade.
In case of disagreement/missing payment, both parties can contact the "executer"
of the trade to deposit a claim and solve the issue.

#### Marketplace
The contract can be used as a token marketplace. Indeed, when trades are created
without specifying the recipient address, anyone can purchase them by sending
the requested payment in exchange.

#### Price oracles
When price oracles are defined, those can define the price at which trades need to be executed.
This feature is particularly useful for assets with NAV (net asset value).


# Use case examples

The DVP contract can be used for multiple use cases:

### Use case 1: Tokens are escrowed in the DVP contract while payment is made off-chain

![UseCase1](../../images/DVP/usecase1.png)

### Use case 2: Tokens are escrowed in the DVP contract while payment is made on-chain (with another token)

![UseCase2](../../images/DVP/usecase2.png)

### Use case 3: Swap authorization is provided to the DVP contract, but tokens are not escrowed in the DVP contract

![UseCase3](../../images/DVP/usecase3.png)

### Use case 4: Marketplace

![UseCase4](../../images/DVP/usecase4.png)
