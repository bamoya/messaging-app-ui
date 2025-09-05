import { Component, input } from '@angular/core';
import { ChatResponse } from '../../services/models';

@Component({
  selector: 'app-chat-header',
  imports: [],
  templateUrl: './chat-header.html',
  styleUrl: './chat-header.scss',
})
export class ChatHeader {
  selectedChat = input<ChatResponse | null>();
}
