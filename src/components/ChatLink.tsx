import React, { Component } from 'react';
import ax from 'axios';

type State = {};

type Props = {
  target: string;
  href: string;
  children: any[];
};

export class ChatLink extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <a href={(this.props as any).href} target={(this.props as any).target}>
        {this.props.children}
      </a>
    );
  }
}
