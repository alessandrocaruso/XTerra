pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";


contract APIConsumer is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    string public price;
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    address private _address;


    constructor() {
        setPublicChainlinkToken();
        oracle = 0x56dd6586DB0D08c6Ce7B2f2805af28616E082455;
        jobId = "e7beed14d06d477192ef30edc72557b1";
        fee = 0.1 * 10 ** 18; // (Varies by network and job)
    }

    function requestVolumeData() public returns (bytes32 requestId)
    {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

        // Set the URL to perform the GET request on
        request.add("get", "http://bdcd-82-60-4-42.ngrok.io//ginevra-listing-estimated?square_footage=160&rooms=6&floor=5&building_floors=5&new_building=0&class=Appartamento&lng=6.122097&lat=46.20785");


        // Sends the request
        return sendChainlinkRequestTo(oracle, request, fee);
    }

    /**
     * Receive the response in the form of uint256
     */
    function fulfill(bytes32 _requestId, string memory _price) public recordChainlinkFulfillment(_requestId)
    {
        price = _price;
    }

    // function withdrawLink() external {} - Implement a withdraw function to avoid locking your LINK in the contract
}

