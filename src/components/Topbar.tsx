import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faHashtag,
  faKey,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { IChannel } from 'libvex';

type Props = {
  toggleLeftBar: () => void;
  toggleRightBar: () => void;
  leftBarOpen: boolean;
  leftBarClosing: boolean;
  rightBarOpen: boolean;
  rightBarClosing: boolean;
  channelList: IChannel[];
  match: any;
};

type State = {};

export class Topbar extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className={`has-background-black-ter`}>
        <div
          className={`pointer-cursor mobile-menu-toggle-wrapper`}
          onClick={() => {
            this.props.toggleLeftBar();
          }}
        >
          <div className="Aligner">
            <div className="Aligner-item Aligner-item--top"></div>
            <div className="Aligner-item ">
              <FontAwesomeIcon
                icon={faBars}
                className={`${
                  this.props.leftBarOpen && !this.props.leftBarClosing
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
                {this.props.channelList.map((channel) => {
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
            this.props.toggleRightBar();
          }}
        >
          <div className="Aligner">
            <div className="Aligner-item Aligner-item--top"></div>
            <div className="Aligner-item">
              <FontAwesomeIcon
                icon={faUsers}
                className={`${
                  this.props.rightBarOpen && !this.props.rightBarClosing
                    ? 'has-text-white'
                    : 'has-text-grey-darker'
                }`}
              />
            </div>
            <div className="Aligner-item Aligner-item--bottom"></div>
          </div>
        </div>
      </div>
    );
  }
}
