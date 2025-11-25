import type { NotificationType } from "@/app/contexts/NotificationContext";

// Global notification handler
let _notificationHandler: ((type: NotificationType, message: string) => void) | null = null;

export const notification = {
  setHandler(handler: (type: NotificationType, message: string) => void) {
    _notificationHandler = handler;
  },
  show(type: NotificationType, message: string) {
    if (_notificationHandler) {
      _notificationHandler(type, message);
    }
  },
  error(message: string) {
    this.show("error", message);
  },
  success(message: string) {
    this.show("success", message);
  },
  info(message: string) {
    this.show("info", message);
  },
};
