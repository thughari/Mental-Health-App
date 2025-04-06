import { Component, NgZone, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgIf, CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface ChatEntry {
    text: string;
    isUser: boolean;
}

@Component({
    selector: 'app-chatbot',
    templateUrl: './chatbot.component.html',
    styleUrls: ['./chatbot.component.css'],
    standalone: true,
    imports: [MatIconModule, MatButtonModule, NgIf, CommonModule, FormsModule, ReactiveFormsModule,
     MatFormFieldModule, MatInputModule]
})
export class ChatbotComponent implements OnInit, OnDestroy {
    userMessage = '';
    showChatbot = false;
    chatHistory: ChatEntry[] = [];

    @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;
    constructor(private ngZone: NgZone) { }

    ngOnInit(): void {
        // Load chat history from local storage on component initialization
        // const storedChatHistory = localStorage.getItem('chatHistory');
        // if (storedChatHistory) {
        //     this.chatHistory = JSON.parse(storedChatHistory);
        //   this.scrollToBottom();
        // }
    }

    ngOnDestroy(): void {
        // Save chat history to local storage when component is destroyed
        // localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }

    toggleChatbot(): void {
        this.showChatbot = !this.showChatbot;
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    private scrollToBottom(): void {
        try {
            this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
        } catch(err) { }
    }

    resetChat(): void {
        this.chatHistory = []; // Clear the chat history array
        localStorage.removeItem('chatHistory'); // Remove chat history from local storage
        console.log('Chat history reset.');
    }

    //Capturing the Shift and control when the key is pressed
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
      this.shiftPressed = event.shiftKey;
      this.controlPressed = event.ctrlKey;
    }

    shiftPressed: boolean = false;
    controlPressed: boolean = false;

    async sendMessage() {
      if (this.userMessage.trim() === '') {
          return;
      }

      this.chatHistory.push({ text: this.userMessage, isUser: true });

      let accumulatedResponse = '';
      try {
          const token = localStorage.getItem('jwtToken');
          const response = await fetch('https://35.225.18.182/api/chat/stream', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ message: this.userMessage })
          });

          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
              console.error('Response body reader is null.');
              return;
          }

          const decoder = new TextDecoder();
          let accumulatedData = '';

          const botMessage = { text: '', isUser: false };
          this.chatHistory.push(botMessage);

          while (true) {
              const { value, done } = await reader.read();

              if (done) {
                  console.log('Stream complete.');
                  break;
              }

              accumulatedData += decoder.decode(value, { stream: true });

              let eventSeparatorIndex: number;
              while ((eventSeparatorIndex = accumulatedData.indexOf('\n\n')) >= 0) {
                  const eventData = accumulatedData.substring(0, eventSeparatorIndex);
                  accumulatedData = accumulatedData.substring(eventSeparatorIndex + 2);

                  if (eventData.startsWith('data:')) {
                      const jsonData = eventData.substring(5).trim();
                      try {
                          const json = JSON.parse(jsonData);

                          if (json.response) {
                              this.ngZone.run(() => {
                                  botMessage.text += json.response;
                              });
                          }

                          if (json.done === true) {
                              console.log("Streaming complete!");
                          }
                      } catch (error) {
                          console.error('Error parsing JSON:', jsonData, error);
                      }
                  }
              }
          }
      } catch (error) {
          const err = error as Error;
          console.error('Error during streaming:', err);
          this.chatHistory.push({ text: `Error: ${err.message}`, isUser: false });
      } finally {
          this.userMessage = ''; // Clear the input field after sending
          this.shiftPressed = false;
          this.controlPressed = false;
      }
    }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.shiftPressed || this.controlPressed) {
        // Append a new line character if Shift or Control is pressed
        this.userMessage += '\n';
        event.preventDefault(); // Prevent the default Enter behavior (form submission)
      } else {
        // Send the message if only Enter is pressed
        this.sendMessage();
        event.preventDefault(); // Prevent the default Enter behavior (form submission)
      }
    }
  }
}