/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { IChannel } from 'libvex';
import { client } from '../App';
import { Link } from 'react-router-dom';
import { IClientInfo, IChatMessage, IUser } from 'libvex/dist/Client';
import { getUserColor, getUserHexTag } from '../utils/getUserColor';
import ReactMarkdown from 'react-markdown';

type State = {
  channelList: IChannel[];
  clientInfo: IClientInfo;
  onlineLists: Record<string, IUser[]>;
  chatHistory: Record<string, IChatMessage[]>;
  inputValue: string;
};

type Props = {
  match: any;
};

export class Chat extends Component<Props, State> {
  messagesEnd: any = React.createRef();

  constructor(props: Props) {
    super(props);
    this.state = {
      channelList: [],
      chatHistory: {},
      clientInfo: client.info(),
      inputValue: '',
      onlineLists: {},
    };
  }

  componentDidMount() {
    client.on('authed' as any, async () => {
      const channelList = await client.channels.retrieve();
      this.setState({
        channelList,
      });

      for (const channel of channelList) {
        await client.channels.join(channel.channelID);
        const history = await client.messages.retrieve(channel.channelID);
        const { chatHistory } = this.state;
        chatHistory[channel.channelID] = history;
        this.setState({
          chatHistory,
        });
      }

      this.scrollToBottom();
    });

    client.on('channelList', async (channelList) => {
      this.setState({
        channelList,
      });
    });

    client.on('onlineList', async (onlineList, channelID) => {
      const { onlineLists } = this.state;
      onlineLists[channelID] = onlineList;

      this.setState({
        onlineLists,
      });
    });

    client.on('message', async (message) => {
      const { chatHistory } = this.state;
      if (!chatHistory[message.channelID]) {
        chatHistory[message.channelID] = [];
      }
      chatHistory[message.channelID].push(message);
      this.setState({
        chatHistory,
      });
      this.scrollToBottom();
    });
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom = () => {
    this.messagesEnd.current.scrollIntoView({});
  };

  chunkPosts = (posts: IChatMessage[]) => {
    const chunked: IChatMessage[][] = [[]];
    let rowCount = 0;
    for (const post of posts) {
      if (!chunked[rowCount]) {
        chunked.push([]);
      }
      if (chunked[rowCount].length === 0) {
        chunked[rowCount].push(post);
      }
      if (
        (chunked[rowCount][chunked[rowCount].length - 1] as any).userID ===
        (post as any).userID
      ) {
        chunked[rowCount].push(post);
      } else {
        chunked.push([]);
        chunked[rowCount + 1].push(post);
        rowCount++;
      }
    }
    return chunked;
  };

  render() {
    const chunkedArray = this.state.chatHistory[this.props.match.params.id]
      ? this.chunkPosts(this.state.chatHistory[this.props.match.params.id])
      : [[]];

    return (
      <div>
        <div className="left-sidebar has-background-black-ter"></div>
        <div className="top-bar">
          <div className="top-bar-left has-background-black-bis">
            <h1 className="title is-size-4 has-text-white">
              {this.state.clientInfo.host.split('//')[1]}
            </h1>
          </div>
          <div className="top-bar-right has-background-black-ter">
            <div className="columns"></div>
            <h1 className="title is-size-4 has-text-white">
              {this.state.channelList.map((channel) => {
                if (channel.channelID === this.props.match.params.id) {
                  return (
                    <span key={'channel-title-' + channel.channelID}>
                      #{channel.name}
                    </span>
                  );
                } else {
                  return null;
                }
              })}
            </h1>
          </div>
        </div>
        <div className="left-channelbar has-background-black-bis">
          <aside className="menu">
            <p className="menu-label">Channels</p>
            <ul className="menu-list">
              {this.state.channelList.map((channel) => (
                <li key={'channel-list-' + channel.channelID}>
                  <Link to={'/channel/' + channel.channelID}>
                    #<strong> {channel.name}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
        <div className="chat-window has-background-black-ter">
          <div className="chat-message-wrapper">
            {chunkedArray.map((messages) => {
              if (messages.length === 0) return null;
              return (
                <article
                  className="media chat-message"
                  key={'chat-message-block-' + messages[0].messageID}
                >
                  <figure className="media-left">
                    <p className="image is-48x48">
                      <img
                        src="https://bulma.io/images/placeholders/128x128.png"
                        className="is-rounded"
                        alt="user avatar"
                      />
                    </p>
                  </figure>
                  <div className="media-content">
                    <div>
                      <a
                        className="message-username has-text-weight-bold"
                        style={{
                          color: getUserColor((messages as any)[0].userID),
                        }}
                      >
                        {messages[0].username}
                        <span className="translucent">
                          #{getUserHexTag((messages[0] as any).userID)}
                        </span>
                      </a>{' '}
                      <small>
                        {new Date(
                          (messages[0] as any).createdAt
                        ).toLocaleTimeString()}
                      </small>
                      <br />
                      {messages.map((message, index) => (
                        <p
                          className="chat-message has-text-white"
                          key={
                            'chat-message-text-' +
                            message.messageID +
                            '-' +
                            index.toString()
                          }
                        >
                          <ReactMarkdown source={message.message}  />
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="media-right"></div>
                </article>
              );
            })}
            <div
              style={{ float: 'left', clear: 'both' }}
              ref={this.messagesEnd}
            ></div>
          </div>
        </div>
        <div className="bottom-bar has-background-black-ter">
          <div className="chat-input-wrapper has-background-grey-darker">
            <textarea
              className="chat-input"
              value={this.state.inputValue}
              onChange={(event) => {
                this.setState({
                  inputValue: event.target.value,
                });
              }}
              onKeyPress={async (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  await client.messages.send(
                    this.props.match.params.id,
                    this.state.inputValue
                  );
                  this.setState({
                    inputValue: '',
                  });
                }
              }}
            />
          </div>
        </div>
        <div className="right-sidebar has-background-black-bis">
          <aside className="menu">
            <p className="menu-label">Online</p>
            <ul className="menu-list">
              {this.state.onlineLists[this.props.match.params.id] &&
                this.state.onlineLists[this.props.match.params.id].map(
                  (user) => (
                    <a key={'online-user-' + user.userID}>
                      <li>
                        {' '}
                        <span
                          className="message-username has-text-weight-bold"
                          style={{
                            color: getUserColor(user.userID),
                          }}
                        >
                          {user.username}
                          <span className="translucent">
                            #{getUserHexTag(user.userID)}
                          </span>
                        </span>
                      </li>
                    </a>
                  )
                )}
            </ul>
          </aside>
        </div>
      </div>
    );
  }
}
