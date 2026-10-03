import { GridAlert, AlertChannel, HouseDeliveryState } from '../../types/alert';
import { DLT_SMS_TEMPLATES } from '../../data/smsTemplates';

export interface NotificationPayload {
  alert: GridAlert;
  houseId: string;
  houseLabel: string;
  phone: string;
  channel: AlertChannel;
}

export interface NotificationResult {
  success: boolean;
  providerMessageId: string;
  deliveredAt: string;
  channel: AlertChannel;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationResult>;
}

export class MockNotificationProvider implements NotificationProvider {
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // Simulate slight carrier latency (40-120ms)
    await new Promise((r) => setTimeout(r, 60));
    return {
      success: true,
      providerMessageId: `msg-${payload.channel}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      deliveredAt: new Date().toISOString(),
      channel: payload.channel,
    };
  }
}

/**
 * Multi-channel Notification Engine with Escalation Policy
 */
export class NotificationService {
  private provider: NotificationProvider = new MockNotificationProvider();

  /**
   * Dispatches alerts to a list of registered houses according to severity escalation:
   * - info / advisory: in_app + push
   * - warning: push + telegram / whatsapp
   * - critical: push + telegram / whatsapp + SMS
   */
  async dispatchAlert(
    alert: GridAlert,
    houses: Array<{ id: string; label: string; ownerName: string; phone: string; channels: AlertChannel[] }>
  ): Promise<HouseDeliveryState[]> {
    const results: HouseDeliveryState[] = [];

    // Severity escalation logic
    let allowedChannels: AlertChannel[] = ['in_app', 'push'];
    if (alert.severity === 'warning') {
      allowedChannels = ['in_app', 'push', 'telegram', 'whatsapp'];
    } else if (alert.severity === 'critical') {
      allowedChannels = ['in_app', 'push', 'telegram', 'whatsapp', 'sms'];
    }

    for (const h of houses) {
      // Pick best preferred channel enabled for house that matches allowedChannels
      const targetChannel: AlertChannel =
        h.channels.find((c) => allowedChannels.includes(c)) || 'in_app';

      const res = await this.provider.send({
        alert,
        houseId: h.id,
        houseLabel: h.label,
        phone: h.phone,
        channel: targetChannel,
      });

      const maskedPhone = h.phone
        ? `+91 ${h.phone.substring(0, 2)}*** ***${h.phone.slice(-2)}`
        : 'Not registered';

      results.push({
        houseId: h.id,
        houseLabel: h.label,
        ownerName: h.ownerName,
        phoneMasked: maskedPhone,
        channel: targetChannel,
        status: res.success ? 'delivered' : 'failed',
        timestamp: res.deliveredAt,
      });
    }

    return results;
  }
}

export const notificationService = new NotificationService();
