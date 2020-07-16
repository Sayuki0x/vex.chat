/* eslint-disable jsx-a11y/anchor-is-valid */

import React, { Component, Fragment } from 'react';
import { IChannel, IChatMessage, IUser, Utils } from 'libvex';
import { client } from '../App';
import { Link, Redirect } from 'react-router-dom';
import { getUserColor, getUserHexTag } from '../utils/getUserColor';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import { Swipeable } from 'react-swipeable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Dropzone from 'react-dropzone';
import {
  faPlus,
  faHashtag,
  faKey,
  faTimes,
  faCog,
  faBars,
  faUsers,
  faPaperclip,
  faArrowCircleDown,
} from '@fortawesome/free-solid-svg-icons';
import { getUserIcon, userProfile, getAvatar } from './userProfile';
import { MultiSelect } from './Select';
import { HistoryManager } from './HistoryManager';
import { isImageType } from '../constants/mimeTypes';
import { EventEmitter } from 'events';

export const imageLoadMonitor = new EventEmitter();

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

const chatWindowSize = (
  leftOpen: boolean,
  rightOpen: boolean,
  viewportWidth: number
): string => {
  if (viewportWidth > desktop) {
    return `chat-window-l${leftOpen ? 'o' : 'c'}r${rightOpen ? 'o' : 'c'}`;
  }

  if (viewportWidth > tablet) {
    return `chat-window-l${leftOpen ? 'o' : 'c'}rc`;
  }

  if (viewportWidth <= tablet) {
    return 'chat-window-lcrc';
  }

  return '';
};

const tablet = 769;
const desktop = 1024;

type State = {
  channelList: IChannel[];
  userInfo: IUser | null;
  onlineLists: Record<string, IUser[]>;
  leftBarAnimation: string;
  rightBarAnimation: string;
  chatHistory: IChatMessage[][];
  inputValue: string;
  modalIsActive: boolean;
  modalContents: JSX.Element;
  joinedRooms: string[];
  viewportWidth: number;
  viewportHeight: number;
  widthHistory: number[];
  leftBarOpen: boolean;
  redirect: string | null;
  rightBarOpen: boolean;
  leftBarClosing: boolean;
  rightBarClosing: boolean;
  scrollLock: boolean;
  initialLoad: boolean;
};

type Props = {
  match: any;
};

export class Chat extends Component<Props, State> {
  messagesEnd: any = React.createRef();
  historyManager = new HistoryManager();
  currentChannel = '';
  imagesLoaded: HTMLSpanElement[];

  constructor(props: Props) {
    super(props);
    this.state = {
      channelList: [],
      chatHistory: [[]],
      userInfo: null,
      inputValue: '',
      onlineLists: {},
      leftBarAnimation: '',
      rightBarAnimation: '',
      modalIsActive: false,
      scrollLock: true,
      modalContents: <span />,
      joinedRooms: [],
      redirect: null,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      widthHistory: [window.innerWidth],
      leftBarOpen: window.innerWidth > tablet,
      rightBarOpen: window.innerWidth > desktop,
      rightBarClosing: false,
      leftBarClosing: false,
      initialLoad: true,
    };
    this.imagesLoaded = [];
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.changeNickname = this.changeNickname.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    this.openRightBar = this.openRightBar.bind(this);
    this.closeRightBar = this.closeRightBar.bind(this);
    this.toggleRightBar = this.toggleRightBar.bind(this);
    this.openLeftBar = this.openLeftBar.bind(this);
    this.closeLeftBar = this.closeLeftBar.bind(this);
    this.toggleLeftBar = this.toggleLeftBar.bind(this);
    this.pasteHandler = this.pasteHandler.bind(this);
  }

  toggleRightBar() {
    if (this.state.rightBarOpen) {
      this.closeRightBar();
    } else {
      this.openRightBar();
    }
  }

  toggleLeftBar() {
    if (this.state.leftBarOpen) {
      this.closeLeftBar();
    } else {
      this.openLeftBar();
    }
  }

