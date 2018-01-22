pragma solidity ^0.4.15;

contract DDS {
    mapping (string => string) private dataStorage;
    
    function DDS() public {}
    
    function exists(string id) public constant returns(bool exists) {
        exists = bytes(dataStorage[id]).length == 0;
    }
    
    function store(string id, string data) public {
        if(!exists(id)) {
            dataStorage[id] = data;
        }
    }
    
    function read(string id) public constant returns(string data) {
        data = dataStorage[id];
    }
}