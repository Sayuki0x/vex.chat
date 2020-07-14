import React, { Component, Fragment } from 'react';

type State = {};

type Props = {
  src: string;
  alt: string;
};

export class ChatImage extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <Fragment>
        <a href={this.props.src}>{this.props.src}</a>
        <br />
        <img
          src={this.props.src}
          alt={this.props.alt}
          style={{ maxWidth: '375px' }}
        />
      </Fragment>
    );
  }
}
