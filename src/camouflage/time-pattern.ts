/**
 * 时间分布模拟 — 模拟真人的工作时间节奏
 */

import { DEFAULT_CONFIG } from '../config/default.js';

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 判断当前时间是否在工作时间内
 */
export function isWorkingHour(hour?: number): boolean {
    const h = hour ?? new Date().getHours();
    const { workingHoursStart, workingHoursEnd } = DEFAULT_CONFIG.camouflage;
    return h >= workingHoursStart && h < workingHoursEnd;
}

/**
 * 生成符合真人工作节奏的延迟时间
 * - 工作时间（9-18）：30s~3min，高频
 * - 午休（12-13）：3~10min，低频
 * - 加班时间（18-22）：2~5min，中频
 * - 非工作时间：不建议执行
 */
export function getHumanLikeDelay(hour?: number): number {
    const h = hour ?? new Date().getHours();

    // 午休时间：长间隔
    if (h >= 12 && h < 13) {
        return randomInt(180_000, 600_000);
    }

    // 正常工作时间：短间隔
    if (h >= 9 && h < 12 || h >= 13 && h < 18) {
        return randomInt(30_000, 180_000);
    }

    // 加班时间：中等间隔
    if (h >= 18 && h < 22) {
        return randomInt(120_000, 300_000);
    }

    // 深夜/清晨：超长间隔（模拟偶尔加班）
    return randomInt(300_000, 900_000);
}

/**
 * 在延迟基础上加入随机抖动，避免机械化
 * @param baseDelay 基础延迟（ms）
 * @param jitterRatio 抖动比例（0~1），默认 0.3
 */
export function addJitter(baseDelay: number, jitterRatio = 0.3): number {
    const jitter = baseDelay * jitterRatio;
    return Math.max(1000, baseDelay + randomInt(-jitter, jitter));
}

/**
 * 获取当前时间段描述
 */
export function getTimePeriodLabel(hour?: number): string {
    const h = hour ?? new Date().getHours();
    if (h >= 9 && h < 12) return '上午工作时间';
    if (h >= 12 && h < 13) return '午休时间';
    if (h >= 13 && h < 18) return '下午工作时间';
    if (h >= 18 && h < 22) return '加班时间';
    return '非工作时间';
}
