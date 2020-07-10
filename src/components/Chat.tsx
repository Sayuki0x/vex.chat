/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { IChannel, IClientInfo, IChatMessage, IUser } from 'libvex';
import { client } from '../App';
import { Link } from 'react-router-dom';
import { getUserColor, getUserHexTag } from '../utils/getUserColor';
import ReactMarkdown from 'react-markdown';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

type State = {
  channelList: IChannel[];
  clientInfo: IClientInfo;
  onlineLists: Record<string, IUser[]>;
  chatHistory: Record<string, IChatMessage[]>;
  inputValue: string;
  modalIsActive: boolean;
  modalContents: JSX.Element;
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
      modalIsActive: false,
      modalContents: <span />,
    };

    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.changeNickname = this.changeNickname.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  componentDidMount() {
    client.on('authed', async () => {
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
        chunked[rowCount][chunked[rowCount].length - 1].userID ===
          post.userID &&
        chunked[rowCount][chunked[rowCount].length - 1].username ===
          post.username
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

  changeNickname(e: any, data: any) {
    let inputRef: any = React.createRef();
    const nicknameChanger = (
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (inputRef.value === '') {
            return;
          }
          this.closeModal();
          await client.users.nick(inputRef.value);
          // nick function here
        }}
      >
        <p className="has-text-white">CHANGE NICKNAME</p>
        <br />
        <input
          autoFocus
          ref={(ref) => (inputRef = ref)}
          className={`input is-danger`}
        ></input>
        <div className="modal-bottom-strip has-text-right">
          <button className="button is-danger" type="submit">
            Save
          </button>
        </div>
      </form>
    );
    this.openModal(nicknameChanger);
  }

  openModal(el: JSX.Element) {
    this.setState({
      modalIsActive: true,
      modalContents: el,
    });
  }

  closeModal() {
    this.setState({
      modalIsActive: false,
      modalContents: <span />,
    });
  }

  render() {
    const chunkedArray = this.state.chatHistory[this.props.match.params.id]
      ? this.chunkPosts(this.state.chatHistory[this.props.match.params.id])
      : [[]];

    return (
      <div
        onKeyDown={(event) => {
          if (event.key === 'Escape' && this.state.modalIsActive) {
            this.closeModal();
          }
        }}
      >
        <div
          className={`modal ${
            this.state.modalIsActive ? 'is-active' : ''
          } is-clipped`}
        >
          <div className="modal-background" onClick={this.closeModal}></div>
          <div className="modal-content">
            <div className="box has-background-black-bis">
              {this.state.modalContents && this.state.modalContents}
            </div>
          </div>
          <button
            className="modal-close is-large"
            aria-label="close"
            onClick={() => {
              this.setState({
                modalIsActive: false,
              });
            }}
          />
        </div>

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
                      <ContextMenuTrigger
                        id={'username-trigger-' + messages[0].messageID}
                      >
                        <span
                          className="message-username has-text-weight-bold"
                          style={{
                            color: getUserColor(messages[0].userID),
                          }}
                        >
                          {messages[0].username}
                          <span className="translucent">
                            #{getUserHexTag(messages[0].userID)}
                          </span>
                        </span>{' '}
                        <small>
                          {new Date(messages[0].createdAt).toLocaleTimeString()}
                        </small>
                      </ContextMenuTrigger>
                      <ContextMenu
                        id={'username-trigger-' + messages[0].messageID}
                      >
                        {messages[0].userID ===
                          client.info().client?.userID && (
                          <MenuItem
                            data={messages[0]}
                            onClick={this.changeNickname}
                          >
                            Change Nickname
                          </MenuItem>
                        )}

                        <MenuItem data={messages[0]} onClick={() => {}}>
                          View Profile
                        </MenuItem>
                      </ContextMenu>
                      {messages.map((message, index) => (
                        <span
                          className="chat-message has-text-white"
                          key={
                            'chat-message-text-' +
                            message.messageID +
                            '-' +
                            index.toString()
                          }
                        >
                          <ReactMarkdown source={message.message} />
                        </span>
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
                    <div key={'online-user-' + user.userID}>
                      <ContextMenuTrigger
                        id={'online-user-trigger-' + user.userID}
                      >
                        <a>
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
                      </ContextMenuTrigger>
                      <ContextMenu id={'online-user-trigger-' + user.userID}>
                        {user.userID === client.info().client?.userID && (
                          <MenuItem data={user} onClick={this.changeNickname}>
                            Change Nickname
                          </MenuItem>
                        )}
                        <MenuItem data={user} onClick={() => {}}>
                          View Profile
                        </MenuItem>
                      </ContextMenu>
                    </div>
                  )
                )}
            </ul>
          </aside>
        </div>
      </div>
    );
  }
}
