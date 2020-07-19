/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { IUser } from 'libvex';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import { uniqueArray } from '../utils/uniqueArray';
import { getUserHexTag } from '../utils/getUserHexTag';
import { getUserIcon, userProfile } from './userProfile';
import { client } from '../App';

type Props = {
  onlineLists: Record<string, IUser[]>;
  match: any;
  changeNickname: () => void;
  openModal: (el: JSX.Element) => void;
  closeModal: () => void;
};

type State = {};

export class OnlineUserbar extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <aside className="menu">
        <p className="menu-label">Online</p>
        <ul className="menu-list">
          {this.props.onlineLists[this.props.match.params.id] &&
            uniqueArray(this.props.onlineLists[this.props.match.params.id]).map(
              (user) => {
                return (
                  <div
                    key={'online-user-' + user.userID}
                    onClick={async () => {
                      this.props.openModal(
                        await userProfile(
                          user,
                          this.props.closeModal,
                          this.props.openModal,
                          this.props.changeNickname
                        )
                      );
                    }}
                  >
                    <ContextMenuTrigger
                      id={'online-user-trigger-' + user.userID}
                    >
                      <a>
                        <li>
                          {' '}
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
                      </a>
                    </ContextMenuTrigger>
                    <ContextMenu id={'online-user-trigger-' + user.userID}>
                      {user.userID === client.info().client?.userID && (
                        <MenuItem
                          data={user}
                          onClick={this.props.changeNickname}
                        >
                          Change Nickname
                        </MenuItem>
                      )}

                      <MenuItem
                        data={user}
                        onClick={async (e: any, data: any) => {
                          this.props.openModal(
                            await userProfile(
                              user,
                              this.props.closeModal,
                              this.props.openModal,
                              this.props.changeNickname
                            )
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
                                          await client.users.ban(user.userID);
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
                        data={user}
                        onClick={async () => {
                          this.props.openModal(
                            await userProfile(
                              user,
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
                  </div>
                );
              }
            )}
        </ul>
      </aside>
    );
  }
}
