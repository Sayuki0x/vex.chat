import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import { Utils, IChatMessage } from 'libvex';
import { client } from '../App';
import { isImageType } from '../constants/mimeTypes';
import { faArrowCircleDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getAvatar, userProfile } from './userProfile';
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu';
import { getUserHexTag } from '../utils/getUserHexTag';
import { MultiSelect } from './Select';
import { chatWindowSize } from '../utils/chatWindowSize';

type Props = {
  match: any;
  leftBarOpen: boolean;
  rightBarOpen: boolean;
  viewportWidth: number;
  scrollLock: boolean;
  chatHistory: IChatMessage[][];
  openModal: (el: JSX.Element) => void;
  closeModal: () => void;
  scrollToBottom: () => void;
  changeNickname: () => void;
  setScrollLock: (state: boolean) => void;
};

type State = {};

export class ChatWindow extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidUpdate() {}

  render() {
    return (
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
                  this.props.leftBarOpen,
                  this.props.rightBarOpen,
                  this.props.viewportWidth
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
                    this.props.setScrollLock(true);
                  }

                  if (vScrollPosition > 150) {
                    this.props.setScrollLock(false);
                  }
                }}
              >
                {!this.props.scrollLock && (
                  <div className="chat-window-snap-to-bottom">
                    <FontAwesomeIcon
                      icon={faArrowCircleDown}
                      onClick={() => {
                        this.props.setScrollLock(true);
                        this.props.scrollToBottom();
                      }}
                    />
                  </div>
                )}

                <div className="chat-message-wrapper">
                  {this.props.chatHistory.map((messages) => {
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
                                  color: (messages[0].author as any).color,
                                }}
                                onClick={async () => {
                                  this.props.openModal(
                                    await userProfile(
                                      messages[0].author,
                                      this.props.closeModal,
                                      this.props.openModal,
                                      this.props.changeNickname
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
                              {messages[0].userID === client.user?.userID && (
                                <MenuItem
                                  data={messages[0]}
                                  onClick={this.props.changeNickname}
                                >
                                  Change Nickname
                                </MenuItem>
                              )}
                              {client.user &&
                                client.user.powerLevel >
                                  client.powerLevels.grant && (
                                  <MenuItem
                                    data={messages[0]}
                                    onClick={(e: any, data: any) => {
                                      let selectedValues: any[] = [];
                                      const grantForm = (
                                        <form
                                          className="large-modal"
                                          onSubmit={async (event) => {
                                            event.preventDefault();
                                            // this.props.closeModal();
                                            for (const selection of selectedValues) {
                                              await client.permissions.create(
                                                messages[0].userID,
                                                selection.value
                                              );
                                            }
                                            this.props.closeModal();
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
                                      this.props.openModal(grantForm);
                                    }}
                                  >
                                    Add To Channel
                                  </MenuItem>
                                )}
                              {client.user &&
                                client.user.powerLevel >
                                  client.powerLevels.create && (
                                  <MenuItem
                                    data={messages[0]}
                                    onClick={async (e: any, data: any) => {
                                      const confirmation = (
                                        <div className="">
                                          <p className="has-text-white">
                                            BAN USER{' '}
                                            {messages[0].username.toUpperCase()}
                                            #{getUserHexTag(messages[0].userID)}
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
                                                  this.props.closeModal();
                                                }}
                                              >
                                                Ban
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );

                                      this.props.openModal(confirmation);
                                    }}
                                  >
                                    Ban
                                  </MenuItem>
                                )}

                              <MenuItem divider />
                              <MenuItem
                                data={messages[0]}
                                onClick={async (e: any, data: any) => {
                                  this.props.openModal(
                                    await userProfile(
                                      messages[0].author,
                                      this.props.closeModal,
                                      this.props.openModal,
                                      this.props.changeNickname
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
                                  {(message as any).markdown || message.message}
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
                    id={'messagesEnd'}
                    style={{ float: 'left', clear: 'both' }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </Dropzone>
    );
  }
}
