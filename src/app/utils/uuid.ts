import v5 from 'uuid/v5';
import v4 from 'uuid/v4';

const serviceId = '57b23ea7-26b9-47c4-bd90-eb0664df26a0';

export function randomUuid() {
  return v4();
}

export function uuidFrom(nonce: string | Buffer): string {
  if (Buffer.isBuffer(nonce)) {
    return v5(nonce.toJSON().data, serviceId);
  } else {
    return v5(nonce, serviceId);
  }
}
