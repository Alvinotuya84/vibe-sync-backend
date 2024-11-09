import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface ChatEvent {
  type: 'newMessage' | 'typing';
  conversationId: string;
  data: any;
}

@Injectable()
export class ChatEventsService {
  private events = new Subject<ChatEvent>();

  emit(event: ChatEvent) {
    this.events.next(event);
  }

  subscribe(callback: (event: ChatEvent) => void) {
    return this.events.subscribe(callback);
  }
}
