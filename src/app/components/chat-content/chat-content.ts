import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ChatResponse, MessageResponse } from '../../services/models';
import { KeycloakService } from '../../utils/keycloak/KeycloakService';

@Component({
  selector: 'app-chat-content',
  templateUrl: './chat-content.html',
  styleUrls: ['./chat-content.scss'],
  imports: [CommonModule],
  standalone: true,
})
export class ChatContentComponent implements AfterViewChecked {
  @Input() selectedChat: ChatResponse | null = {};
  @Input() chatMessages: MessageResponse[] | null = [];
  @ViewChild('scrollableDiv') scrollableDiv!: ElementRef<HTMLDivElement>;

  constructor(private keycloak: KeycloakService) {}

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  isSelfMessage(message: MessageResponse) {
    return message.senderId === this.keycloak.userId;
  }

  private scrollToBottom() {
    if (this.scrollableDiv) {
      // const div = this.scrollableDiv.nativeElement;
      // div.scrollTop = div.scrollHeight;
    }
  }
}
