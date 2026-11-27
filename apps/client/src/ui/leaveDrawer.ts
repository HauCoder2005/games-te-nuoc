import { createIconButton } from './icons';

export function createCollapsibleLeaveDrawer(onLeave: () => void): HTMLElement {
  const drawer = document.createElement('div');
  drawer.className = 'leave-drawer';

  let expanded = false;
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'leave-drawer-toggle';
  toggleBtn.title = 'Mở / Thu gọn nút Rời phòng';
  toggleBtn.setAttribute('aria-label', 'Thu gọn Rời phòng');
  toggleBtn.textContent = '❯';

  const leaveBtn = createIconButton('log-out', 'Rời phòng', onLeave);
  leaveBtn.classList.add('leave', 'leave-drawer-btn');
  leaveBtn.hidden = true;

  toggleBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    expanded = !expanded;
    drawer.classList.toggle('expanded', expanded);
    leaveBtn.hidden = !expanded;
    toggleBtn.textContent = expanded ? '❮' : '❯';
  });

  drawer.append(toggleBtn, leaveBtn);
  return drawer;
}
