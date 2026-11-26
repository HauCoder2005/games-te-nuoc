import './style.css';
import { showHome } from './ui/home';

const root = document.getElementById('app');
if (!root) throw new Error('Thiếu vùng giao diện');
showHome(root);
