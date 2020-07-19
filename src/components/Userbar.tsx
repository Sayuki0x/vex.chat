import React, { Component, Fragment } from 'react';
import { IUser } from 'libvex';
import { client } from '../App';
import { getAvatar, userProfile } from './userProfile';
import { getUserHexTag } from '../utils/getUserHexTag';
import { tablet } from '../constants/responsiveness';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';

type Props = {
  userInfo: IUser | null;
  openModal: (el: JSX.Element) => void;
  closeModal: () => void;
  closeLeftBar: () => void;
  viewportWidth: number;
};

type State = {};

export class Userbar extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="user-bar">
        <div className="Aligner">
          <div className="Aligner-item Aligner-item--top" />
          <div className="Aligner-item">
            {this.props.userInfo && (
              <Fragment>
                <span className="image is-32x32 user-bar-avatar">
                  {getAvatar(this.props.userInfo)}
                </span>
                <span
                  className="user-bar-username"
                  style={{
                    color: (this.props.userInfo as any).color,
                  }}
                >
                  <strong
                    style={{
                      color: (this.props.userInfo as any).color,
                    }}
                  >
                    {client.info().client!.username}
                    <span className="translucent">
                      #{getUserHexTag(client.info().client!.userID)}
                    </span>
                  </strong>
                  <span className="translucent">
                    {/* "#" + getUserHexTag(client.info().client!.userID) */}
                  </span>
                </span>
                <span
                  className="user-bar-cog-wrapper"
                  onClick={async () => {
                    this.props.openModal(
                      await userProfile(
                        this.props.userInfo!,
                        this.props.closeModal,
                        this.props.openModal
                      )
                    );
                    if (this.props.viewportWidth < tablet) {
                      this.props.closeLeftBar();
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
    );
  }
}
