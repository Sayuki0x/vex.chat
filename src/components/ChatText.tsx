import React, { Component } from 'react';

type State = {};

type Props = {
  children: any[];
};

export class ChatText extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    return <span>{this.props.children}</span>;
  }
}
