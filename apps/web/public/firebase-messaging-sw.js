importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    // Background messages: build notification from data payload (data-only FCM)
    messaging.onBackgroundMessage((payload) => {
      const title = payload.data?.title ?? 'MealShare';
      const body = payload.data?.body ?? '';
      self.registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        data: payload.data,
      });
    });
  }
});
