import * as Haptics from 'expo-haptics';

function safelyRun(feedback: Promise<void>) {
  void feedback.catch(() => {
    // Haptics are enhancement-only and may be unavailable on some devices or web.
  });
}

export function notifySelection() {
  safelyRun(Haptics.selectionAsync());
}

export function notifySuccess() {
  safelyRun(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function notifyWarning() {
  safelyRun(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
