
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { MessageRequest } from '../../services/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-input',
  templateUrl: './chat-input.html',
  styleUrls: ['./chat-input.scss'],
  imports: [FormsModule, PickerComponent, CommonModule],
  standalone: true,
})
export class ChatInputComponent {
  @Input() selectedChat: any;
  @Output() sendMessage = new EventEmitter<MessageRequest>();
  @Output() uploadMedia = new EventEmitter<File>();

  showEmojis = false;
  messageContent = '';

  onSelectEmojis(event: any) {
    this.messageContent += event.emoji.native;
  }

  onSendMessage() {
    if (this.messageContent && this.selectedChat.id) {
      const messageRequest: MessageRequest = {
        content: this.messageContent,
        chatId: this.selectedChat.id,
        type: 'TEXT',
      };
      this.sendMessage.emit(messageRequest);
      this.messageContent = '';
    }
  }

  onUploadMedia(target: EventTarget | null) {
    const file = this.extractFileFromTarget(target);
    if (file) {
      this.uploadMedia.emit(file);
    }
  }

  extractFileFromTarget(target: EventTarget | null): File | null {
    const htmlInputTarget = target as HTMLInputElement;
    if (target === null || htmlInputTarget.files === null) {
      return null;
    }
    return htmlInputTarget.files[0];
  }

  keyDown(event: any) {
    if (event.key === 'Enter') {
      this.onSendMessage();
    }
  }
}
