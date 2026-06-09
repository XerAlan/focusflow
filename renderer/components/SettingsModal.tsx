/**
 * 设置模态框
 * - 含多个 Tab：通用 / 预设软件 / 工作模式 / 关于
 * - 嵌套 WorkModeSettings 子组件
 */
import { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useUIStore } from '../store/uiStore';
import { useAudioStore } from '../store/audioStore';
import { selectExeFile, selectAudioFile, getAppVersion } from '../ipc';
import SortableList, { SortableItem, SortableKnob } from 'react-easy-sort';
import type { PresetApp, WorkModeAppItem, WorkModeUrlItem } from '../../shared/types';

type Tab = 'general' | 'presets' | 'workmode' | 'about';

const KnobHandle: React.FC = () => (
  <span className="handle" style={{ cursor: 'grab', userSelect: 'none', padding: '0 4px' }}>⋮⋮</span>
);

// ========== 通用 Tab ==========
const GeneralTab: React.FC = () => {
  const settings = useSettingsStore();
  const toast = useUIStore((s) => s.toast);
  const volume = useAudioStore((s) => s.volume);
  const setVolume = useAudioStore((s) => s.setVolume);

  return (
    <div>
      <div className="form-row">
        <label>专注时长（分钟）</label>
        <input
          type="number"
          min={1}
          max={120}
          value={settings.pomodoroDuration}
          onChange={(e) =>
            settings.update({ pomodoroDuration: Math.max(1, Number(e.target.value) || 25) })
          }
        />
      </div>
      <div className="form-row">
        <label>短休息时长（分钟）</label>
        <input
          type="number"
          min={1}
          max={60}
          value={settings.shortBreakDuration}
          onChange={(e) =>
            settings.update({ shortBreakDuration: Math.max(1, Number(e.target.value) || 5) })
          }
        />
      </div>
      <div className="form-row">
        <label>长休息时长（分钟）</label>
        <input
          type="number"
          min={1}
          max={120}
          value={settings.longBreakDuration}
          onChange={(e) =>
            settings.update({ longBreakDuration: Math.max(1, Number(e.target.value) || 15) })
          }
        />
      </div>
      <div className="form-row">
        <label>默认音量（0-100）</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              settings.update({ defaultVolume: Number(e.target.value) });
            }}
          />
          <span style={{ width: 36, textAlign: 'right' }}>{volume}</span>
        </div>
      </div>
      <div className="form-row">
        <label>开机自启</label>
        <div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={settings.autoStartup}
              onChange={(e) => {
                settings.setAutoStartupFlag(e.target.checked);
                toast(
                  e.target.checked ? '已开启开机自启' : '已关闭开机自启',
                  'success'
                );
              }}
            />
            <span style={{ fontSize: 13 }}>开机时自动启动 FocusFlow</span>
          </label>
        </div>
      </div>
      <div className="form-row">
        <label>主题（仅暗色，预留扩展）</label>
        <select
          value={settings.theme}
          onChange={(e) => settings.update({ theme: e.target.value as 'dark' | 'light' })}
          style={{
            background: '#34344A',
            border: '1px solid #3A3A52',
            color: '#E5E5F0',
            padding: '8px 10px',
            borderRadius: 6
          }}
        >
          <option value="dark">暗色</option>
          <option value="light">浅色（暂未实现）</option>
        </select>
      </div>
    </div>
  );
};

