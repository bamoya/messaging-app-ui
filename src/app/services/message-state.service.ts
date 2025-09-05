
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MessageResponse } from './models';
import { MessageService } from './services';

@Injectable({
  providedIn: 'root',
})
export class MessageStateService {
  private readonly _messages = new BehaviorSubject<MessageResponse[]>([]);
  readonly messages$ = this._messages.asObservable();

  constructor(private messageService: MessageService) {}

  get messages(): MessageResponse[] {
    return this._messages.getValue();
  }

  set messages(messages: MessageResponse[]) {
    this._messages.next(messages);
  }

  loadMessages(chatId: string) {
    this.messageService.getChatMessages({ 'chat-id': chatId }).subscribe((messages) => {
      this.messages = messages;
    });
  }

  addMessage(message: MessageResponse) {
    this.messages = [...this.messages, message];
  }

  updateMessagesState(state: 'SENT' | 'SEEN') {
    this.messages.forEach((m) => (m.state = state));
    this._messages.next([...this.messages]);
  }

  readAllMessages(chatId: string) {
    if (chatId) {
      this.messageService.updateMessageStatusToSeen({ 'chat-id': chatId }).subscribe();
    }
  }
}
