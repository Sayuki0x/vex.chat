import { desktop, tablet } from '../constants/responsiveness';

export const chatWindowSize = (
  leftOpen: boolean,
  rightOpen: boolean,
  viewportWidth: number
): string => {
  if (viewportWidth > desktop) {
    return `chat-window-l${leftOpen ? 'o' : 'c'}r${rightOpen ? 'o' : 'c'}`;
  }

  if (viewportWidth > tablet) {
    return `chat-window-l${leftOpen ? 'o' : 'c'}rc`;
  }

  if (viewportWidth <= tablet) {
    return 'chat-window-lcrc';
  }

  return '';
};
