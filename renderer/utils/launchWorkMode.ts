/**
 * 工作模式启动帮助函数
 * - 合并软件启动项（preset 引用解析 + 过滤已删除的 preset）
 * - 汇总启动结果
 */
import type {
  PresetApp,
  WorkModeAppItem,
  WorkModeUrlItem,
  WorkModeConfig
} from '../../shared/types';
import { launchAppsBatch, openUrlsBatch } from '../ipc';
import { showNotification } from '../ipc';

export interface ResolvedAppItem {
  name: string;
  path: string;
  source: 'preset' | 'custom';
  valid: boolean;
}

export interface LaunchWorkModeResult {
  appResults: { name: string; path: string; success: boolean; error?: string }[];
  urlResults: { name: string; url: string; success: boolean; error?: string }[];
  invalidApps: { name: string; reason: string }[];
  failedApps: string[];
  failedUrls: string[];
}

/**
 * 解析工作模式启动项
 * - 若 type==='preset'，到 presetApps 中查找；找不到视为无效
 */
export const resolveWorkModeApps = (
  items: WorkModeAppItem[],
  presetApps: PresetApp[]
): { resolved: ResolvedAppItem[]; invalid: { name: string; reason: string }[] } => {
  const resolved: ResolvedAppItem[] = [];
  const invalid: { name: string; reason: string }[] = [];
  for (const it of items) {
    if (it.type === 'preset') {
      const ref = presetApps.find((p) => p.id === it.presetRefId);
      if (ref) {
        resolved.push({
          name: ref.name,
          path: ref.path,
          source: 'preset',
          valid: true
        });
      } else {
        invalid.push({
          name: it.name,
          reason: '关联的预设软件已删除'
        });
      }
    } else {
      resolved.push({
        name: it.name,
        path: it.path,
        source: 'custom',
        valid: !!it.path
      });
      if (!it.path) {
        invalid.push({ name: it.name, reason: '路径为空' });
      }
    }
  }
  return { resolved, invalid };
};

/**
 * 执行工作模式启动
 * - 软件/网址启动可并行（Promise.all）
 * - 不抛出错误，返回结构化结果
 */
export const launchWorkMode = async (
  config: WorkModeConfig,
  presetApps: PresetApp[]
): Promise<LaunchWorkModeResult> => {
  const { resolved, invalid } = resolveWorkModeApps(config.appItems, presetApps);
  const validApps = resolved.filter((r) => r.valid);

  // 启动应用（并行）
  const appPromise =
    validApps.length > 0
      ? launchAppsBatch(validApps.map((r) => ({ name: r.name, path: r.path })))
      : Promise.resolve([] as ReturnType<typeof launchAppsBatch> extends Promise<infer R> ? R : never);

  // 打开 URL（并行）
  const urlItems = config.urlItems
    .filter((u) => u.url && /^https?:\/\//i.test(u.url))
    .map((u) => ({ name: u.name, url: u.url }));
  const urlPromise =
    urlItems.length > 0 ? openUrlsBatch(urlItems) : Promise.resolve([] as Awaited<ReturnType<typeof openUrlsBatch>>);

  const [appResults, urlResults] = await Promise.all([appPromise, urlPromise]);

  const failedApps = appResults.filter((r) => !r.success).map((r) => r.name);
  const failedUrls = urlResults.filter((r) => !r.success).map((r) => r.name);

  if (failedApps.length > 0 || failedUrls.length > 0 || invalid.length > 0) {
    const summary: string[] = [];
    if (failedApps.length) summary.push(`启动失败应用: ${failedApps.join(', ')}`);
    if (failedUrls.length) summary.push(`打开失败网址: ${failedUrls.join(', ')}`);
    if (invalid.length) summary.push(`已忽略失效项: ${invalid.map((i) => i.name).join(', ')}`);
    if (summary.length) {
      showNotification('工作模式启动结果', summary.join('\n'));
    }
  } else {
    showNotification('FocusFlow', '工作模式已就绪');
  }

  return {
    appResults,
    urlResults,
    invalidApps: invalid,
    failedApps,
    failedUrls
  };
};
