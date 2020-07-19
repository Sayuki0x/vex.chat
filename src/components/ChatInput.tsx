import React, { Component } from 'react';
import { client } from '../App';
import { Utils } from 'libvex';
import { isImageType } from '../constants/mimeTypes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';

type Props = {
  scrollLock: boolean;
  scrollToBottom: () => void;
  match: any;
};

type State = {
  inputValue: string;
};

export class ChatInput extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      inputValue: '',
    };
  }

  render() {
    let fileUploadRef: HTMLInputElement | null;

    return (
      <div
        className="chat-input-wrapper has-background-grey-darker"
        onFocus={() => {
          if (this.props.scrollLock) {
            this.props.scrollToBottom();
          }
        }}
      >
        <input
          type="file"
          style={{ display: 'none' }}
          ref={(ref) => (fileUploadRef = ref)}
          onChange={(fileEvent) => {
            console.log(fileEvent);
            if (fileEvent.target && fileEvent.target.files) {
              console.log(fileEvent.target.files);
              fileEvent.persist();
              const reader = new FileReader();
              reader.onload = async (loadEvent) => {
                const file = loadEvent.target?.result;
                if (file) {
                  console.log('client', client);
                  const view = new Uint8Array(file as ArrayBuffer);
                  const uploadedFileInfo = await client.files.create(
                    Utils.toHexString(view),
                    fileEvent.target.files![0].name,
                    this.props.match.params.id
                  );
                  console.log(fileEvent.target.files![0].type);
                  await client.messages.send(
                    this.props.match.params.id,
                    isImageType(fileEvent.target.files![0].type)
                      ? '![user uploaded image](' + uploadedFileInfo.url + ')'
                      : uploadedFileInfo.url
                  );
                }
              };
              reader.onerror = (error) => {
                throw error;
              };
              reader.readAsArrayBuffer(fileEvent.target.files[0]);
            }
          }}
        />
        <span
          className="chat-input-attach-button pointer-cursor"
          onClick={() => {
            fileUploadRef?.click();
          }}
        >
          <FontAwesomeIcon icon={faPaperclip} />
        </span>
        <textarea
          className="chat-input"
          value={this.state.inputValue}
          onChange={(event) => {
            this.setState({
              inputValue: event.target.value,
            });
          }}
          onKeyPress={async (event) => {
            event.persist();
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (this.state.inputValue === '') {
                return;
              }
              this.setState({
                inputValue: '',
              });
              await client.messages.send(
                this.props.match.params.id,
                this.state.inputValue
              );
            }
          }}
        />
      </div>
    );
  }
}