// ========== 预设软件 Tab ==========
const PresetsTab: React.FC = () => {
  const presetApps = useSettingsStore((s) => s.presetApps);
  const addPresetApp = useSettingsStore((s) => s.addPresetApp);
  const removePresetApp = useSettingsStore((s) => s.removePresetApp);
  const updatePresetApp = useSettingsStore((s) => s.updatePresetApp);
  const setPresetApps = useSettingsStore((s) => s.setPresetApps);
  const toast = useUIStore((s) => s.toast);

  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');

  const handleAdd = async () => {
    if (!newName.trim() || !newPath.trim()) {
      toast('请填写名称和路径', 'warning');
      return;
    }
    await addPresetApp({ name: newName.trim(), path: newPath.trim() });
    setNewName('');
    setNewPath('');
    toast('已添加预设软件', 'success');
  };

  const handlePickPath = async () => {
    const res = await selectExeFile();
    if (!res.canceled && res.filePath) {
      setNewPath(res.filePath);
    }
  };

  const onSortEnd = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;
    const ids = presetApps.map((a) => a.id);
    const [m] = ids.splice(oldIndex, 1);
    ids.splice(newIndex, 0, m);
    const map = new Map(presetApps.map((a) => [a.id, a]));
    setPresetApps(ids.map((id) => map.get(id)!).filter(Boolean));
  };

  return (
    <div>
      <div className="form-row">
        <label>添加预设软件</label>
        <div className="row-inline">
          <input
            type="text"
            placeholder="名称（如 VS Code）"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <div className="row-inline" style={{ marginTop: 6 }}>
          <input
            type="text"
            placeholder="程序路径（C:\...）"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
          />
          <button className="btn" onClick={handlePickPath}>
            选择
          </button>
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 8 }}
          onClick={handleAdd}
        >
          添加
        </button>
      </div>
      {presetApps.length === 0 ? (
        <div style={{ color: '#9A9AB0', fontSize: 12, marginTop: 8 }}>
          还没有预设软件
        </div>
      ) : (
        <div className="item-list">
          <SortableList
            onSortEnd={onSortEnd}
            draggedItemClassName="sortable-ghost"
            lockAxis="y"
          >
            {presetApps.map((a) => (
              <SortableItem key={a.id}>
                <div className="item-row">
                  <SortableKnob><KnobHandle /></SortableKnob>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="name">{a.name}</div>
                    <div className="sub" title={a.path}>{a.path}</div>
                  </div>
                  <button
                    className="btn"
                    onClick={async () => {
                      const res = await selectExeFile();
                      if (!res.canceled && res.filePath) {
                        updatePresetApp(a.id, { path: res.filePath });
                      }
                    }}
                  >
                    选择
                  </button>
                  <button className="btn danger" onClick={() => removePresetApp(a.id)}>
                    删除
                  </button>
                </div>
              </SortableItem>
            ))}
          </SortableList>
        </div>
      )}
    </div>
  );
};

