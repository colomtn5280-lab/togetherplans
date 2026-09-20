// Jest mock for expo-server-sdk (ESM-only package — cannot be required in CommonJS Jest environment)
// Push notification sending is an integration concern; unit tests mock it here.

export class Expo {
  static isExpoPushToken(_token: string): boolean {
    return true;
  }

  chunkPushNotifications(messages: unknown[]): unknown[][] {
    return [messages];
  }

  async sendPushNotificationsAsync(_chunk: unknown[]): Promise<unknown[]> {
    return [];
  }
}

export default Expo;
