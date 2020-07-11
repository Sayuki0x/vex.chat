import React from "react";
import {client} from "../App";
import defaultAvatar from '../images/default_avatar.svg';
import { getUserColor, getUserHexTag } from '../utils/getUserColor';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faPoo } from "@fortawesome/free-solid-svg-icons";

const downloadTxtFile = (s: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([s], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

export const getUserIcon = (powerLevel: number) => {
    if (powerLevel === 100)
      return (
        <span className="role-icon has-text-warning">
          <FontAwesomeIcon icon={faCrown} />
        </span>
      );
  
    if (powerLevel >= 50 && powerLevel < 100)
      return (
        <span className="role-icon has-text-grey">
          <FontAwesomeIcon icon={faCrown} />
        </span>
      );
  
    if (powerLevel >= 25 && powerLevel < 50)
      return (
        <span className="role-icon has-text-brown">
          <FontAwesomeIcon icon={faPoo} />
        </span>
      );
    return null;
  };

export const userProfile = async (userID: string) => {
    const userDetails = await client.users.retrieve(userID);

    return (
      <article className="media profile-modal has-background-black">
        <figure className="media-left">
          <p className="image is-64x64">
            <img
              src={defaultAvatar}
              alt="user avatar"
              className="is-rounded"
              style={{
                backgroundColor: getUserColor(userID),
              }}
            />
          </p>
        </figure>
        <div className="media-content">
          <div className="content">
            <p
              className="has-text-weight-bold is-size-3"
              style={{ color: getUserColor(userDetails.userID) }}
            >
              {userDetails.username}
              <span className="translucent">
                #{getUserHexTag(userDetails.userID)}
              </span>
              &nbsp;&nbsp;
              {getUserIcon(userDetails.powerLevel)}
            </p>
            <p className="has-text-white is-family-monospace is-size-7">
              Public Key <br />
              {userDetails.pubkey}
            </p>

            <p className="has-text-white is-family-monospace is-size-7">
              User ID <br />
              {userDetails.userID}
            </p>

            <p className="has-text-white is-family-monospace is-size-7">
              Power Level <br />
              {userDetails.powerLevel}
            </p>

            {userDetails.userID === client.info().client!.userID && (
              <button
                className="button is-danger is-small"
                onClick={() => {
                  downloadTxtFile(
                    localStorage.getItem('pk')!,
                    'key.priv'
                  );
                }}
              >
                Save Private Key
              </button>
            )}
          </div>
          <nav className="level is-mobile">
            <div className="level-left">
              <a className="level-item">
                <span className="icon is-small">
                  <i className="fas fa-reply"></i>
                </span>
              </a>
              <a className="level-item">
                <span className="icon is-small">
                  <i className="fas fa-retweet"></i>
                </span>
              </a>
              <a className="level-item">
                <span className="icon is-small">
                  <i className="fas fa-heart"></i>
                </span>
              </a>
            </div>
          </nav>
        </div>
        <div className="media-right"></div>
      </article>
    );
  };