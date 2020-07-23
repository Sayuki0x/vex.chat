import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHashtag,
  faKey,
  faPlus,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { IChannel } from 'libvex';
import { client } from '../App';
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu';
import { Link } from 'react-router-dom';
import { getUserHexTag } from '../utils/getUserHexTag';
import { getUserIcon } from './userProfile';

type Props = {
  closeModal: () => void;
  openModal: (el: JSX.Element) => void;
  channelList: IChannel[];
  match: any;
  unreadMessageCounts: Record<string, number>;
};

type State = {};

export class Channelbar extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <aside className="menu">
        <p className="menu-label">
          <span className="menu-title-wrapper">Channels</span>
          <span className="icon-group">
            {client.user && client.user.powerLevel > client.powerLevels.create && (
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
                        this.props.closeModal();

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
                        <button className="button is-black" type="submit">
                          Save
                        </button>
                      </div>
                    </form>
                  );

                  this.props.openModal(newChannelForm);
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
              </span>
            )}
          </span>
        </p>
        <ul className="menu-list">
          {this.props.channelList.map((channel) => (
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
                    {this.props.unreadMessageCounts[channel.channelID] > 0 && (
                      <span className="unread-icon is-family-monospace has-text-weight-bold">
                        {this.props.unreadMessageCounts[channel.channelID]}
                      </span>
                    )}
                  </Link>
                </li>
              </ContextMenuTrigger>
              <ContextMenu id={'channel-list-trigger-' + channel.channelID}>
                {!channel.public && (
                  <MenuItem
                    onClick={async (event, data) => {
                      const permissionList = await client.permissions.retrieve(
                        channel.channelID
                      );
                      const userArray = [];

                      for (const perm of permissionList) {
                        const user = client.users.retrieve(perm.userID);
                        userArray.push(user);
                      }

                      const resolvedPromises = await Promise.all(userArray);
                      let selectedUser = '';

                      const channelPermsEditor = (
                        <div className="large-modal">
                          <p className="has-text-white">
                            #{channel.name.toUpperCase()} CHANNEL PERMISSIONS
                          </p>
                          <br />
                          <ul>
                            {resolvedPromises.map((user) => {
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
                                      color: (user as any).color,
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

                      this.props.openModal(channelPermsEditor);
                    }}
                  >
                    <p>Permissions</p>
                  </MenuItem>
                )}
                {client.user &&
                  client.user.powerLevel > client.powerLevels.delete && (
                    <MenuItem
                      onClick={(event, data) => {
                        const deleteConfirm = (
                          <div>
                            <div className="has-text-white">
                              <span className="has-text-white">CONFIRM</span>
                              <br />
                              Are you sure you want to delete{' '}
                              <strong>{channel.name}</strong>?
                            </div>
                            <div className="modal-bottom-strip">
                              <div className="buttons is-right">
                                <button
                                  className="button is-danger"
                                  onClick={async () => {
                                    this.props.closeModal();
                                    await client.channels.delete(
                                      channel.channelID
                                    );
                                  }}
                                >
                                  Yes
                                </button>
                                <button
                                  className="button is-black"
                                  onClick={this.props.closeModal}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          </div>
                        );

                        this.props.openModal(deleteConfirm);
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
                        this.props.openModal(
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
    );
  }
}
