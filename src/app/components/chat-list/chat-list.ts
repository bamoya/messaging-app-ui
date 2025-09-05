import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ChatResponse, StringResponse, UserResponse } from '../../services/models';
import { ChatService, UserService } from '../../services/services';
import { KeycloakService } from '../../utils/keycloak/KeycloakService';

@Component({
  selector: 'app-chat-list',
  imports: [DatePipe],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss',
})
export class ChatList {
  chats = input<ChatResponse[] | null >([]);
  searchNewContact = false;
  contacts: Array<UserResponse> = [];
  chatSelected = output<ChatResponse>();

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private keycloakService: KeycloakService,
  ) {}

  searchContact() {
    this.userService.getAllUsersExceptSelf().subscribe({
      next: (users: UserResponse[]) => {
        this.contacts = users;
        this.searchNewContact = true;
      },
    });
  }
  selectContact(user: UserResponse) {
    this.chatService
      .createChat({
        'sender-id': this.keycloakService.userId as string,
        'recipient-id': user.id as string,
      })
      .subscribe({
        next: (res: StringResponse) => {
          const chat: ChatResponse = {
            id: res.response,
            name: user.firstName + ' ' + user.lastName,
            recipientOnline: user.online,
            lastMessageTime: user.lastSeen,
            senderId: this.keycloakService.userId,
            receiverId: user.id,
          };
          this.chats()?.unshift(chat);
          this.searchNewContact = false;
          this.chatSelected.emit(chat);
        },
        error: (error) => {
          console.error('Error creating chat:', error);
        },
      });
  }
  chatClicked(chat: ChatResponse) {
    this.chatSelected.emit(chat);
  }

  wrapMessage(lastMessage: string | undefined) {
    if (lastMessage && lastMessage.length <= 20) {
      return lastMessage;
    }
    return lastMessage ? lastMessage.substring(0, 17) + '...' : '';
  }
}
