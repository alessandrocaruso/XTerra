// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./roles/CertificateSignerRole.sol"; 


contract CertificateSigner is CertificateSignerRole {


    // do need to figure out if such representation is enough, add URI
    struct Certificate {
        bytes32 id;
        address certCreator;
        string certName;
        string certDescription;
        string docURI;
        uint256 issuedDate;
        uint256 expiredDate;
   }

   mapping(address => mapping (address => Certificate)) public certificateListByAddress; // map token to user address to certificate


   event CreateCertificate(bytes32 certId, address indexed approvedUser, string docURI);


   //user must have an approved certificate
   modifier hasValidCertificate(address token, address user) {
        require(certificateListByAddress[token][user].expiredDate != 0, "The account has not been approved yet, cannot execute transaction.");
        require(certificateListByAddress[token][user].expiredDate >= block.timestamp, "The certificate has expired, please fill in a new form");
        _;
    }

   function approveCertificate(address _token, address _user, string memory _certName, string memory _certDescription, uint256 _expiredDate, string memory _docURI) public onlyCertificateSigner(_token) {
        bytes32 uniqueCertId = keccak256(abi.encodePacked(_certName, msg.sender)); // create a unique id for each issued certificate
        uint256 _issueDate = block.timestamp;
        Certificate memory newCert = Certificate(uniqueCertId, msg.sender, _certName, _certDescription, _docURI, _issueDate , _expiredDate);
        certificateListByAddress[_token][_user]= newCert;
        emit CreateCertificate(uniqueCertId, _user, _docURI);
    }

   //obtain info regarding your certificate
   function viewCertificateInfo (address _token, address _user) public view returns (address, string memory, string memory, string memory, uint256, uint256) {
        require(isCertificateSigner(_token, msg.sender) || msg.sender == _user );
        require(certificateListByAddress[_token][_user].expiredDate != 0, "The account has not been approved yet." );
        Certificate memory certificate = certificateListByAddress[_token][msg.sender];
        return (certificate.certCreator, certificate.certName, certificate.certDescription, certificate.docURI, certificate.issuedDate, certificate.expiredDate);
    }


}