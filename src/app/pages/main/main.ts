import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Observable } from 'rxjs';
import { ChatContentComponent } from '../../components/chat-content/chat-content';
import { ChatHeader } from '../../components/chat-header/chat-header';
import { ChatInputComponent } from '../../components/chat-input/chat-input';
import { ChatList } from '../../components/chat-list/chat-list';
import { ChatStateService } from '../../services/chat-state.service';
import { MessageStateService } from '../../services/message-state.service';
import { ChatResponse, MessageRequest, MessageResponse } from '../../services/models';
import { NotificationService } from '../../services/notification.service';
import { MessageService } from '../../services/services';
import { WebSocketService } from '../../services/web-socket.service';
import { KeycloakService } from '../../utils/keycloak/KeycloakService';

@Component({
  selector: 'app-main',
  imports: [
    ChatList,
    CommonModule,
    FormsModule,
    ChatContentComponent,
    ChatInputComponent,
    ChatHeader,
  ],
  templateUrl: './main.html',
  styleUrl: './main.scss',
  standalone: true,
})
export class Main implements OnInit, OnDestroy {
  chats$: Observable<ChatResponse[]>;
  selectedChat$: Observable<ChatResponse>;
  messages$: Observable<MessageResponse[]>;

  constructor(
    private webSocketService: WebSocketService,
    private chatStateService: ChatStateService,
    private messageStateService: MessageStateService,
    private messageService: MessageService,
    private keycloak: KeycloakService,
    private notificationService: NotificationService,
  ) {
    this.chats$ = this.chatStateService.chats$;
    this.selectedChat$ = this.chatStateService.selectedChat$;
    this.messages$ = this.messageStateService.messages$;
  }

  ngOnInit(): void {
    this.chatStateService.loadChats();
    this.webSocketService.connect();
  }

  ngOnDestroy(): void {
    this.webSocketService.disconnect();
  }

  onSelectChat(chat: ChatResponse) {
    this.chatStateService.selectedChat = chat;
    this.messageStateService.loadMessages(chat.id as string);
    this.messageStateService.readAllMessages(chat.id as string);
    chat.unreadCount = 0;
  }

  sendMessage(messageRequest: MessageRequest) {
    this.messageService.sendMessage({ body: messageRequest }).subscribe(() => {
      // after sending message, update the chat and message state
      this.chatStateService.loadChats();
      this.messageStateService.loadMessages(messageRequest.chatId as string);
    });
  }

  uploadMedia(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        this.messageService
          .uploadFile({
            'chat-id': this.chatStateService.selectedChat.id as string,
            body: {
              file: file,
            },
          })
          .subscribe(() => {
            this.messageStateService.loadMessages(this.chatStateService.selectedChat.id as string);
          });
      }
    };
    reader.readAsDataURL(file);
  }

  userProfile() {
    this.keycloak.accountManagement();
  }

  logout() {
    this.keycloak.logout();
  }
}
