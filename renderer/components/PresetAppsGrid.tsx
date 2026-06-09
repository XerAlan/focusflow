/**
 * 预设软件网格
 * - 显示所有 PresetApp
 * - 单击启动对应程序
 */
import { useSettingsStore } from '../store/settingsStore';
import { useUIStore } from '../store/uiStore';
import { launchApp } from '../ipc';
import { useMemo } from 'react';

/** 根据应用路径返回首字符 emoji 图标（替代真实图标获取） */
const iconForName = (name: string): string => {
  if (!name) return '🚀';
  // 简单映射一些常见应用
  const lower = name.toLowerCase();
  if (lower.includes('code') || lower.includes('vscode')) return '💻';
  if (lower.includes('chrome') || lower.includes('edge')) return '🌐';
  if (lower.includes('wechat') || lower.includes('微信')) return '💬';
  if (lower.includes('qq')) return '🐧';
  if (lower.includes('note') || lower.includes('obsidian') || lower.includes('notion')) return '📝';
  if (lower.includes('word') || lower.includes('wps') || lower.includes('doc')) return '📄';
  if (lower.includes('excel') || lower.includes('sheet')) return '📊';
  if (lower.includes('ppt') || lower.includes('powerpoint')) return '📽️';
  if (lower.includes('mail') || lower.includes('outlook')) return '📧';
  if (lower.includes('git') || lower.includes('tower')) return '🔧';
  if (lower.includes('music') || lower.includes('spotify')) return '🎵';
  if (lower.includes('photo') || lower.includes('ps')) return '🖼️';
  if (lower.includes('terminal') || lower.includes('cmd') || lower.includes('powershell')) return '⌨️';
  // 默认：取首字符
  return name.charAt(0).toUpperCase();
};

export const PresetAppsGrid: React.FC = () => {
  const presetApps = useSettingsStore((s) => s.presetApps);
  const toast = useUIStore((s) => s.toast);

  const tiles = useMemo(() => presetApps, [presetApps]);

  const handleClick = async (id: string) => {
    const app = presetApps.find((a) => a.id === id);
    if (!app) return;
    const res = await launchApp(app.path);
    if (!res.success) {
      toast(`启动失败，请检查路径: ${app.name} (${res.error || ''})`, 'error');
    } else {
      toast(`已启动: ${app.name}`, 'success');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <h2 className="panel-title">快捷软件</h2>
      {tiles.length === 0 ? (
        <div
          style={{
            color: '#9A9AB0',
            fontSize: 12,
            padding: 16,
            textAlign: 'center',
            border: '1px dashed #3A3A52',
            borderRadius: 8
          }}
        >
          还没有预设软件
          <br />
          请到设置中添加
        </div>
      ) : (
        <div className="preset-grid">
          {tiles.map((app) => (
            <button
              key={app.id}
              className="preset-tile"
              onClick={() => handleClick(app.id)}
              title={app.path}
            >
              <span className="preset-icon">{iconForName(app.name)}</span>
              <span className="preset-name">{app.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
