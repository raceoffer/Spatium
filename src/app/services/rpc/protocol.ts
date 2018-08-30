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
        'RegisterSession': {
          'requestType': 'RegisterSessionRequest',
          'responseType': 'RegisterSessionResponse'
        },
        'ClearSession': {
          'requestType': 'ClearSessionRequest',
          'responseType': 'ClearSessionResponse'
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
    'RegisterSessionRequest': {
      'fields': {
        'sessionId': {
          'type': 'bytes',
          'id': 1
        }
      }
    },
    'RegisterSessionResponse': {
      'fields': {
        'existing': {
          'type': 'bool',
          'id': 1
        }
      }
    },
    'ClearSessionRequest': {
      'fields': {
        'sessionId': {
          'type': 'bytes',
          'id': 1
        }
      }
    },
    'ClearSessionResponse': {
      'fields': {
        'existing': {
          'type': 'bool',
          'id': 1
        }
      }
    }
  }
};
