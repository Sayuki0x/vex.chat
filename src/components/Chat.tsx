import React, { Component } from 'react';
import { IChannel } from 'libvex';
import { client } from '../App';
import { Link } from 'react-router-dom';

type State = {
  channelList: IChannel[];
};

type Props = {
  match: any;
};

export class Chat extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      channelList: [],
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
      }
    });

    client.on('channelList', async (channelList) => {
      this.setState({
        channelList,
      });
    });
  }

  render() {
    return (
      <div>
        <div className="left-sidebar has-background-black-ter"></div>
        <div className="left-channelbar has-background-black-bis">
          <aside className="menu">
            <p className="menu-label">Channels</p>
            <ul className="menu-list">
              {this.state.channelList.map((channel) => (
                <li>
                  <Link to={'/channel/' + channel.channelID}>
                    #<strong> {channel.name}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
        <div className="top-bar">
          <div className="top-bar-left has-background-black-bis"></div>
          <div className="top-bar-right has-background-black-ter"></div>
        </div>

        <div className="chat-window has-background-black-ter"></div>
        <div className="bottom-bar has-background-black-ter">
          <div className="chat-input-wrapper has-background-grey-darker">
            <textarea className="chat-input" />
          </div>
        </div>
        <div className="right-sidebar has-background-black-bis"></div>
      </div>
    );
  }
}
