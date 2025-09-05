
import { Injectable } from '@angular/core';
import { WebSocketService } from './web-socket.service';
import { Notification } from '../pages/main/models/notification';
import { ChatResponse, MessageResponse } from './models';
import { MEDIA_MESSAGES_TYPE } from '../constants/constants';
import { ChatStateService } from './chat-state.service';
import { MessageStateService } from './message-state.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(
    private webSocketService: WebSocketService,
    private chatStateService: ChatStateService,
    private messageStateService: MessageStateService,
  ) {
    this.webSocketService.notification$.subscribe((notification) => {
      if (notification) {
        this.handleNotification(notification);
      }
    });
  }

  handleNotification(notification: Notification) {
    if (!notification) {
      return;
    }
    const { chatId, chatName, receiverId, senderId, type, messageType, content, media, createdAt } =
      notification;
    if (chatId && chatId === this.chatStateService.selectedChat.id) {
      switch (type) {
        case 'SEEN':
          this.messageStateService.updateMessagesState('SEEN');
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
            this.chatStateService.selectedChat.lastMessage = 'Attachment';
          } else if (messageType === 'TEXT') {
            this.chatStateService.selectedChat.lastMessage = content;
          }
          this.chatStateService.selectedChat.lastMessageTime = createdAt;
          this.messageStateService.addMessage(newMessage);

          // if you are in the conversation then set messages to seen
          this.messageStateService.updateMessagesState('SEEN');
          this.messageStateService.readAllMessages(chatId);
          this.chatStateService.sortChats();
          break;
      }
    } else if (chatId && this.chatStateService.chats.find((chat) => chat.id === chatId)) {
      const destChat = this.chatStateService.chats.find((chat) => chat.id === chatId) as ChatResponse;
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
        this.chatStateService.sortChats();
      }
    } else if (chatId && !this.chatStateService.chats.find((chat) => chat.id === chatId) && type !== 'SEEN') {
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
      this.chatStateService.addChat(chat);
    }
  }
}
