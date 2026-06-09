/**
 * 音频播放器组件（左侧栏迷你控制）
 * - 播放列表：显示当前曲目
 * - 播放/暂停/上一首/下一首
 * - 音量滑条
 * - 循环模式切换
 */
import { useAudioStore } from '../store/audioStore';
import { useUIStore } from '../store/uiStore';

const basename = (p: string): string => {
  if (!p) return '';
  return p.split(/[\\/]/).pop() || p;
};

export const AudioPlayer: React.FC = () => {
  const playlist = useAudioStore((s) => s.playlist);
  const currentIndex = useAudioStore((s) => s.currentIndex);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const volume = useAudioStore((s) => s.volume);
  const loop = useAudioStore((s) => s.loop);
  const play = useAudioStore((s) => s.play);
  const pause = useAudioStore((s) => s.pause);
  const next = useAudioStore((s) => s.next);
  const prev = useAudioStore((s) => s.prev);
  const setVolume = useAudioStore((s) => s.setVolume);
  const setLoop = useAudioStore((s) => s.setLoop);
  const pickFiles = useAudioStore((s) => s.pickFiles);
  const removeAt = useAudioStore((s) => s.removeAt);
  const toast = useUIStore((s) => s.toast);

  const current = currentIndex >= 0 ? playlist[currentIndex] : '';

  const loopLabel = loop === 'none' ? '不循环' : loop === 'one' ? '单曲' : '全部';

  return (
    <div className="audio-player">
      <h2 className="panel-title" style={{ margin: 0 }}>音频播放</h2>
      <div className="audio-track" title={current || '未选择音频'}>
        {current ? `♪ ${basename(current)}` : '未选择音频'}
      </div>
      <div className="audio-controls">
        <button className="btn" onClick={pickFiles} title="选择本地音频">
          打开文件
        </button>
        {isPlaying ? (
          <button className="btn btn-primary" onClick={pause}>暂停</button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={play}
            disabled={playlist.length === 0}
          >
            播放
          </button>
        )}
        <button className="btn" onClick={prev} disabled={playlist.length === 0}>⏮</button>
        <button className="btn" onClick={next} disabled={playlist.length === 0}>⏭</button>
        <button
          className="btn"
          onClick={() => {
            const next = loop === 'none' ? 'one' : loop === 'one' ? 'all' : 'none';
            setLoop(next);
            toast(`循环模式: ${next === 'none' ? '不循环' : next === 'one' ? '单曲' : '全部'}`, 'info');
          }}
          title="循环模式"
        >
          🔁 {loopLabel}
        </button>
      </div>
      <div className="vol">
        <span style={{ fontSize: 12, color: '#9A9AB0' }}>音量</span>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
        <span style={{ fontSize: 12, width: 28, textAlign: 'right' }}>{volume}</span>
      </div>
      {playlist.length > 0 && (
        <details style={{ fontSize: 12, color: '#9A9AB0', marginTop: 4 }}>
          <summary style={{ cursor: 'pointer' }}>播放列表 ({playlist.length})</summary>
          <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0' }}>
            {playlist.map((p, i) => (
              <li
                key={p + i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 0'
                }}
              >
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: i === currentIndex ? '#7C4DFF' : '#9A9AB0',
                    cursor: 'pointer'
                  }}
                  onClick={() => useAudioStore.getState().playByPath(p)}
                  title={p}
                >
                  {i === currentIndex ? '▶ ' : '  '}{basename(p)}
                </span>
                <button
                  className="btn"
                  style={{ padding: '0 6px', fontSize: 11 }}
                  onClick={() => removeAt(i)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};
