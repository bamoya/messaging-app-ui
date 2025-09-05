import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatResponse } from './models';
import { ChatService } from './services';

@Injectable({
  providedIn: 'root',
})
export class ChatStateService {
  private readonly _chats = new BehaviorSubject<ChatResponse[]>([]);
  readonly chats$ = this._chats.asObservable();

  private readonly _selectedChat = new BehaviorSubject<ChatResponse>({});
  readonly selectedChat$ = this._selectedChat.asObservable();

  constructor(private chatService: ChatService) {}

  get chats(): ChatResponse[] {
    return this._chats.getValue();
  }

  set chats(chats: ChatResponse[]) {
    this._chats.next(chats);
  }

  get selectedChat(): ChatResponse {
    return this._selectedChat.getValue();
  }

  set selectedChat(chat: ChatResponse) {
    this._selectedChat.next(chat);
  }

  loadChats() {
    this.chatService.getUserChats().subscribe((chats) => {
      this.chats = chats;
      this.sortChats();
    });
  }

  addChat(chat: ChatResponse) {
    this.chats = [chat, ...this.chats];
  }

  sortChats() {
    this.chats = this.chats.sort(
      (b, a) => Date.parse(a.lastMessageTime as string) - Date.parse(b.lastMessageTime as string),
    );
  }
}