  pasteHandler(e: any) {
    if (e.clipboardData) {
      var items = e.clipboardData.items;

      if (items) {
        for (var i = 0; i < items.length; i++) {
          if (isImageType(items[i].type)) {
            var blob = items[i].getAsFile();
            var reader = new FileReader();
            reader.onload = async (event) => {
              const file = event.target?.result;
              if (file) {
                const view = new Uint8Array(file as ArrayBuffer);
                console.log(view);
                const uploadedFileInfo = await client.files.create(
                  Utils.toHexString(view),
                  'user pasted image',
                  this.props.match.params.id
                );
                await client.messages.send(
                  this.props.match.params.id,
                  '![user uploaded image](' + uploadedFileInfo.url + ')'
                );
              }
            };
            reader.readAsArrayBuffer(blob);
          }
        }
      }
    }
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
    if (
      !this.props.match.params.id &&
      !this.props.match.params.resourceType &&
      localStorage.getItem('currentChannel')
    ) {
      this.setState({
        redirect: `/channel/${localStorage.getItem('currentChannel')!}`,
      });
    }

    imageLoadMonitor.on('imageLoad', (ref) => {
      this.imagesLoaded.push(ref);
      if (!this.state.initialLoad) {
        return;
      }

      if (
        document
          .getElementById('chat-window')
          ?.getElementsByClassName('chat-image-wrapper').length ===
        this.imagesLoaded.length
      ) {
        this.scrollToBottom();
        this.setState({
          initialLoad: false,
        });
      }
    });

    if (this.props.match.params.id) {
      this.currentChannel = this.props.match.params.id;
      localStorage.setItem('currentChannel', this.props.match.params.id);
    }
    window.addEventListener('resize', this.updateWindowDimensions);
    window.addEventListener('paste', this.pasteHandler);
    client.on('authed', async () => {
      const channelList = await client.channels.retrieve();
      this.setState({
        channelList,
      });

      await this.historyManager.fetchHistory(channelList);

      for (const channel of channelList) {
        await client.channels.join(channel.channelID);
        const { joinedRooms } = this.state;
        joinedRooms.push(channel.channelID);
        this.setState({
          joinedRooms,
        });
      }

      this.setState({
        chatHistory: this.historyManager.getHistory(this.props.match.params.id),
      });

      this.scrollToBottom();
    });

    client.on('userInfo', (userInfo) => {
      this.setState({
        userInfo,
      });
    });

    client.on('peerChange', (peerInfo) => {
      console.log('reached');
      console.log(this.state.channelList);
      this.historyManager.fetchHistory(this.state.channelList);
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
        }
      }

      this.setState({
        chatHistory: this.historyManager.getHistory(this.props.match.params.id),
      });
    });

    client.on('onlineList', async (onlineList, channelID) => {
      const { onlineLists } = this.state;
      onlineLists[channelID] = onlineList;

      this.setState({
        onlineLists,
      });
    });

    this.historyManager.on('reloadAll', () => {
      this.setState({
        chatHistory: this.historyManager.getHistory(this.props.match.params.id),
      });
    });

    this.historyManager.on('message', async (message: IChatMessage) => {
      if (message.channelID === this.currentChannel) {
        this.setState({
          chatHistory: this.historyManager.getHistory(
            this.props.match.params.id
          ),
        });
      }
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  async componentDidUpdate() {
    if (this.currentChannel !== this.props.match.params.id) {
      this.currentChannel = this.props.match.params.id;
      this.setState({
        chatHistory: this.historyManager.getHistory(this.currentChannel),
      });
      this.imagesLoaded = [];
      this.setState(
        {
          initialLoad: true,
          scrollLock: true,
        },
        () => {
          this.scrollToBottom();
        }
      );
    }

    if (this.state.scrollLock) {
      this.scrollToBottom();
    }
  }

  scrollToBottom = () => {
    if (this.messagesEnd.current) {
      this.messagesEnd.current.scrollIntoView({});
    }
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
    this.setState(
      {
        rightBarAnimation: 'slide-out-right',
        rightBarClosing: true,
      },
      async () => {
        await Utils.sleep(500);
        this.setState({
          rightBarOpen: false,
          rightBarAnimation: '',
          rightBarClosing: false,
        });
      }
    );
  }

  openRightBar() {
    this.setState(
      {
        rightBarAnimation: 'slide-in-right',
        rightBarOpen: true,
      },
      async () => {
        await Utils.sleep(500);
        this.setState({
          rightBarAnimation: '',
        });
      }
    );
  }

  closeLeftBar() {
    this.setState(
      {
        leftBarAnimation: 'slide-out-left',
        leftBarClosing: true,
      },
      async () => {
        await Utils.sleep(500);
        this.setState({
          leftBarOpen: false,
          leftBarAnimation: '',
          leftBarClosing: false,
        });
      }
    );
  }

  openLeftBar() {
    this.setState(
      {
        leftBarAnimation: 'slide-in-left',
        leftBarOpen: true,
      },
      async () => {
        await Utils.sleep(500);
        this.setState({
          leftBarAnimation: '',
        });
      }
    );
  }

  render() {
    let fileUploadRef: HTMLInputElement | null = null;
    const redirectPath = this.state.redirect;
    if (redirectPath) {
      this.setState({
        redirect: null,
      });

      return <Redirect to={redirectPath} />;
    }

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
            if (!this.state.leftBarOpen) {
              this.openLeftBar();
            }
          }}
        >
          {' '}
          <div className="swipe-anchor-left" />
        </Swipeable>

        <Swipeable
          onSwipedLeft={(eventData) => {
            if (!this.state.rightBarOpen) {
              this.openRightBar();
            }
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
          <div
            className="modal-background image-preview-background"
            onClick={this.closeModal}
          ></div>
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
        <div className="top-bar">
          <div className={`has-background-black-ter`}>
            <div
              className={`pointer-cursor mobile-menu-toggle-wrapper`}
              onClick={() => {
                this.toggleLeftBar();
              }}
            >
              <div className="Aligner">
                <div className="Aligner-item Aligner-item--top"></div>
                <div className="Aligner-item ">
                  <FontAwesomeIcon
                    icon={faBars}
                    className={`${
                      this.state.leftBarOpen && !this.state.leftBarClosing
                        ? 'has-text-white'
                        : 'has-text-grey-darker'
                    }`}
                  />
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
            <div
              className="user-menu-toggle-wrapper pointer-cursor"
              onClick={() => {
                this.toggleRightBar();
              }}
            >
              <div className="Aligner">
                <div className="Aligner-item Aligner-item--top"></div>
                <div className="Aligner-item">
                  <FontAwesomeIcon
                    icon={faUsers}
                    className={`${
                      this.state.rightBarOpen && !this.state.rightBarClosing
                        ? 'has-text-white'
                        : 'has-text-grey-darker'
                    }`}
                  />
                </div>
                <div className="Aligner-item Aligner-item--bottom"></div>
              </div>
            </div>
          </div>
        </div>
        <Swipeable
          onSwipedLeft={(eventData) => {
            this.closeLeftBar();
          }}
        >
          <div
            id="channelBar"
            className={`${
              this.state.leftBarAnimation
            } left-channelbar has-background-black-bis ${
              this.state.leftBarOpen ? '' : 'hidden'
            }`}
          >
            <aside className="menu">
              <p className="menu-label">
                <span className="menu-title-wrapper">Channels</span>
                <span className="icon-group">
                  {client.info().client &&
                    client.info().client!.powerLevel >
                      client.info().powerLevels.create && (
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
                        }}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </span>
                    )}
                </span>
              </p>
              <ul className="menu-list">
                {this.state.channelList.map((channel) => (
                  <div key={'channel-list-' + channel.channelID}>
                    <ContextMenuTrigger
                      id={'channel-list-trigger-' + channel.channelID}
                    >
                      <li className="channel-list-item">
                        <Link
                          className={`channel-list-link ${
                            channel.channelID === this.props.match.params.id
                              ? 'is-active'
                              : ''
                          }`}
                          to={'/channel/' + channel.channelID}
                        >
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
                  {this.state.userInfo && (
                    <Fragment>
                      <span className="image is-32x32 user-bar-avatar">
                        {getAvatar(this.state.userInfo)}
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
                            await userProfile(
                              this.state.userInfo!,
                              this.closeModal
                            )
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

        <Dropzone
          onDrop={(acceptedFiles) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const file = event.target?.result;
              if (file) {
                const view = new Uint8Array(file as ArrayBuffer);
                console.log(view);
                const uploadedFileInfo = await client.files.create(
                  Utils.toHexString(view),
                  acceptedFiles[0].name,
                  this.props.match.params.id
                );
                await client.messages.send(
                  this.props.match.params.id,
                  isImageType(acceptedFiles[0].type)
                    ? '![user uploaded image](' + uploadedFileInfo.url + ')'
                    : uploadedFileInfo.url
                );
              }
            };
            reader.onerror = (error) => {
              throw error;
            };
            reader.readAsArrayBuffer(acceptedFiles[0]);
          }}
        >
          {({ getRootProps, getInputProps }) => (
            <section>
              <div {...getRootProps()}>
                <div
                  id="chat-window"
                  className={`${chatWindowSize(
                    this.state.leftBarOpen,
                    this.state.rightBarOpen,
                    this.state.viewportWidth
                  )} chat-window has-background-black-ter`}
                  onScroll={(event) => {
                    const chatWindowHeight = (event.target as HTMLInputElement)
                      .offsetHeight;
                    const scrollHeight = (event.target as HTMLInputElement)
                      .scrollHeight;
                    const scrollTop = (event.target as HTMLInputElement)
                      .scrollTop;
                    const vScrollPosition =
                      scrollHeight - (scrollTop + chatWindowHeight);

                    if (vScrollPosition === 0) {
                      this.setState({
                        scrollLock: true,
                      });
                    }

                    if (vScrollPosition > 150) {
                      this.setState({
                        scrollLock: false,
                      });
                    }
                  }}
                >
                  {!this.state.scrollLock && (
                    <div className="chat-window-snap-to-bottom">
                      <FontAwesomeIcon
                        icon={faArrowCircleDown}
                        onClick={() => {
                          this.setState(
                            {
                              scrollLock: true,
                            },
                            () => {
                              this.scrollToBottom();
                            }
                          );
                        }}
                      />
                    </div>
                  )}

                  <div className="chat-message-wrapper">
                    {this.state.chatHistory.map((messages) => {
                      if (messages.length === 0) return null;
                      return (
                        <article
                          className="media chat-message"
                          key={'chat-message-block-' + messages[0].messageID}
                        >
                          <figure className="media-left">
                            <p className="image is-48x48">
                              {getAvatar(messages[0].author)}
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
                                  onClick={async () => {
                                    this.openModal(
                                      await userProfile(
                                        messages[0].author,
                                        this.closeModal
                                      )
                                    );
                                  }}
                                >
                                  {messages[0].username}
                                  <span className="translucent">
                                    #{getUserHexTag(messages[0].userID)}
                                  </span>
                                </span>{' '}
                                <small>
                                  {new Date(
                                    messages[0].createdAt
                                  ).toLocaleTimeString()}
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
                                {client.info().client &&
                                  client.info().client!.powerLevel >
                                    client.info().powerLevels.create && (
                                    <MenuItem
                                      data={messages[0]}
                                      onClick={async (e: any, data: any) => {
                                        const confirmation = (
                                          <div className="">
                                            <p className="has-text-white">
                                              BAN USER{' '}
                                              {messages[0].username.toUpperCase()}
                                              #
                                              {getUserHexTag(
                                                messages[0].userID
                                              )}
                                              ?
                                            </p>
                                            <br />
                                            <div className="modal-bottom-strip">
                                              <div className="buttons is-right">
                                                <button
                                                  className="button is-danger"
                                                  onClick={async () => {
                                                    await client.users.ban(
                                                      messages[0].userID
                                                    );
                                                    this.closeModal();
                                                  }}
                                                >
                                                  Ban
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        );

                                        this.openModal(confirmation);
                                      }}
                                    >
                                      Ban
                                    </MenuItem>
                                  )}

                                <MenuItem divider />
                                <MenuItem
                                  data={messages[0]}
                                  onClick={async (e: any, data: any) => {
                                    this.openModal(
                                      await userProfile(
                                        messages[0].author,
                                        this.closeModal
                                      )
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
                                  <span className="chat-message-text">
                                    {(message as any).markdown ||
                                      message.message}
                                  </span>
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
              </div>
            </section>
          )}
        </Dropzone>

        <div
          className={`${chatWindowSize(
            this.state.leftBarOpen,
            this.state.rightBarOpen,
            this.state.viewportWidth
          )} bottom-bar has-background-black-ter`}
        >
          <div
            className="chat-input-wrapper has-background-grey-darker"
            onFocus={() => {
              if (this.state.scrollLock) {
                this.scrollToBottom();
              }
            }}
          >
            <input
              type="file"
              style={{ display: 'none' }}
              ref={(ref) => (fileUploadRef = ref)}
              onChange={(fileEvent) => {
                console.log(fileEvent);
                if (fileEvent.target && fileEvent.target.files) {
                  console.log(fileEvent.target.files);
                  fileEvent.persist();
                  const reader = new FileReader();
                  reader.onload = async (loadEvent) => {
                    const file = loadEvent.target?.result;
                    if (file) {
                      console.log('client', client);
                      const view = new Uint8Array(file as ArrayBuffer);
                      const uploadedFileInfo = await client.files.create(
                        Utils.toHexString(view),
                        fileEvent.target.files![0].name,
                        this.props.match.params.id
                      );
                      console.log(fileEvent.target.files![0].type);
                      await client.messages.send(
                        this.props.match.params.id,
                        isImageType(fileEvent.target.files![0].type)
                          ? '![user uploaded image](' +
                              uploadedFileInfo.url +
                              ')'
                          : uploadedFileInfo.url
                      );
                    }
                  };
                  reader.onerror = (error) => {
                    throw error;
                  };
                  reader.readAsArrayBuffer(fileEvent.target.files[0]);
                }
              }}
            />
            <span
              className="chat-input-attach-button pointer-cursor"
              onClick={() => {
                fileUploadRef?.click();
              }}
            >
              <FontAwesomeIcon icon={faPaperclip} />
            </span>
            <textarea
              className="chat-input"
              value={this.state.inputValue}
              onChange={(event) => {
                this.setState({
                  inputValue: event.target.value,
                });
              }}
              onKeyPress={async (event) => {
                event.persist();
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (this.state.inputValue === '') {
                    return;
                  }
                  this.setState({
                    inputValue: '',
                  });
                  await client.messages.send(
                    this.props.match.params.id,
                    this.state.inputValue
                  );
                }
              }}
            />
          </div>
        </div>
        <Swipeable
          onSwipedRight={(eventData) => {
            this.closeRightBar();
          }}
        >
          <div
            id="onlineUserBar"
            className={`${
              this.state.rightBarAnimation
            } right-sidebar has-background-black-bis ${
              this.state.rightBarOpen ? '' : 'hidden'
            }`}
          >
            <aside className="menu">
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
                              this.openModal(
                                await userProfile(user, this.closeModal)
                              );
                            }}
                          >
                            Add To Channel
                          </MenuItem>
                          {client.info().client &&
                            client.info().client!.powerLevel >
                              client.info().powerLevels.create && (
                              <MenuItem
                                data={user}
                                onClick={async (e: any, data: any) => {
                                  const confirmation = (
                                    <div className="">
                                      <p className="has-text-white">
                                        BAN USER {user.username.toUpperCase()}#
                                        {getUserHexTag(user.userID)}?
                                      </p>
                                      <br />
                                      <div className="modal-bottom-strip">
                                        <div className="buttons is-right">
                                          <button
                                            className="button is-danger"
                                            onClick={async () => {
                                              await client.users.ban(
                                                user.userID
                                              );
                                              this.closeModal();
                                            }}
                                          >
                                            Ban
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );

                                  this.openModal(confirmation);
                                }}
                              >
                                Ban
                              </MenuItem>
                            )}
                          <MenuItem divider />
                          <MenuItem
                            data={user}
                            onClick={async (e: any, data: any) => {
                              this.openModal(
                                await userProfile(user, this.closeModal)
                              );
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
