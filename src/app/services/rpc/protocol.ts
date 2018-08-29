export const abi = {
  'nested': {
    'RpcCall': {
      'fields': {
        'method': {
          'type': 'string',
          'id': 1
        },
        'data': {
          'type': 'bytes',
          'id': 2
        }
      }
    },
    'RpcService': {
      'methods': {
        'Capabilities': {
          'requestType': 'CapabilitiesRequest',
          'responseType': 'CapabilitiesResponse'
        },
        'Handshake': {
          'requestType': 'HandshakeRequest',
          'responseType': 'HandshakeResponse'
        }
      }
    },
    'CapabilitiesRequest': {
      'fields': {}
    },
    'CapabilitiesResponse': {
      'fields': {
        'appVersionMajor': {
          'type': 'int32',
          'id': 1
        },
        'appVersionMinor': {
          'type': 'int32',
          'id': 2
        },
        'appVersionPatch': {
          'type': 'int32',
          'id': 3
        },
        'supportedProtocolVersions': {
          'rule': 'repeated',
          'type': 'int32',
          'id': 4
        }
      }
    },
    'HandshakeRequest': {
      'fields': {
        'sessionId': {
          'type': 'bytes',
          'id': 1
        }
      }
    },
    'HandshakeResponse': {
      'fields': {
        'known': {
          'type': 'bool',
          'id': 1
        },
        'sessionId': {
          'type': 'bytes',
          'id': 2
        }
      }
    }
  }
};
