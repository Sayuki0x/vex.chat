/* eslint-disable jsx-a11y/anchor-is-valid */

import React, { Component, Fragment } from 'react';
import { IChannel, IClientInfo, IChatMessage, IUser } from 'libvex';
import { client } from '../App';
import { Link } from 'react-router-dom';
import { getUserColor, getUserHexTag } from '../utils/getUserColor';
import ReactMarkdown from 'react-markdown';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import { Swipeable } from 'react-swipeable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faHashtag,
  faKey,
  faTimes,
  faCog,
  faBars,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { getUserIcon, userProfile, getAvatar } from './userProfile';
import { MultiSelect } from './Select';

const uniqueArray = (arr: any[]) => {
  return arr.filter((thing: any, index: number) => {
    const _thing = JSON.stringify(thing);
    return (
      index ===
      arr.findIndex((obj) => {
        return JSON.stringify(obj) === _thing;
      })
    );
  });
};

const tablet = 769;
const desktop = 1024;

type State = {
  channelList: IChannel[];
  clientInfo: IClientInfo;
  onlineLists: Record<string, IUser[]>;
  chatHistory: Record<string, IChatMessage[]>;
  inputValue: string;
  modalIsActive: boolean;
  modalContents: JSX.Element;
  joinedRooms: string[];
  viewportWidth: number;
  viewportHeight: number;
  widthHistory: number[];
  leftBarOpen: boolean;
  rightBarOpen: boolean;
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
      joinedRooms: [],
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      widthHistory: [window.innerWidth],
      leftBarOpen: window.innerWidth > tablet,
      rightBarOpen: window.innerWidth > desktop,
    };

    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.changeNickname = this.changeNickname.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    this.openRightBar = this.openRightBar.bind(this);
    this.closeRightBar = this.closeRightBar.bind(this);
    this.openLeftBar = this.openLeftBar.bind(this);
    this.closeLeftBar = this.closeLeftBar.bind(this);
  }

  updateWindowDimensions() {
    const { innerWidth, innerHeight } = window;
    const { widthHistory } = this.state;

    // leftBarOpen: window.innerWidth > tablet,
    // rightBarOpen: window.innerWidth > desktop,

    if (widthHistory[0] <= tablet && innerWidth > tablet) {
      this.openLeftBar();
    }

    if (widthHistory[0] >= tablet && innerWidth < tablet) {
      this.closeLeftBar();
    }

    if (widthHistory[0] <= desktop && innerWidth > desktop) {
      this.openRightBar();
    }

    if (widthHistory[0] >= desktop && innerWidth < desktop) {
      this.closeRightBar();
    }

    widthHistory.unshift(innerWidth);
    if (widthHistory.length > 100) {
      widthHistory.pop();
    }

    this.setState({
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      widthHistory,
    });
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateWindowDimensions);
    client.on('authed', async () => {
      const channelList = await client.channels.retrieve();
      this.setState({
        channelList,
      });

      for (const channel of channelList) {
        await client.channels.join(channel.channelID);
        const { joinedRooms } = this.state;
        joinedRooms.push(channel.channelID);
        this.setState({
          joinedRooms,
        });
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

      for (const channel of channelList) {
        if (!this.state.joinedRooms.includes(channel.channelID)) {
          await client.channels.join(channel.channelID);
          const { joinedRooms } = this.state;
          joinedRooms.push(channel.channelID);
          this.setState({
            joinedRooms,
          });
          const history = await client.messages.retrieve(channel.channelID);
          const { chatHistory } = this.state;
          chatHistory[channel.channelID] = history;
          this.setState({
            chatHistory,
          });
        }
      }
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

      if (chatHistory[message.channelID].length > 500) {
        chatHistory[message.channelID].shift();
      }

      this.setState({
        chatHistory,
      });
      this.scrollToBottom();
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
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
          placeholder={'Enter new nickname...'}
          className={`input`}
        ></input>
        <div className="modal-bottom-strip has-text-right">
          <button className="button is-black" type="submit">
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

  closeRightBar() {
    this.setState({
      rightBarOpen: false,
    });
  }

  openRightBar() {
    this.setState({
      rightBarOpen: true,
    });
  }

  closeLeftBar() {
    this.setState({
      leftBarOpen: false,
    });
  }

  openLeftBar() {
    this.setState({
      leftBarOpen: true,
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
        <Swipeable
          onSwipedRight={(eventData) => {
            if (this.state.viewportWidth > tablet) {
              return;
            }
            this.openLeftBar();
          }}
        >
          {' '}
          <div className="swipe-anchor-left" />
        </Swipeable>

        <Swipeable
          onSwipedLeft={(eventData) => {
            this.openRightBar();
          }}
        >
          {' '}
          <div className="swipe-anchor-right" />
        </Swipeable>

        <div
          className={`modal ${
            this.state.modalIsActive ? 'is-active' : ''
          } is-clipped`}
        >
          <div className="modal-background" onClick={this.closeModal}></div>
          <div className="modal-content">
            <div className="box has-background-black modal-window">
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

        <div
          id="serverBar"
          className="left-sidebar has-background-black-ter"
        ></div>
        <div className="top-bar">
          <div className="top-bar-left has-background-black-bis">
            <h1 className="title is-size-4 has-text-white">
              {this.state.clientInfo.host.split('//')[1]}
            </h1>
          </div>
          <div className="top-bar-right has-background-black-ter">
            <div
              className={`mobile-menu-toggle-wrapper ${
                this.state.viewportWidth > tablet ? 'hidden' : ''
              }`}
              onClick={() => {
                this.openLeftBar();
              }}
            >
              <div className="Aligner">
                <div className="Aligner-item Aligner-item--top"></div>
                <div className="Aligner-item">
                  <FontAwesomeIcon icon={faBars} />
                </div>
                <div className="Aligner-item Aligner-item--bottom"></div>
              </div>
            </div>
            <div className="channel-name-wrapper">
              <div className="Aligner">
                <div className="Aligner-item Aligner-item--top"></div>
                <div className="Aligner-item">
                  <h1 className="title is-size-4 has-text-white">
                    {this.state.channelList.map((channel) => {
                      if (channel.channelID === this.props.match.params.id) {
                        return (
                          <span
                            className="channel-name-text"
                            key={'channel-title-' + channel.channelID}
                          >
                            <FontAwesomeIcon
                              icon={channel.public ? faHashtag : faKey}
                              size={'sm'}
                            />
                            &nbsp;
                            {channel.name}
                          </span>
                        );
                      } else {
                        return null;
                      }
                    })}
                  </h1>
                </div>
                <div className="Aligner-item Aligner-item--bottom"></div>
              </div>
            </div>
            {this.state.viewportWidth < desktop && (
              <div
                className="user-menu-toggle-wrapper"
                onClick={() => {
                  this.openRightBar();
                }}
              >
                <div className="Aligner">
                  <div className="Aligner-item Aligner-item--top"></div>
                  <div className="Aligner-item">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  <div className="Aligner-item Aligner-item--bottom"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        <Swipeable
          onSwipedLeft={(eventData) => {
            if (this.state.viewportWidth > tablet) {
              return;
            }
            this.closeLeftBar();
          }}
        >
          <div
            id="channelBar"
            className={`left-channelbar has-background-black-bis ${
              this.state.leftBarOpen ? '' : 'hidden'
            }`}
          >
            <aside className="menu">
              <p className="menu-label">
                <span className="menu-title-wrapper">Channels</span>
                {client.info().client &&
                  client.info().client!.powerLevel >
                    client.info().powerLevels.create && (
                    <span className="icon-group">
                      {this.state.viewportWidth < tablet && (
                      <span
                      className="close-button-wrapper"
                      onClick={() => {
                        this.closeLeftBar();
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faTimes}
                        className={'has-text-red'}
                      />
                    </span>
                      )}
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
                                <button
                                  className="button is-black"
                                  type="submit"
                                >
                                  Save
                                </button>
                              </div>
                            </form>
                          );

                          this.openModal(newChannelForm);
                          this.closeLeftBar();
                        }}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </span>
                    </span>
                  )}
              </p>
              <ul className="menu-list">
                {this.state.channelList.map((channel) => (
                  <div key={'channel-list-' + channel.channelID}>
                    <ContextMenuTrigger
                      id={'channel-list-trigger-' + channel.channelID}
                    >
                      <li>
                        <Link to={'/channel/' + channel.channelID}>
                          <FontAwesomeIcon
                            icon={channel.public ? faHashtag : faKey}
                          />
                          &nbsp;&nbsp;<strong>{channel.name}</strong>
                        </Link>
                      </li>
                    </ContextMenuTrigger>
                    <ContextMenu
                      id={'channel-list-trigger-' + channel.channelID}
                    >
                      {!channel.public && (
                        <MenuItem
                          onClick={async (event, data) => {
                            const permissionList = await client.permissions.retrieve(
                              channel.channelID
                            );
                            const userArray = [];

                            for (const perm of permissionList) {
                              const user = await client.users.retrieve(
                                perm.userID
                              );
                              userArray.push(user);
                            }

                            let selectedUser = '';

                            const channelPermsEditor = (
                              <div className="large-modal">
                                <p className="has-text-white">
                                  #{channel.name.toUpperCase()} CHANNEL
                                  PERMISSIONS
                                </p>
                                <br />
                                <ul>
                                  {userArray.map((user) => {
                                    let spanRef: HTMLSpanElement | null = null;
                                    let liRef: HTMLLIElement | null = null;
                                    return (
                                      <li
                                        key={'channel-perm-' + user.userID}
                                        ref={(ref) => (liRef = ref)}
                                      >
                                        <span
                                          className="menu-button-wrapper"
                                          ref={(ref) => (spanRef = ref)}
                                          onClick={async () => {
                                            if (selectedUser === user.userID) {
                                              await client.permissions.delete(
                                                user.userID,
                                                channel.channelID
                                              );
                                              liRef!.remove();
                                            } else {
                                              selectedUser = user.userID;
                                              spanRef!.setAttribute(
                                                'class',
                                                'menu-button-wrapper has-text-danger'
                                              );
                                            }
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faTimes} />
                                          &nbsp;&nbsp;
                                        </span>
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
                                        {getUserIcon(user.powerLevel)}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            );

                            this.openModal(channelPermsEditor);
                          }}
                        >
                          <p>Permissions</p>
                        </MenuItem>
                      )}
                      {client.info().client &&
                        client.info().client!.powerLevel >
                          client.info().powerLevels.delete && (
                          <MenuItem
                            onClick={(event, data) => {
                              const deleteConfirm = (
                                <div>
                                  <div className="has-text-white">
                                    <span className="has-text-white">
                                      CONFIRM
                                    </span>
                                    <br />
                                    Are you sure you want to delete{' '}
                                    <strong>{channel.name}</strong>?
                                  </div>
                                  <div className="modal-bottom-strip">
                                    <div className="buttons is-right">
                                      <button
                                        className="button is-danger"
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
                                        className="button is-black"
                                        onClick={this.closeModal}
                                      >
                                        No
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );

                              this.openModal(deleteConfirm);
                            }}
                            data={channel}
                          >
                            Delete Channel
                          </MenuItem>
                        )}
                      <MenuItem divider />
                      <MenuItem
                        onClick={async (event, data: IChannel) => {
                          const channelList = await client.channels.retrieve();
                          for (const channel of channelList) {
                            if (channel.channelID === data.channelID) {
                              this.openModal(
                                <div>
                                  <p className="has-text-white">
                                    #{channel.name.toUpperCase()} CHANNEL INFO
                                  </p>
                                  <br />
                                  <p className="has-text-white is-family-monospace is-size-7">
                                    index: {channel.index.toString()}
                                  </p>
                                  <p className="has-text-white is-family-monospace is-size-7">
                                    channelID: {channel.channelID}
                                  </p>
                                  <p className="has-text-white is-family-monospace is-size-7">
                                    adminID: {channel.admin}
                                  </p>
                                  <p className="has-text-white is-family-monospace is-size-7">
                                    public: {String(channel.public)}
                                  </p>
                                </div>
                              );
                            }
                          }
                        }}
                        data={channel}
                      >
                        Channel Info
                      </MenuItem>
                    </ContextMenu>
                  </div>
                ))}
              </ul>
            </aside>

            <div className="user-bar">
              <div className="Aligner">
                <div className="Aligner-item Aligner-item--top" />
                <div className="Aligner-item">
                  {client.info().client && (
                    <Fragment>
                      <span className="image is-32x32 user-bar-avatar">
                        {getAvatar(client.info().client!.userID)}
                      </span>
                      <span
                        className="user-bar-username"
                        style={{
                          color: getUserColor(client.info().client!.userID),
                        }}
                      >
                        {client.info().client!.username}
                        <span className="translucent">
                          {/* "#" + getUserHexTag(client.info().client!.userID) */}
                        </span>
                      </span>
                      <span
                        className="user-bar-cog-wrapper"
                        onClick={async () => {
                          this.openModal(
                            await userProfile(client.info().client!.userID)
                          );
                          if (this.state.viewportWidth < tablet) {
                            this.closeLeftBar();
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faCog} />
                      </span>
                    </Fragment>
                  )}
                </div>
                <div className="Aligner-item Aligner-item--bottom" />
              </div>
            </div>
          </div>
        </Swipeable>
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
                      {getAvatar(messages[0].userID)}
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
                        {client.info().client &&
                          client.info().client!.powerLevel >
                            client.info().powerLevels.grant && (
                            <MenuItem
                              data={messages[0]}
                              onClick={(e: any, data: any) => {
                                let selectedValues: any[] = [];
                                const grantForm = (
                                  <form
                                    className="large-modal"
                                    onSubmit={async (event) => {
                                      event.preventDefault();
                                      // this.closeModal();
                                      for (const selection of selectedValues) {
                                        await client.permissions.create(
                                          messages[0].userID,
                                          selection.value
                                        );
                                      }
                                      this.closeModal();
                                    }}
                                  >
                                    <p className="has-text-white">
                                      ADD TO CHANNEL
                                    </p>
                                    <br />
                                    <MultiSelect
                                      onChange={(
                                        values: any[],
                                        action: any
                                      ) => {
                                        selectedValues = values;
                                      }}
                                    />
                                    <div className="modal-bottom-strip">
                                      <div className="buttons is-right">
                                        <button
                                          className="button is-danger"
                                          type="submit"
                                        >
                                          Add
                                        </button>
                                      </div>
                                    </div>
                                  </form>
                                );
                                this.openModal(grantForm);
                              }}
                            >
                              Add To Channel
                            </MenuItem>
                          )}
                        <MenuItem divider />
                        <MenuItem
                          data={messages[0]}
                          onClick={async (e: any, data: any) => {
                            this.openModal(
                              await userProfile(messages[0].userID)
                            );
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
                          {' '}
                          {message.message.charAt(0) === '>' ? (
                            <span className="has-text-success chat-message-text">
                              {message.message}
                            </span>
                          ) : (
                            <span className="chat-message-text">
                              <ReactMarkdown
                                source={message.message}
                                linkTarget={'_blank'}
                              />
                            </span>
                          )}
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
        <Swipeable
          onSwipedRight={(eventData) => {
            if (this.state.viewportWidth > desktop) {
              return;
            }
            this.closeRightBar();
          }}
        >
          <div
            id="onlineUserBar"
            className={`right-sidebar has-background-black-bis ${
              this.state.rightBarOpen ? '' : 'hidden'
            }`}
          >
            <aside className="menu">
              {this.state.viewportWidth < desktop && (
              <span
              className="close-button-wrapper"
              onClick={() => {
                this.closeRightBar();
              }}
            >
              <FontAwesomeIcon icon={faTimes} className={'has-text-red'} />
            </span>
              )}

              <p className="menu-label">Online</p>
              <ul className="menu-list">
                {this.state.onlineLists[this.props.match.params.id] &&
                  uniqueArray(
                    this.state.onlineLists[this.props.match.params.id]
                  ).map((user) => {
                    return (
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
                              {getUserIcon(user.powerLevel)}
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
                            onClick={async (e: any, data: any) => {
                              this.openModal(await userProfile(user.userID));
                            }}
                          >
                            Add To Channel
                          </MenuItem>
                          <MenuItem divider />
                          <MenuItem
                            data={user}
                            onClick={async (e: any, data: any) => {
                              this.openModal(await userProfile(user.userID));
                            }}
                          >
                            View Profile
                          </MenuItem>
                        </ContextMenu>
                      </div>
                    );
                  })}
              </ul>
            </aside>
          </div>
        </Swipeable>
      </div>
    );
  }
}
