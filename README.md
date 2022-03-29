# XTerra
This is the official repository of XTerra

## Description: 
This repository contains all relevant code and information required for the XTerra project. In particular, the following files/folders should be given special attention: 

1. Solidity Contracts: 
   a) contracts/ERC1400.sol - Real estate token framework
   b) contracts/tools/DVP.sol - Marketplace code
   c) Several supporting contracts
2. Tests
3. Real Estate Pricing Model and Oracle 
   a) listingscraper
   b) oracle
4. Supporting Documents
   a) XTerra_Whitepaper.pdf
   b) XTerra_Presentation.pdf

Each of the above mentioned sections contains its own Readme providing all the necessary information on the functionalities that have been created or changed and any other information necessary to the specific sections. 

Excecution: 
1. Solidity code and Testing 
   The Solidity contracts are correctly implemented and deployable. The tests folder provides a detailled Readme on how to deploy and execute the each of the contracts and should be used in order to best understand the functionalities, as well as edge cases. 
2. Pricing Model and Oracle 
   As the DVP.sol marketplace does currently not integrate the pricing model and oracle that has been created, this section can be checked as a stand alone with the guidelines as follows: 
   The *listingscraper* folder contains the coding infrastructure built through Scrapy used to crawl hundreds of Geneva listings from the real estate listings website of https://www.newhome.ch/it/home . In order to be able to launch a scraping session it is sufficient to run the following command:

  -- scrapy crawl ginevra-listings -o csv_name.csv

  The command will generate a csv file which contains information about the real estate listings which will then be used to create a statistical estimator able to forecast the house price of a new sold asset in the blockchain.

  The *oracle* folder contains the code for data cleaning, feature engineering and modeling part where ultimately a RandomForestRegressor is tuned on the previously scraped and now cross-validated assets. 

  Finally, the Flask framework is used to generate a response (which contains the Random Forest Estimate) to the GET request launched in-chain in the Oracle which provides all the necessary input for the model among which the coordinate of the house ultimately pinpointed through a shapefile into the administrative district of Geneva.
  
  
## Whats been achieved?
1. Fully functioning and deployable Real Estate Token code that requires only different input variables for different listings
2. Fully functioning primary asset sale, as well as implemented secondary market functionalities
3. Real Estate Token tested and all different edge cases ensured to be working correctly
4. Primary and secondary market sales tests initiated and currently under fully trial
5. Real Estate listing scraper and pricing oracle fully implemented and ready to be connected to market place
6. Whitepaper first draft created and pitch deck slides provided

## What are the next steps? 
1. Incorporate pricing oracle and the value of different coins to be traded into the DVP.sol contract
2. Finalise testing of DVP.sol
3. Development of front-end application and back-end code
4. Building of the governance structure required to handle the ongoing managed of the token
5. Building of rental payouts and other ongoing functionalities beyond secondary market sales
6. Search for potential partners, both Investors and real estate platforms looking to offer their properties
   


