pragma solidity ^0.4.18;

contract DDS {
    mapping (string => bytes) private dataStorage;
    
    function exists(string id) public constant returns(bool) {
        return dataStorage[id].length != 0;
    }
    
    function store(string id, bytes data) public {
        require(!exists(id));
        dataStorage[id] = data;
    }
    
    function read(string id) public constant returns(bytes data) {
        data = dataStorage[id];
    }
}