// ========== 工作模式 Tab ==========
const WorkModeSettings: React.FC = () => {
  const settings = useSettingsStore();
  const workMode = settings.workMode;
  const presetApps = settings.presetApps;
  const toast = useUIStore((s) => s.toast);

  const [newType, setNewType] = useState<'preset' | 'custom'>('custom');
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');
  const [newPresetRef, setNewPresetRef] = useState<string>('');

  const [newUrlName, setNewUrlName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const addApp = () => {
    if (newType === 'preset') {
      if (!newPresetRef) {
        toast('请选择预设软件', 'warning');
        return;
      }
      const ref = presetApps.find((p) => p.id === newPresetRef);
      if (!ref) {
        toast('预设软件不存在', 'error');
        return;
      }
      settings.addWorkModeApp({
        type: 'preset',
        name: ref.name,
        path: ref.path,
        presetRefId: ref.id
      });
    } else {
      if (!newName.trim() || !newPath.trim()) {
        toast('请填写名称和路径', 'warning');
        return;
      }
      settings.addWorkModeApp({
        type: 'custom',
        name: newName.trim(),
        path: newPath.trim()
      });
    }
    setNewName('');
    setNewPath('');
    setNewPresetRef('');
    toast('已添加工作模式软件', 'success');
  };

  const addUrl = () => {
    if (!newUrlName.trim() || !newUrl.trim()) {
      toast('请填写名称和网址', 'warning');
      return;
    }
    if (!/^https?:\/\//i.test(newUrl.trim())) {
      toast('网址必须以 http:// 或 https:// 开头', 'warning');
      return;
    }
    settings.addWorkModeUrl({ name: newUrlName.trim(), url: newUrl.trim() });
    setNewUrlName('');
    setNewUrl('');
    toast('已添加工作模式网址', 'success');
  };

  const pickCustomPath = async () => {
    const res = await selectExeFile();
    if (!res.canceled && res.filePath) {
      setNewPath(res.filePath);
    }
  };

  const pickDefaultAudio = async () => {
    const res = await selectAudioFile();
    if (!res.canceled && res.filePaths.length > 0) {
      settings.setDefaultAudio(res.filePaths[0]);
      toast('已设置工作模式默认音频', 'success');
    }
  };

  const onAppSortEnd = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;
    const ids = workMode.appItems.map((i) => i.id);
    const [m] = ids.splice(oldIndex, 1);
    ids.splice(newIndex, 0, m);
    const map = new Map(workMode.appItems.map((i) => [i.id, i]));
    settings.updateWorkMode({
      appItems: ids.map((id) => map.get(id)!).filter(Boolean)
    });
  };

  const onUrlSortEnd = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;
    const ids = workMode.urlItems.map((i) => i.id);
    const [m] = ids.splice(oldIndex, 1);
    ids.splice(newIndex, 0, m);
    const map = new Map(workMode.urlItems.map((i) => [i.id, i]));
    settings.updateWorkMode({
      urlItems: ids.map((id) => map.get(id)!).filter(Boolean)
    });
  };

  return (
    <div>
      <div className="section-title">软件启动项</div>
      <div className="form-row">
        <label>添加启动项</label>
        <div className="row-inline">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'preset' | 'custom')}
            style={{
              background: '#34344A',
              border: '1px solid #3A3A52',
              color: '#E5E5F0',
              padding: '8px 10px',
              borderRadius: 6
            }}
          >
            <option value="custom">自定义路径</option>
            <option value="preset">从预设软件选择</option>
          </select>
        </div>
        {newType === 'custom' ? (
          <>
            <div className="row-inline" style={{ marginTop: 6 }}>
              <input
                type="text"
                placeholder="名称"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="row-inline" style={{ marginTop: 6 }}>
              <input
                type="text"
                placeholder="路径"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
              />
              <button className="btn" onClick={pickCustomPath}>
                选择
              </button>
            </div>
          </>
        ) : (
          <div className="row-inline" style={{ marginTop: 6 }}>
            <select
              value={newPresetRef}
              onChange={(e) => setNewPresetRef(e.target.value)}
              style={{
                flex: 1,
                background: '#34344A',
                border: '1px solid #3A3A52',
                color: '#E5E5F0',
                padding: '8px 10px',
                borderRadius: 6
              }}
            >
              <option value="">-- 选择预设软件 --</option>
              {presetApps.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.path})
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          className="btn btn-primary"
          style={{ marginTop: 8 }}
          onClick={addApp}
        >
          添加到工作模式
        </button>
      </div>
      {workMode.appItems.length === 0 ? (
        <div style={{ color: '#9A9AB0', fontSize: 12 }}>
          还没有配置工作模式软件
        </div>
      ) : (
        <div className="item-list">
          <SortableList
            onSortEnd={onAppSortEnd}
            draggedItemClassName="sortable-ghost"
            lockAxis="y"
          >
            {workMode.appItems.map((it) => {
              const isPreset = it.type === 'preset';
              const ref = isPreset ? presetApps.find((p) => p.id === it.presetRefId) : null;
              const invalid = isPreset && !ref;
              return (
                <SortableItem key={it.id}>
                  <div className="item-row">
                    <SortableKnob><KnobHandle /></SortableKnob>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="name">
                        {it.name}
                        <span
                          style={{
                            fontSize: 10,
                            color: invalid ? '#FF5252' : '#9A9AB0',
                            marginLeft: 6
                          }}
                        >
                          {isPreset ? `[预设${invalid ? ' - 已删除' : ''}]` : '[自定义]'}
                        </span>
                      </div>
                      <div className="sub" title={it.path}>
                        {isPreset && ref ? ref.path : it.path || '(空)'}
                      </div>
                    </div>
                    <button className="btn danger" onClick={() => settings.removeWorkModeApp(it.id)}>
                      删除
                    </button>
                  </div>
                </SortableItem>
              );
            })}
          </SortableList>
        </div>
      )}

      <div className="section-title">网址启动项</div>
      <div className="form-row">
        <label>添加网址</label>
        <div className="row-inline">
          <input
            type="text"
            placeholder="名称（如 GitHub）"
            value={newUrlName}
            onChange={(e) => setNewUrlName(e.target.value)}
          />
        </div>
        <div className="row-inline" style={{ marginTop: 6 }}>
          <input
            type="url"
            placeholder="https://..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 8 }}
          onClick={addUrl}
        >
          添加到工作模式
        </button>
      </div>
      {workMode.urlItems.length === 0 ? (
        <div style={{ color: '#9A9AB0', fontSize: 12 }}>
          还没有配置工作模式网址
        </div>
      ) : (
        <div className="item-list">
          <SortableList
            onSortEnd={onUrlSortEnd}
            draggedItemClassName="sortable-ghost"
            lockAxis="y"
          >
            {workMode.urlItems.map((it) => (
              <SortableItem key={it.id}>
                <div className="item-row">
                  <SortableKnob><KnobHandle /></SortableKnob>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="name">{it.name}</div>
                    <div className="sub" title={it.url}>{it.url}</div>
                  </div>
                  <button className="btn danger" onClick={() => settings.removeWorkModeUrl(it.id)}>
                    删除
                  </button>
                </div>
              </SortableItem>
            ))}
          </SortableList>
        </div>
      )}

      <div className="section-title">可选：工作模式默认音频</div>
      <div className="form-row">
        <div className="row-inline">
          <input
            type="text"
            placeholder="未选择"
            value={workMode.defaultAudioPath || ''}
            readOnly
          />
          <button className="btn" onClick={pickDefaultAudio}>
            选择
          </button>
          {workMode.defaultAudioPath && (
            <button
              className="btn"
              onClick={() => settings.setDefaultAudio(null)}
            >
              清除
            </button>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#9A9AB0', marginTop: 4 }}>
          工作模式启动时，若设置了默认音频，将停止当前音频并播放新音频；否则保持当前音频不变。
        </div>
      </div>
    </div>
  );
};

// ========== 关于 Tab ==========
const AboutTab: React.FC = () => {
  const [version, setVersion] = useState('');
  useEffect(() => {
    getAppVersion().then(setVersion).catch(() => setVersion('1.0.0'));
  }, []);
  return (
    <div>
      <div className="form-row">
        <label>FocusFlow 版本</label>
        <div style={{ fontSize: 14 }}>{version || '加载中...'}</div>
      </div>
      <div className="form-row">
        <label>关于</label>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: '#C0C0D0' }}>
          FocusFlow 是一款帮助用户进入工作模式的 Windows 桌面专注应用，
          集成了番茄钟、待办、专注统计、本地音乐、预设软件启动和工作模式一键启动等功能。
        </div>
      </div>
      <div className="form-row">
        <label>快捷键</label>
        <ul style={{ fontSize: 12, lineHeight: 1.8, color: '#9A9AB0' }}>
          <li>F11：切换全屏</li>
          <li>Esc：退出全屏（系统默认）</li>
          <li>Enter：保存任务 / 设置项</li>
        </ul>
      </div>
    </div>
  );
};

// ========== 主 Modal ==========
export const SettingsModal: React.FC = () => {
  const open = useUIStore((s) => s.settingsOpen);
  const close = useUIStore((s) => s.closeSettings);
  const [tab, setTab] = useState<Tab>('general');

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">设置</h2>
          <button className="icon-btn" onClick={close}>
            ✕
          </button>
        </div>
        <div className="modal-tabs">
          {(
            [
              ['general', '通用'],
              ['presets', '预设软件'],
              ['workmode', '工作模式'],
              ['about', '关于']
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              className={`modal-tab ${tab === k ? 'active' : ''}`}
              onClick={() => setTab(k)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="modal-body">
          {tab === 'general' && <GeneralTab />}
          {tab === 'presets' && <PresetsTab />}
          {tab === 'workmode' && <WorkModeSettings />}
          {tab === 'about' && <AboutTab />}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={close}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
