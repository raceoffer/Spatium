pragma solidity ^0.4.18;

contract DDS {
    struct Entry {
        address owner;
        bytes[]  data;
    }
    
    mapping (string => Entry) private dataStorage;
    
    function exists(string id) public constant returns(bool) {
        return dataStorage[id].owner != address(0);
    }
    
    function count(string id) public constant returns(uint) {
        return dataStorage[id].data.length;
    }
    
    function read(string id, uint n) public constant returns(bytes) {
        if (n >= dataStorage[id].data.length) {
			return '';
		}
        return dataStorage[id].data[n];
    }
    
    function store(string id, bytes data) public {
        if(!exists(id)) {
            dataStorage[id].owner = msg.sender;
            dataStorage[id].data.push(data);
        } else {
            require(msg.sender == dataStorage[id].owner);
            dataStorage[id].data.push(data);
        }
    }
}