export const abi = {
  'nested': {
    'Request': {
      'fields': {
        'id': {
          'type': 'bytes',
            'id': 1
        },
        'data': {
          'type': 'bytes',
            'id': 2
        }
      }
    },
    'Response': {
      'fields': {
        'id': {
          'type': 'bytes',
            'id': 1
        },
        'error': {
          'type': 'ErrorCode',
            'id': 2
        },
        'data': {
          'type': 'bytes',
            'id': 3
        }
      },
      'nested': {
        'ErrorCode': {
          'values': {
            'NONE': 0,
              'BAD_REQUEST': 1,
              'NOT_LISTENING': 2,
              'RUNTIME_ERROR': 3
          }
        }
      }
    },
    'Error': {
      'fields': {
        'message': {
          'type': 'string',
            'id': 1
        }
      }
    }
  }
};
