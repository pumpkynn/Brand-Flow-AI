/**
 * 安全解析JSON（防止崩溃，通用工具）
 */
export function safeJsonParse<T = unknown>(
  text: string,
  defaultValue: T | null = null
): T | null {
  try {
    let cleaned = text.trim();
    // 去除 markdown 代码块包裹
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');  // 开头 ```
    cleaned = cleaned.replace(/\n?\s*```$/i, '');             // 结尾 ```
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch {
    return defaultValue;
  }
}

/**
 * 格式化字符串，去除空行/空格
 */
export function trimText(text: string): string {
  return text.trim().replace(/\n\s*\n/g, "\n");
}

/**
 * 判断是否为空值
 */
export function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

/**
 * 生成随机会话ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}