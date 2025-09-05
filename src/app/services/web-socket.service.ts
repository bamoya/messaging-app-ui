
import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { KeycloakService } from '../utils/keycloak/KeycloakService';
import { BehaviorSubject } from 'rxjs';
import { Notification } from '../pages/main/models/notification';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socketClient: Client | null = null;
  private notificationSubscription: StompSubscription | null = null;
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  public notification$ = this.notificationSubject.asObservable();

  constructor(private keycloak: KeycloakService) {}

  connect(): void {
    if (this.socketClient && this.socketClient.active) {
      return;
    }
    this.initWebSocket();
  }

  disconnect(): void {
    if (this.socketClient) {
      this.socketClient.deactivate();
      this.socketClient = null;
      this.notificationSubscription = null;
    }
  }

  private initWebSocket() {
    if (this.keycloak.keycloak.tokenParsed?.sub) {
      const subUrl = `/user/${this.keycloak.keycloak.tokenParsed.sub}/chat`;

      this.socketClient = new Client({
        webSocketFactory: () => {
          return new SockJS('http://localhost:8080/ws');
        },
        connectHeaders: {
          Authorization: 'Bearer ' + this.keycloak.keycloak.token,
        },
        debug: (str) => {
          console.log(new Date(), str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame) => {
          console.log('Connected to WebSocket:', frame);
          this.notificationSubscription = this.socketClient!.subscribe(
            subUrl,
            (message: IMessage) => {
              const notification: Notification = JSON.parse(message.body);
              this.notificationSubject.next(notification);
            },
          );
        },
        onStompError: (frame) => {
          console.error('Broker reported error: ' + frame.headers['message']);
          console.error('Additional details: ' + frame.body);
        },
      });

      this.socketClient.activate();
    }
  }
}
