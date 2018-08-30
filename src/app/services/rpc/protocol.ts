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
        },
        'SyncStatus': {
          'requestType': 'SyncStatusRequest',
          'responseType': 'SyncStatusResponse'
        },
        'StartSync': {
          'requestType': 'StartSyncRequest',
          'responseType': 'StartSyncResponse'
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
    },
    'SyncStatusRequest': {
      'fields': {
        'sessionId': {
          'type': 'bytes',
          'id': 1
        }
      }
    },
    'SyncStatusResponse': {
      'fields': {
        'statuses': {
          'rule': 'repeated',
          'type': 'SyncStatus',
          'id': 1
        }
      },
      'nested': {
        'SyncState': {
          'values': {
            'NONE': 0,
            'STARTED': 1,
            'REVEALED': 2,
            'COMMITED': 3,
            'FINALIZED': 4
          }
        },
        'SyncStatus': {
          'fields': {
            'currencyId': {
              'type': 'string',
              'id': 1
            },
            'state': {
              'type': 'SyncState',
              'id': 2
            }
          }
        }
      }
    },
    'PedersenParameters': {
      'fields': {
        'curve': {
          'type': 'string',
          'id': 1
        },
        'H': {
          'type': 'bytes',
          'id': 2
        }
      }
    },
    'PedersenCommitment': {
      'fields': {
        'curve': {
          'type': 'string',
          'id': 1
        },
        'C': {
          'type': 'bytes',
          'id': 2
        }
      }
    },
    'PedersenDecommitment': {
      'fields': {
        'curve': {
          'type': 'string',
          'id': 1
        },
        'R': {
          'type': 'bytes',
          'id': 2
        }
      }
    },
    'SchnorrProof': {
      'fields': {
        'curve': {
          'type': 'string',
          'id': 1
        },
        't': {
          'type': 'bytes',
          'id': 2
        },
        'c': {
          'type': 'bytes',
          'id': 3
        },
        's': {
          'type': 'bytes',
          'id': 4
        }
      }
    },
    'StartSyncRequest': {
      'fields': {
        'sessionId': {
          'type': 'bytes',
          'id': 1
        },
        'currencyId': {
          'type': 'string',
          'id': 2
        },
        'params': {
          'type': 'PedersenParameters',
          'id': 3
        },
        'i': {
          'type': 'PedersenCommitment',
          'id': 4
        }
      }
    },
    'StartSyncResponse': {
      'fields': {
        'Q': {
          'type': 'bytes',
          'id': 1
        },
        'proof': {
          'type': 'SchnorrProof',
          'id': 2
        }
      }
    }
  }
};
