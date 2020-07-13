import { IChatMessage, IChannel } from 'libvex';
import { client } from '../App';
import { EventEmitter } from 'events';
import ReactMarkdown from 'react-markdown';

export class HistoryManager extends EventEmitter {
  chatHistory: Record<string, IChatMessage[][]>;
  constructor() {
    super();
    this.chatHistory = {};

    this.init = this.init.bind(this);
    this.getHistory = this.getHistory.bind(this);
    this.fetchHistory = this.fetchHistory.bind(this);
    this.addMessage = this.addMessage.bind(this);

    this.init();
  }

  public getHistory(channelID: string) {
    return this.chatHistory[channelID] || [];
  }

  public async fetchHistory(channelList: IChannel[]) {
    for (const channel of channelList) {
      const history = await client.messages.retrieve(channel.channelID);
      this.chatHistory[channel.channelID] = this.chunkPosts(history);
    }

    console.log(this.chatHistory);
  }

  private addMessage(message: IChatMessage) {
    (message as any).markdown = new ReactMarkdown({ source: message.message });
    const { channelID, userID, username } = message;
    //   [history]       [channel]
    if (!this.chatHistory[channelID]) {
      this.chatHistory[channelID] = [[]];
    }
    //  [history]       [channel]  [top-row]
    if (
      this.chatHistory[channelID][this.chatHistory[channelID].length - 1]
        .length == 0
    ) {
      this.chatHistory[channelID][this.chatHistory[channelID].length - 1].push(
        message
      );
    }
    //  [history]       [channel]  [top-row]                               [top-message]                                                                   .userID
    if (
      this.chatHistory[channelID][this.chatHistory[channelID].length - 1][
        this.chatHistory[channelID][this.chatHistory[channelID].length - 1]
          .length - 1
      ].userID === userID &&
      this.chatHistory[channelID][this.chatHistory[channelID].length - 1][
        this.chatHistory[channelID][this.chatHistory[channelID].length - 1]
          .length - 1
      ].username === username
    ) {
      this.chatHistory[channelID][this.chatHistory[channelID].length - 1].push(
        message
      );
    } else {
      this.chatHistory[channelID].push([message]);
    }
  }

  private chunkPosts(posts: IChatMessage[]) {
    console.log('chunkPosts()');
    const chunked: IChatMessage[][] = [[]];
    let rowCount = 0;
    for (const post of posts) {
      (post as any).markdown = new ReactMarkdown({ source: post.message });
      if (!chunked[rowCount]) {
        chunked.push([]);
      }
      if (chunked[rowCount].length === 0) {
        chunked[rowCount].push(post);
        continue;
      }
      if (
        chunked[rowCount][chunked[rowCount].length - 1].userID ===
          post.userID &&
        chunked[rowCount][chunked[rowCount].length - 1].username ===
          post.username
      ) {
        chunked[rowCount].push(post);
        continue;
      } else {
        chunked.push([]);
        chunked[rowCount + 1].push(post);
        rowCount++;
      }
    }
    return chunked;
  }

  private init() {
    client.on('message', async (message) => {
      await this.addMessage(message);
      this.emit('message', message);
    });
  }
}
