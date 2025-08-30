import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';
import { ChatList } from '../../components/chat-list/chat-list';
import { MEDIA_MESSAGES_TYPE } from '../../constants/constants';
import { ChatResponse, MessageRequest, MessageResponse } from '../../services/models';
import { ChatService, MessageService } from '../../services/services';
import { KeycloakService } from '../../utils/keycloak/KeycloakService';
import { Notification } from './models/notification';

@Component({
  selector: 'app-main',
  imports: [ChatList, CommonModule, PickerComponent, FormsModule],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main implements OnInit, AfterViewChecked, OnDestroy {
  wrapMessage(arg0: any) {
    throw new Error('Method not implemented.');
  }
  chats: Array<ChatResponse> = [];
  selectedChat: ChatResponse = {};
  chatMessages: MessageResponse[] = [];

  private notificationSubscription: any;
  socketClient: Stomp.Client | any = null;
  showEmojis = false;
  messageContent = '';

  @ViewChild('scrollableDiv') scrollableDiv!: ElementRef<HTMLDivElement>;

  constructor(
    private chatService: ChatService,
    private keycloak: KeycloakService,
    private messageService: MessageService,
  ) {}
  ngOnDestroy(): void {
    if (this.socketClient !== null) {
      this.socketClient.disconnect();
      this.notificationSubscription.unsubscribe();
      this.socketClient = null;
    }
  }

  ngOnInit(): void {
    this.getAllChats();
    this.initWebSocket();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private getAllChats() {
    this.chatService.getUserChats().subscribe({
      next: (res) => {
        this.chats = res;
        this.sortChats();
      },
      error: (error) => {
        console.error('Error fetching chats:', error);
      },
    });
  }

  onSelectChat(chat: ChatResponse) {
    this.selectedChat = chat;
    this.getAllChatMessages(chat.id);
    this.readAllMessages(chat.id);
    this.selectedChat.unreadCount = 0;
  }

  readAllMessages(id: string | undefined) {
    if (id) {
      this.messageService.updateMessageStatusToSeen({ 'chat-id': id }).subscribe();
    }
  }

  getAllChatMessages(id: string | undefined) {
    if (id) {
      this.messageService.getChatMessages({ 'chat-id': id }).subscribe({
        next: (messages) => {
          this.chatMessages = messages;
        },
      });
    }
  }

  uploadMedia(target: EventTarget | null) {
    const file = this.extarctFileFromTarget(target);
    if (file !== null) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {

          const mediaLines = reader.result.toString().split(',')[1];

          this.messageService.uploadFile({
            'chat-id': this.selectedChat.id as string,
            body: {
              file: file
            }
          }).subscribe({
            next: () => {
              const message: MessageResponse = {
                senderId: this.getSenderId(),
                receiverId: this.selectedChat.receiverId,
                content: 'Attachment',
                type: 'IMAGE',
                state: 'SENT',
                media: [mediaLines],
                createdAt: new Date().toString()
              };
              this.chatMessages.push(message);
              
            }
          });
        }
      }
      reader.readAsDataURL(file);
    }
  }

  extarctFileFromTarget(target: EventTarget | null) {
    const htmlInputTarget = target as HTMLInputElement;
    if (target === null || htmlInputTarget.files === null) {
      return null;
    }
    return htmlInputTarget.files[0];
  }

  isSelfMessage(message: MessageResponse) {
    return message.senderId === this.keycloak.userId;
  }

  userProfile() {
    this.keycloak.accountManagement();
  }

  logout() {
    this.keycloak.logout();
  }

  onSelectEmojis(event: any) {
    this.messageContent += event.emoji.native;
  }

  sendMessage() {
    if (this.messageContent && this.selectedChat.id) {
      const messageRequest: MessageRequest = {
        content: this.messageContent,
        chatId: this.selectedChat.id,
        type: 'TEXT',
      };
      this.messageService.sendMessage({ body: messageRequest }).subscribe({
        next: (response: any) => {
          const now = Date.now().toString();
          const message: MessageResponse = {
            ...messageRequest,
            senderId: this.getSenderId(),
            receiverId: this.getReciepientId(this.selectedChat),
            state: 'SENT',
            createdAt: now,
          };

          this.chatMessages.push(message);
          this.selectedChat.lastMessage = this.messageContent;
          this.selectedChat.lastMessageTime = now;
          this.messageContent = '';
          this.sortChats();
        },
      });
    }
  }

  keyDown(event: any) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  getSenderId(): string {
    return this.keycloak.userId;
  }
  getReciepientId(chat: ChatResponse): string {
    return chat.senderId === this.keycloak.userId
      ? (chat.receiverId as string)
      : (chat.senderId as string);
  }

  private scrollToBottom() {
    if (this.scrollableDiv) {
      const div = this.scrollableDiv.nativeElement;
      div.scrollTop = div.scrollHeight;
    }
  }

  private initWebSocket() {
    if (this.keycloak.keycloak.tokenParsed?.sub) {
      let ws = new SockJS('http://localhost:8080/ws');
      this.socketClient = Stomp.over(ws);
      const subUrl = `/user/${this.keycloak.keycloak.tokenParsed?.sub}/chat`;
      this.socketClient.connect({ Authorization: 'Bearer ' + this.keycloak.keycloak.token }, () => {
        this.notificationSubscription = this.socketClient.subscribe(
          subUrl,
          (message: any) => {
            const notification: Notification = JSON.parse(message.body);
            this.handleNotification(notification);
          },
          () => console.error('Error while connecting to webSocket'),
        );
      });
    }
  }
  handleNotification(notification: Notification) {
    if (!notification) {
      return;
    }
    const { chatId, chatName, receiverId, senderId, type, messageType, content, media, createdAt } =
      notification;
    if (chatId && chatId === this.selectedChat.id) {
      switch (type) {
        case 'SEEN':
          this.chatMessages.forEach((m) => (m.state = 'SEEN'));
          break;
        case 'MESSAGE':
          const newMessage: MessageResponse = {
            senderId: senderId,
            receiverId: receiverId,
            content: content,
            type: messageType,
            media: media,
            createdAt: createdAt,
          };
          if (messageType && MEDIA_MESSAGES_TYPE.includes(messageType?.toString())) {
            this.selectedChat.lastMessage = 'Attachment';
          } else if (messageType === 'TEXT') {
            this.selectedChat.lastMessage = content;
          }
          this.selectedChat.lastMessageTime = createdAt;
          this.chatMessages.push(newMessage);

          // if you are in the conversation then set messages to seen
          this.chatMessages.forEach((m) => (m.state = 'SEEN'));
          this.readAllMessages(chatId);
          this.sortChats();
          break;
      }
    } else if (chatId && this.chats.find((chat) => chat.id === chatId)) {
      const destChat = this.chats.find((chat) => chat.id === chatId) as ChatResponse;
      if (type === 'MESSAGE') {
        switch (messageType) {
          case 'TEXT':
            destChat.lastMessage = content;
            destChat.lastMessageTime = createdAt;
            destChat.unreadCount = destChat.unreadCount ? destChat.unreadCount + 1 : 1;
            break;
          case 'AUDIO':
          case 'IMAGE':
          case 'VIDEO':
            destChat.lastMessage = 'Attachment';
            destChat.lastMessageTime = createdAt;
            destChat.unreadCount = destChat.unreadCount ? destChat.unreadCount + 1 : 1;
            break;
        }
        this.sortChats();
      }
    } else if (chatId && !this.chats.find((chat) => chat.id === chatId) && type !== 'SEEN') {
      // add new chat
      const chat: ChatResponse = {
        id: chatId,
        receiverId,
        senderId,
        lastMessage: content,
        lastMessageTime: createdAt,
        name: chatName,
        unreadCount: 1,
      };
      this.chats.unshift(chat);
    }
  }

  sortChats() {
    // this.chats = this.chats.sort(
    //   (b, a) => Date.parse(a.lastMessageTime as string) - Date.parse(b.lastMessageTime as string),
    // );
  }
}
