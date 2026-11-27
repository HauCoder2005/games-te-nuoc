export type IconName =
  | 'swords' | 'plus' | 'log-in' | 'bot' | 'check' | 'check-circle'
  | 'log-out' | 'copy' | 'shuffle' | 'play' | 'users' | 'target'
  | 'cpu' | 'refresh' | 'user-plus' | 'key' | 'trophy' | 'shield' | 'arrow-right-left';

export function setButtonContent(btn: HTMLButtonElement, _icon: IconName, label: string): void {
  btn.replaceChildren();
  btn.classList.add('pixel-btn');
  btn.textContent = label;
}

export function createIconButton(icon: IconName, label: string, onClick?: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  setButtonContent(btn, icon, label);
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
