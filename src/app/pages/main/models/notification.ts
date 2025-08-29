export interface Notification {
  chatId?: string;
  content?: string;
  senderId?: string;
  receiverId?: string;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  type?: 'SEEN' | 'MESSAGE';
  chatName?: string;
  media?: Array<string>;
  createdAt?: string;
}
