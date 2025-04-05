import { Component, NgZone } from '@angular/core';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  userMessage = '';
  responseText = '';
  testing = '# **test**';

  constructor(private ngZone: NgZone) {} // Inject NgZone

  async sendMessage() {
    this.responseText = ''; // Clear previous response

    try {
      const response = await fetch('http://34.170.236.64:8081/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.userMessage) // Send userMessage directly as a string
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
      let accumulatedData = ''; // Accumulate data across chunks

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          console.log('Stream complete.');
          console.log('total data: ', this.responseText);
          break;
        }

        accumulatedData += decoder.decode(value); // Append the decoded chunk

        // Process complete SSE events
        let eventSeparatorIndex: number;
        while ((eventSeparatorIndex = accumulatedData.indexOf('\n\n')) >= 0) {
          const eventData = accumulatedData.substring(0, eventSeparatorIndex);
          accumulatedData = accumulatedData.substring(eventSeparatorIndex + 2);

          if (eventData.startsWith('data:')) {
            const jsonData = eventData.substring(5).trim();
            try {
              const json = JSON.parse(jsonData);

              // Use NgZone.run to update the UI from within the async stream
              this.ngZone.run(() => {
                if (json.response) {
                  this.responseText += json.response;
                }
                if (json.done === true) {
                  console.log("Streaming complete!");
                }
              });

            } catch (error) {
              console.error('Error parsing JSON:', jsonData, error);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error during streaming:', error);
      this.responseText = `Error: ${error}`; // Display error to user
    }
  }
}