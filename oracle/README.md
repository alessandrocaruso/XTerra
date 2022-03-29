In this branch it is contained the code relative to the Oracle, which is the Blockchain architecture which uses Chainlink to send a receive data via GET and POST Http requests to connect off-chain stored data to on-chain stored data. 

The code relative to the proper oracle is contained in the file scheleton_oracle.sol

The file model.py takes as input the scraped real estate listings (see relative Read Me) and makes the following pre processing operations:
   *  Parsing of JSON inside the file
   *  Data Cleaning
   *  Feature Engineering of the variables
   *  Null Values Imputation via Regression

Once these operations are completed, it tunes via 4-fold cross Validation with GridSearch the hyperparaements of a Random Forest Regressor which predicts the price using the following variables:
   * square_footage 
   * rooms 
   * floor number 
   * number of building floors 
   * building age
   * asset class
   * asset LOCATION

Finally, the request.py file uses the flask framework and Ngrok Service (a tunneling service) to be able to connect the output of the forecasting model to the HTTP GET request which provides the characteristics of the house one wants the prediction of. It uses the shapefile of the administrative Geneva segmentation to pinpoint the coordinate of the asset into ad administrative area.
