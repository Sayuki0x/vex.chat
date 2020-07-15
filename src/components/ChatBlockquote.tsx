import React, { Component } from 'react';
import { faGreaterThan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type State = {};

type Props = any;

export class ChatBlockquote extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    console.log(this.props);
    return (
      <span className="has-text-success block-quote-wrapper">
        <FontAwesomeIcon icon={faGreaterThan} />
        {this.props.children}
      </span>
    );
  }
}
