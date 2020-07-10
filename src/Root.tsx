import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import { Chat } from './components/Chat';

type State = {};

type Props = {};

export class Root extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <Switch>
        <Route
          path={'/:resourceType?/:id?'}
          render={({ match }) => <Chat match={match} />}
        />
      </Switch>
    );
  }
}
