/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { IChannel, IClientInfo, IChatMessage, IUser } from 'libvex';
import { client } from '../App';
import { Link } from 'react-router-dom';
import { getUserColor, getUserHexTag } from '../utils/getUserColor';
import ReactMarkdown from 'react-markdown';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faHashtag,
  faKey,
  faCrown,
  faPoo,
} from '@fortawesome/free-solid-svg-icons';
import defaultAvatar from '../images/default_avatar.svg';

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
    console.log('posts passed in is ', posts);
    const chunked: IChatMessage[][] = [[]];
    let rowCount = 0;
    for (const post of posts) {
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
    console.log('chunked result is ', chunked);
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
          className={`input is-link`}
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
    const userProfile = (userID: string) => (
      <article className="media">
        <figure className="media-left">
          <p className="image is-64x64">
            <img
              src={defaultAvatar}
              alt="user avatar"
              className="is-rounded"
              style={{
                backgroundColor: getUserColor(userID),
              }}
            />
          </p>
        </figure>
        <div className="media-content">
          <div className="content">
            <p>
              <strong>{userID}</strong>
            </p>
          </div>
          <nav className="level is-mobile">
            <div className="level-left">
              <a className="level-item">
                <span className="icon is-small">
                  <i className="fas fa-reply"></i>
                </span>
              </a>
              <a className="level-item">
                <span className="icon is-small">
                  <i className="fas fa-retweet"></i>
                </span>
              </a>
              <a className="level-item">
                <span className="icon is-small">
                  <i className="fas fa-heart"></i>
                </span>
              </a>
            </div>
          </nav>
        </div>
        <div className="media-right"></div>
      </article>
    );

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
            <div className="box has-background-black-bis modal-window">
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
                      <FontAwesomeIcon
                        icon={channel.public ? faHashtag : faKey}
                      />
                      &nbsp;&nbsp;{channel.name}
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
            <p className="menu-label">
              <span className="menu-title-wrapper">Channels</span>
              <span
                className="menu-button-wrapper"
                onClick={() => {
                  let inputRef: any = React.createRef();
                  let privateCheckRef: any = React.createRef();

                  const newChannelForm = (
                    <form
                      onSubmit={async (event) => {
                        event.preventDefault();
                        if (inputRef.value === '') {
                          return;
                        }
                        this.closeModal();

                        console.log(privateCheckRef.checked);

                        const channel = await client.channels.create(
                          inputRef.value,
                          privateCheckRef.checked
                        );
                        await client.channels.join(channel.channelID);
                      }}
                    >
                      <p className="has-text-white">CREATE CHANNEL</p>
                      <br />
                      <label>Channel Name</label>
                      <input
                        autoFocus
                        ref={(ref) => (inputRef = ref)}
                        className={`input`}
                      ></input>
                      <br />
                      <br />
                      <input
                        type="checkbox"
                        ref={(ref) => (privateCheckRef = ref)}
                      ></input>
                      &nbsp;
                      <label>Private?</label>
                      <div className="modal-bottom-strip has-text-right">
                        <button className="button is-danger" type="submit">
                          Save
                        </button>
                      </div>
                    </form>
                  );

                  this.openModal(newChannelForm);
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
              </span>
            </p>
            <ul className="menu-list">
              {this.state.channelList.map((channel) => (
                <div>
                  <ContextMenuTrigger
                    id={'channel-list-trigger-' + channel.channelID}
                  >
                    <li key={'channel-list-' + channel.channelID}>
                      <Link to={'/channel/' + channel.channelID}>
                        <FontAwesomeIcon
                          icon={channel.public ? faHashtag : faKey}
                        />
                        &nbsp;&nbsp;<strong>{channel.name}</strong>
                      </Link>
                    </li>
                  </ContextMenuTrigger>
                  <ContextMenu id={'channel-list-trigger-' + channel.channelID}>
                    <MenuItem
                      onClick={(event, data) => {
                        const deleteConfirm = (
                          <p>
                            <div className="has-text-white">
                              <p className="title has-text-white">Confirm</p>
                              Are you sure you want to delete{' '}
                              <strong>{channel.name}</strong>?
                            </div>
                            <div className="modal-bottom-strip">
                              <div className="buttons is-right">
                                <button
                                  className="button is-success"
                                  onClick={async () => {
                                    this.closeModal();
                                    await client.channels.delete(
                                      channel.channelID
                                    );
                                  }}
                                >
                                  Yes
                                </button>
                                <button
                                  className="button is-danger"
                                  onClick={this.closeModal}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          </p>
                        );

                        this.openModal(deleteConfirm);
                      }}
                      data={channel}
                    >
                      Delete Channel
                    </MenuItem>
                  </ContextMenu>
                </div>
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
                        src={defaultAvatar}
                        className="is-rounded"
                        alt="user avatar"
                        style={{
                          backgroundColor: getUserColor(messages[0].userID),
                        }}
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

                        <MenuItem
                          data={messages[0]}
                          onClick={(e: any, data: any) => {
                            this.openModal(userProfile(messages[0].userID));
                          }}
                        >
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

                  if (this.state.inputValue === '') {
                    return;
                  }

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
                            {user.powerLevel === 100 && (
                              <span className="role-icon has-text-warning">
                                <FontAwesomeIcon icon={faCrown} />
                              </span>
                            )}
                            {user.powerLevel >= 50 && user.powerLevel < 100 && (
                              <span className="role-icon has-text-grey">
                                <FontAwesomeIcon icon={faCrown} />
                              </span>
                            )}
                            {user.powerLevel >= 25 && user.powerLevel < 50 && (
                              <span className="role-icon has-text-brown">
                                <FontAwesomeIcon icon={faPoo} />
                              </span>
                            )}
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
                        <MenuItem
                          data={user}
                          onClick={(e: any, data: any) => {
                            this.openModal(userProfile(user.userID));
                          }}
                        >
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
