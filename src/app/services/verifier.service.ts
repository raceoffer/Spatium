import { Injectable } from '@angular/core';

export class DeviceSession {
  private readonly id: Buffer;

  public constructor(id: Buffer) {
    this.id = id;
  }
}

@Injectable()
export class VerifierService {
  private sessions = new Map<string, DeviceSession>();

  public constructor() {}

  /**
   * Checks if this session Id is registered and registers it otherwise
   * @param sessionId session Id of the main device
   */
  public async registerSession(sessionId: Buffer): Promise<boolean> {
    const stringId = sessionId.toString('hex');

    if (this.sessions.has(stringId)) {
      return true;
    }

    this.sessions.set(stringId, new DeviceSession(sessionId));

    return false;
  }

  /**
   * Checks if this session Id is registered and removes it
   * @param sessionId session Id of the main device
   */
  public async clearSession(sessionId: Buffer): Promise<boolean> {
    const stringId = sessionId.toString('hex');

    if (!this.sessions.has(stringId)) {
      return false;
    }

    this.sessions.delete(stringId);

    return true;
  }
}
