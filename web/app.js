/**
 * Token Burner Dashboard — 前端逻辑
 * 负责 API 调用、SSE 进度订阅、界面交互
 */

const API = 'http://localhost:3000/api';

// ===================== 状态 =====================
let currentTaskId = null;
let currentSse = null;
// ===================== 加载模型列表（Combo Input） =====================
// ===================== 模型列表（全局状态）=====================
let models = []; // [{id: "openai/gpt-4o", name, provider, pricing}]

// ===================== 加载模型列表 =====================
async function loadModels() {
    try {
        const res = await fetch(`${API}/models`);
        models = await res.json();
        initModelCombo();
    } catch (e) {
        console.error('加载模型失败', e);
    }
}

function updateModelHint() {
    const input = document.getElementById('modelComboInput');
    const hint = document.getElementById('modelPriceHint');
    if (!input || !hint) return;
    const val = input.value;
    const model = models.find(m => m.id === val);
    if (model && model.pricing) {
        hint.textContent = `输入: $${model.pricing.input}/1M tokens · 输出: $${model.pricing.output}/1M tokens`;
    } else if (val && val.includes('/')) {
        hint.textContent = `自定义模型: ${val}`;
    } else {
        hint.textContent = '';
    }
}

function initModelCombo() {
    const input = document.getElementById('modelComboInput');
    const btn = document.getElementById('modelComboBtn');
    const dropdown = document.getElementById('modelComboDropdown');
    if (!input || !btn || !dropdown) return;

    function renderDropdown(filter) {
        const q = (filter || '').toLowerCase();
        const filtered = q
            ? models.filter(m => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
            : models;

        if (filtered.length === 0) {
            dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.82rem">无匹配模型，将直接使用输入的 provider/model</div>';
            return;
        }

        const groups = {};
        for (const m of filtered) {
            if (!groups[m.provider]) groups[m.provider] = [];
            groups[m.provider].push(m);
        }

        const providerIcons = { openai: '🤖', anthropic: '🔮', google: '🌏', zai: '🧠', deepseek: '🐋', moonshot: '🌙', minimax: '🇨🇳' };

        dropdown.innerHTML = Object.entries(groups).map(([p, ms]) => {
            const icon = providerIcons[p] || '🧩';
            const items = ms.map(m => {
                const isActive = input.value === m.id;
                const price = m.pricing ? `$${m.pricing.input}/$${m.pricing.output} /1M` : '';
                return `<div class="combo-model-item ${isActive ? 'active' : ''}" data-id="${m.id}">
                    <span class="combo-model-id">${m.id}</span>
                    <span class="combo-model-price">${price}</span>
                </div>`;
            }).join('');
            return `<div class="combo-group-label">${icon} ${p}</div>${items}`;
        }).join('');

        dropdown.querySelectorAll('.combo-model-item').forEach(el => {
            el.addEventListener('click', () => {
                input.value = el.dataset.id;
                closeDropdown();
                updateModelHint();
                updateEstimate();
            });
        });
    }

    function openDropdown() {
        dropdown.style.display = 'block';
        renderDropdown(input.value);
        btn.textContent = '▲';
    }

    function closeDropdown() {
        dropdown.style.display = 'none';
        btn.textContent = '▼';
    }

    btn.addEventListener('click', (e) => { e.stopPropagation(); if (dropdown.style.display === 'none') openDropdown(); else closeDropdown(); });
    input.addEventListener('focus', openDropdown);
    input.addEventListener('input', () => {
        if (dropdown.style.display !== 'none') renderDropdown(input.value);
        updateModelHint();
        updateEstimate();
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest?.('#modelCombo') && !e.target.closest?.('#modelComboDropdown')) closeDropdown();
    });

    if (models.length > 0 && !input.value) {
        input.value = models[0].id;
        updateModelHint();
        updateEstimate();
    }
}

// initCustomModelToggle — 已整合入 combo input，保留空函数兼容旧调用
function initCustomModelToggle() { }

// ===================== 费用预估 =====================
async function updateEstimate() {
    updateModelHint();
    const target = parseInt(document.getElementById('tokenTarget').value, 10);
    const model = getSelectedModel();
    const strategy = document.querySelector('input[name="strategy"]:checked')?.value || 'turbo';

    if (!target || !model) return;

    try {
        const res = await fetch(`${API}/task/estimate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetTokens: target, model, strategy }),
        });
        const est = await res.json();
        document.getElementById('estCost').textContent = est.estimatedCostFormatted || '—';
        // 时间只显示纯 API 调用时间
        document.getElementById('estTime').textContent = est.estimatedTimeFormatted
            ? `${est.estimatedTimeFormatted} (纯API)`
            : '—';
        document.getElementById('estCalls').textContent = est.estimatedCalls != null ? `${est.estimatedCalls} 次` : '—';

        // 自然模式：显示伪装延迟提示
        const delayHint = document.getElementById('delayHint');
        if (delayHint) {
            if (est.camouflageDelayMs > 0) {
                delayHint.textContent = '⚠️ 自然模式含 30s~5min/次伪装延迟，实际运行时间远大于以上预估';
                delayHint.style.display = '';
            } else {
                delayHint.style.display = 'none';
            }
        }
    } catch {
        document.getElementById('estCost').textContent = '—';
    }
}

function setupEstimateListeners() {
    // combo input 已在 initModelCombo 中设置了 input 监听，这里只需监听其他触发源
    const comboInput = document.getElementById('modelComboInput');
    if (comboInput) comboInput.addEventListener('change', updateEstimate);
}

// ===================== API 状态检查 =====================
async function checkApiStatus() {
    const dot = document.getElementById('apiStatus');
    const label = document.getElementById('apiStatusLabel');
    try {
        const res = await fetch(`${API}/config`);
        const conf = await res.json();
        // 新格式：conf.providers 和 conf.customProviders
        const hasBuiltin = conf.providers && Object.values(conf.providers).some(p => p.configured);
        const hasCustom = (conf.customProviders || []).some(cp => cp.apiKey);
        if (hasBuiltin || hasCustom) {
            dot.className = 'status-dot ok';
            label.textContent = `已就绪 (${conf.activeProvider || 'openai'})`;
        } else {
            dot.className = 'status-dot err';
            label.textContent = '未配置 API Key';
        }
    } catch {
        dot.className = 'status-dot err';
        label.textContent = '服务器未响应';
    }
}

// ===================== 加载配置 =====================
async function loadConfig() {
    try {
        const res = await fetch(`${API}/config`);
        const conf = await res.json();
        // 全局设置
        const costLimit = document.getElementById('cfgCostLimit');
        if (costLimit) costLimit.value = conf.costLimitUsd || 10;
        // 渲染 Built-in Provider 卡片
        await renderProviderGrid(conf);
        // 渲染 Custom Provider 列表
        renderCustomProviders(conf.customProviders || [], conf.activeProvider);
        // 更新 API 状态
        const dot = document.getElementById('apiStatus');
        const label = document.getElementById('apiStatusLabel');
        const hasBuiltinKey = conf.providers && Object.values(conf.providers).some(p => p.configured);
        const hasCustom = (conf.customProviders || []).some(cp => cp.apiKey);
        if (dot && label) {
            if (hasBuiltinKey || hasCustom) {
                dot.className = 'status-dot ok';
                label.textContent = `已就绪 (${conf.activeProvider || 'openai'})`;
            } else {
                dot.className = 'status-dot err';
                label.textContent = '未配置 API Key';
            }
        }
    } catch (e) {
        console.error('加载配置失败', e);
    }
}

// ===================== 加载历史 =====================
async function loadHistory() {
    try {
        const res = await fetch(`${API}/tasks`);
        const tasks = await res.json();
        renderHistory(tasks);
        updateSidebarStats(tasks);
    } catch (e) {
        console.error('加载历史失败', e);
    }
}

function renderHistory(tasks) {
    const list = document.getElementById('historyList');
    if (!tasks || tasks.length === 0) {
        list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">暂无任务记录，启动一个任务吧</div>
      </div>`;
        return;
    }

    list.innerHTML = tasks.map(t => {
        const pct = Math.min(100, ((t.consumedTokens / t.targetTokens) * 100)).toFixed(1);
        const date = new Date(t.startedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const icons = { turbo: '🔥', natural: '📚' };
        const icon = icons[t.strategy] || '📋';
        const statusClass = `status-${t.status}`;
        return `
      <div class="history-item" onclick="openLogDrawer('${t.id}', '${icon} #${t.id} ${t.model}')">
        <div class="history-status ${statusClass}"></div>
        <div class="history-info">
          <div class="history-title">${icon} ${t.strategy} · ${t.model}${t.dryRun ? ' · <em>dry-run</em>' : ''}</div>
          <div class="history-meta">${date} · #${t.id} · ${t.totalCalls} 次调用</div>
        </div>
        <div class="history-tokens">${fmtTokens(t.consumedTokens)} / ${fmtTokens(t.targetTokens)}<br><small style="color:#4a5568">${pct}%</small></div>
        <div class="history-cost">${fmtCost(t.totalCostUsd)}</div>
        <button class="btn-detail" onclick="event.stopPropagation();openLogDrawer('${t.id}', '${icon} #${t.id} ${t.strategy} · ${t.model}')">💬 详情</button>
      </div>`;
    }).join('');
}

function updateSidebarStats(tasks) {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(t => new Date(t.startedAt).toDateString() === today);
    const todayTokens = todayTasks.reduce((s, t) => s + t.consumedTokens, 0);
    const totalCost = tasks.reduce((s, t) => s + t.totalCostUsd, 0);

    document.getElementById('statTodayTokens').textContent = fmtTokens(todayTokens);
    document.getElementById('statTotalCost').textContent = fmtCost(totalCost);
}

// ===================== 按钮事件 =====================
function setupButtons() {
    document.getElementById('startBtn').addEventListener('click', startTask);
    document.getElementById('abortBtn').addEventListener('click', abortTask);
    document.getElementById('refreshHistory').addEventListener('click', loadHistory);
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
    document.getElementById('closeDrawer').addEventListener('click', () => {
        document.getElementById('logDrawer').style.display = 'none';
    });
    // Custom Provider 咋动
    setupCustomProvider();
}

// ===================== 启动任务 =====================
async function startTask() {
    const target = parseInt(document.getElementById('tokenTarget').value, 10);
    const model = getSelectedModel();
    const strategy = document.querySelector('input[name="strategy"]:checked')?.value || 'turbo';
    const dryRun = document.getElementById('dryRunToggle').checked;

    if (!target || !model) {
        alert('请选择模型并设置目标 Token 数量');
        return;
    }

    const btn = document.getElementById('startBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span><span>启动中...</span>';

    try {
        const res = await fetch(`${API}/task/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetTokens: target, model, strategy, dryRun }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '启动失败');

        currentTaskId = data.taskId;
        runningStartTime = Date.now();
        showRunningPanel(target);
        subscribeToProgress(currentTaskId, target);
    } catch (e) {
        alert(`启动失败: ${e.message}`);
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">🔥</span><span>开始消耗</span>';
    }
}

function showRunningPanel(target) {
    document.getElementById('taskForm').style.display = 'none';
    document.getElementById('runningTask').style.display = '';
    updateRing(0, target);

    // 启动 elapsed 计时器
    elapsedTimer = setInterval(() => {
        const secs = Math.floor((Date.now() - runningStartTime) / 1000);
        document.getElementById('metricElapsed').textContent = fmtElapsed(secs * 1000);
    }, 1000);
}

// ===================== SSE 进度订阅 =====================
function subscribeToProgress(taskId, target) {
    if (currentSse) currentSse.close();
    currentSse = new EventSource(`${API}/task/stream/${taskId}`);

    currentSse.addEventListener('progress', e => {
        const d = JSON.parse(e.data);
        updateRing(d.consumedTokens, d.targetTokens ?? target);
        document.getElementById('metricConsumed').textContent = fmtTokens(d.consumedTokens);
        document.getElementById('metricCost').textContent = fmtCost(d.totalCostUsd);
        document.getElementById('metricCalls').textContent = d.totalCalls;
        document.getElementById('metricElapsed').textContent = fmtElapsed(d.elapsedMs);
    });

    currentSse.addEventListener('done', e => {
        const d = JSON.parse(e.data);
        onTaskDone(d);
    });

    currentSse.addEventListener('error', e => {
        try {
            const d = JSON.parse(e.data);
            alert(`任务出错: ${d.message}`);
        } catch { }
        resetToForm();
    });
}

function onTaskDone(result) {
    clearInterval(elapsedTimer);
    currentSse?.close();
    updateRing(result.totalTokens, result.totalTokens);
    document.getElementById('metricConsumed').textContent = fmtTokens(result.totalTokens);
    document.getElementById('metricCost').textContent = fmtCost(result.totalCostUsd);

    setTimeout(() => {
        alert(`✅ 任务完成！\n消耗 Token: ${fmtTokens(result.totalTokens)}\n总费用: ${fmtCost(result.totalCostUsd)}`);
        resetToForm();
        loadHistory();
        switchTab('history');
    }, 800);
}

function updateRing(consumed, target) {
    const pct = Math.min(100, (consumed / target) * 100);
    const circumference = 2 * Math.PI * 76; // r=76
    const offset = circumference * (1 - pct / 100);
    const ring = document.getElementById('ringFg');
    if (ring) ring.style.strokeDashoffset = offset;
    document.getElementById('ringPct').textContent = `${pct.toFixed(1)}%`;
}

// ===================== 中止任务 =====================
async function abortTask() {
    if (!currentTaskId) return;
    if (!confirm('确认中止当前任务？')) return;
    try {
        await fetch(`${API}/task/${currentTaskId}`, { method: 'DELETE' });
    } catch { }
    clearInterval(elapsedTimer);
    currentSse?.close();
    resetToForm();
    loadHistory();
}

function resetToForm() {
    clearInterval(elapsedTimer);
    const btn = document.getElementById('startBtn');
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">🔥</span><span>开始消耗</span>';
    document.getElementById('taskForm').style.display = '';
    document.getElementById('runningTask').style.display = 'none';
    currentTaskId = null;
    currentSse = null;
}

// ===================== 保存配置 =====================
async function saveConfig() {
    const apiKey = document.getElementById('cfgApiKey').value;
    const baseUrl = document.getElementById('cfgBaseUrl').value;
    const costLimitUsd = parseFloat(document.getElementById('cfgCostLimit').value);

    try {
        const res = await fetch(`${API}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, baseUrl, costLimitUsd }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const successEl = document.getElementById('configSuccess');
        successEl.style.display = '';
        setTimeout(() => successEl.style.display = 'none', 3000);
        checkApiStatus();
    } catch (e) {
        alert(`保存失败: ${e.message}`);
    }
}

// ===================== 工具函数 =====================
function fmtTokens(n) {
    if (!n && n !== 0) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function fmtCost(usd) {
    if (!usd && usd !== 0) return '—';
    if (usd < 0.01) return `$${usd.toFixed(6)}`;
    if (usd < 1) return `$${usd.toFixed(4)}`;
    return `$${usd.toFixed(2)}`;
}

function fmtElapsed(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${s % 60}s`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tab}`));
}

// ===================== 历史调用详情 =====================
async function openLogDrawer(taskId, title) {
    const drawer = document.getElementById('logDrawer');
    const logList = document.getElementById('logList');
    const drawerTitle = document.getElementById('logDrawerTitle');

    drawerTitle.textContent = `💬 调用记录 — ${title}`;
    logList.innerHTML = '<div class="log-empty">加载中...</div>';
    drawer.style.display = '';

    // 滚动到详情区域
    drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try {
        const res = await fetch(`${API}/task/logs/${taskId}`);
        const logs = await res.json();
        renderLogs(logs);
    } catch (e) {
        logList.innerHTML = `<div class="log-empty">加载失败: ${e.message}</div>`;
    }
}

function renderLogs(logs) {
    const logList = document.getElementById('logList');

    if (!logs || logs.length === 0) {
        logList.innerHTML = `
          <div class="log-empty">
            📭 暂无调用记录<br>
            <small style="color:#4a5568;margin-top:6px;display:block">仅真实 API 调用（非 dry-run）会记录对话内容</small>
          </div>`;
        return;
    }

    logList.innerHTML = logs.map((log, idx) => {
        const userContent = log.promptPreview || '（无 Prompt 记录）';
        const aiContent = log.responsePreview || '（无响应记录）';
        const durationSec = (log.durationMs / 1000).toFixed(2);
        return `
        <div class="log-item">
          <div class="log-item-header">
            <span class="log-call-num">#${idx + 1}</span>
            <span class="log-tokens">⬆️ ${log.inputTokens} | ⬇️ ${log.outputTokens} tokens</span>
            <span class="log-cost">${fmtCost(log.costUsd)}</span>
            <span class="log-duration">⏱ ${durationSec}s</span>
            ${log.createdAt ? `<span>${new Date(log.createdAt).toLocaleTimeString('zh-CN')}</span>` : ''}
          </div>
          <div class="chat-bubble">
            <div class="bubble-user">
              <div class="bubble-avatar">👤</div>
              <div class="bubble-content">${escHtml(userContent)}</div>
            </div>
          </div>
          <div class="chat-bubble">
            <div class="bubble-ai">
              <div class="bubble-avatar">🤖</div>
              <div class="bubble-content">${escHtml(aiContent)}</div>
            </div>
          </div>
        </div>`;
    }).join('');
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ===================== PROVIDER 卡片网格 =====================

/** 从后端拉取所有 Provider 元数据 */
async function fetchProviderMeta() {
    try {
        const res = await fetch(`${API}/oauth/providers`);
        return await res.json();
    } catch {
        return null;
    }
}

/** 渲染 Provider 卡片网格 */
async function renderProviderGrid(conf) {
    const grid = document.getElementById('providerGrid');
    if (!grid) return;

    const meta = await fetchProviderMeta();
    if (!meta) { grid.innerHTML = '<div style="color:var(--text-muted);padding:16px">加载 Provider 信息失败</div>'; return; }

    const activeProvider = conf.activeProvider || 'openai';
    const activeLabel = document.getElementById('activeProviderLabel');
    const activeInfo = meta[activeProvider];
    if (activeLabel && activeInfo) activeLabel.textContent = `${activeInfo.icon} ${activeInfo.label}`;

    grid.innerHTML = Object.entries(meta).map(([pId, p]) => {
        const pConf = conf.providers?.[pId] || { configured: false };
        const isConnected = pConf.configured;
        const isActive = pId === activeProvider;

        const badge = isActive
            ? `<span class="provider-badge active-label">✅ 激活中</span>`
            : isConnected
                ? `<span class="provider-badge connected">已配置</span>`
                : '';

        const fields = p.fields.map(f => `
            <div class="provider-key-input">
                <input type="${f.type || 'password'}"
                    class="form-input provider-field"
                    id="pf-${pId}-${f.key}"
                    placeholder="${f.placeholder}"
                    autocomplete="off"
                    value="">
            </div>
        `).join('');

        const oauthBtn = p.hasOAuth ? `
            <button class="btn-oauth" onclick="startOpenRouterOAuth()">
                🔑 一键 OAuth 授权
            </button>
        ` : '';

        return `
        <div class="provider-card ${isActive ? 'active' : ''} ${isConnected ? 'connected' : ''}" id="pcard-${pId}">
            <div class="provider-card-header">
                <span class="provider-icon">${p.icon}</span>
                <div class="provider-info">
                    <div class="provider-name">${p.label}</div>
                    <div class="provider-desc">${p.description}</div>
                </div>
                ${badge}
            </div>
            <div class="provider-card-body">
                ${fields}
                <div class="provider-actions">
                    ${oauthBtn}
                    <button class="btn-use-provider ${isActive ? 'active-btn' : ''}"
                        onclick="activateProvider('${pId}')">
                        ${isActive ? '✓ 当前激活' : '设为激活'}
                    </button>
                    <a href="${p.keysPage}" target="_blank" class="provider-key-link">🔗 获取 Key</a>
                </div>
            </div>
        </div>`;
    }).join('');

    // 显示已保存（脱敏）Key
    Object.entries(conf.providers || {}).forEach(([pId, pConf]) => {
        if (pConf.configured && pConf.apiKey) {
            const el = document.getElementById(`pf-${pId}-apiKey`);
            if (el) el.placeholder = pConf.apiKey;
        }
    });
}

/** 保存某个 Provider 的 Key */
async function saveProviderKey(pId) {
    const meta = await fetchProviderMeta();
    if (!meta || !meta[pId]) return;

    const data = { activeProvider: document.getElementById('activeProviderLabel') ? undefined : pId };
    const fields = meta[pId].fields;
    const providerData = {};
    let hasValue = false;

    fields.forEach(f => {
        const el = document.getElementById(`pf-${pId}-${f.key}`);
        if (el && el.value.trim() && !el.value.includes('...')) {
            providerData[f.key] = el.value.trim();
            hasValue = true;
        }
    });

    if (!hasValue) return;
    data[pId] = providerData;

    await fetch(`${API}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    showToast(`✅ ${meta[pId].label} Key 已保存`);
    await loadConfig();
    await loadModels();
}

/** 设置激活 Provider */
async function activateProvider(pId) {
    // 先保存当前 Key（如果有输入）
    await saveProviderKey(pId);

    await fetch(`${API}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeProvider: pId }),
    });
    showToast('✅ Provider 已切换，重新加载模型列表...');
    await loadConfig();
    await loadModels();
}

// ===================== OpenRouter OAuth PKCE =====================

function initOAuth() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code) return;

    // 清除 URL 中的 code 参数
    window.history.replaceState({}, '', window.location.pathname);
    fetchOAuthCallback(code, state);
}

async function fetchOAuthCallback(code, state) {
    try {
        showToast('🔄 正在完成 OpenRouter 授权...');
        const res = await fetch(`${API}/oauth/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state }),
        });
        const data = await res.json();
        if (data.success) {
            showToast('🎉 OpenRouter 授权成功！');
            // 自动切换到配置 Tab
            document.querySelector('[data-tab="config"]')?.click();
            await loadConfig();
            await loadModels();
        } else {
            showToast(`❌ 授权失败：${data.error}`);
        }
    } catch (e) {
        showToast('❌ 授权请求失败，请重试');
    }
}

async function startOpenRouterOAuth() {
    try {
        const res = await fetch(`${API}/oauth/openrouter/start`);
        const { authUrl } = await res.json();
        window.location.href = authUrl;
    } catch (e) {
        showToast('❌ 获取授权链接失败');
    }
}

function showToast(msg) {
    let toast = document.getElementById('globalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1a1a2e;border:1px solid var(--border-accent);color:var(--text-primary);padding:12px 20px;border-radius:12px;font-size:0.85rem;z-index:9999;transition:opacity 0.3s;box-shadow:0 8px 32px rgba(0,0,0,0.4)';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}

// ===================== CUSTOM PROVIDER CRUD =====================

function setupCustomProvider() {
    const addBtn = document.getElementById('addCustomProviderBtn');
    const form = document.getElementById('customProviderForm');
    const saveBtn = document.getElementById('saveCustomProviderBtn');
    const cancelBtn = document.getElementById('cancelCustomProviderBtn');
    if (!addBtn || !form) return;

    let editingId = null;

    addBtn.addEventListener('click', () => {
        editingId = null;
        document.getElementById('cpId').value = '';
        document.getElementById('cpName').value = '';
        document.getElementById('cpBaseUrl').value = '';
        document.getElementById('cpApiKey').value = '';
        document.getElementById('cpId').disabled = false;
        form.style.display = 'block';
        document.getElementById('cpId').focus();
    });

    cancelBtn.addEventListener('click', () => { form.style.display = 'none'; });

    saveBtn.addEventListener('click', async () => {
        const id = document.getElementById('cpId').value.trim();
        const name = document.getElementById('cpName').value.trim() || id;
        const baseUrl = document.getElementById('cpBaseUrl').value.trim();
        const apiKey = document.getElementById('cpApiKey').value.trim();
        if (!id || !baseUrl) { showToast('❌ Provider ID 和 Base URL 不能为空'); return; }

        const res = await fetch(`${API}/config/custom-provider`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, baseUrl, apiKey, autoFetchModels: true }),
        });
        if (res.ok) {
            form.style.display = 'none';
            showToast(`✅ Custom Provider "${name}" 已保存`);
            await loadConfig();
            await loadModels();
        }
    });
}

function renderCustomProviders(customProviders, activeProvider) {
    const list = document.getElementById('customProviderList');
    if (!list) return;

    if (!customProviders || customProviders.length === 0) {
        list.innerHTML = `<div class="empty-state" style="padding:24px 0">
            <div class="empty-icon">🧩</div>
            <div class="empty-text">暂无自定义 Provider，点击「+ 添加」</div>
        </div>`;
        return;
    }

    list.innerHTML = customProviders.map(cp => {
        const isActive = cp.id === activeProvider;
        return `<div class="cp-list-item ${isActive ? 'active-cp' : ''}">
            <span class="cp-list-icon">🧩</span>
            <div class="cp-list-info">
                <div class="cp-list-name">${cp.name || cp.id} ${isActive ? '<span class="provider-badge active-label">✅ 激活中</span>' : ''}</div>
                <div class="cp-list-url">${cp.baseUrl}</div>
            </div>
            <div class="cp-list-actions">
                <button class="btn-cp-action" onclick="activateProvider('${cp.id}')">
                    ${isActive ? '✓ 当前激活' : '设为激活'}
                </button>
                <button class="btn-cp-action btn-cp-delete" onclick="deleteCustomProvider('${cp.id}')">🗑</button>
            </div>
        </div>`;
    }).join('');
}

async function deleteCustomProvider(id) {
    if (!confirm(`确认删除 Custom Provider "${id}"？`)) return;
    const res = await fetch(`${API}/config/custom-provider/${id}`, { method: 'DELETE' });
    if (res.ok) {
        showToast(`✅ 已删除 "${id}"`);
        await loadConfig();
        await loadModels();
    }
}

// === Restored: initTabs ===
function initTabs() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`panel-${tab}`).classList.add('active');
            if (tab === 'history') loadHistory();
        });
    });
}

// === Restored: initStrategyCards ===
function initStrategyCards() {
    document.querySelectorAll('.strategy-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.strategy-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const radio = card.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            updateEstimate();
        });
    });
}

// === Restored: initTokenPresets ===
function initTokenPresets() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tokenTarget').value = btn.dataset.value;
            updateEstimate();
        });
    });

    document.getElementById('tokenTarget').addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        document.querySelectorAll('.preset-btn').forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.value) === val);
        });
        updateEstimate();
    });
}

// ===================== 初始化入口 =====================
document.addEventListener('DOMContentLoaded', async () => {
    initOAuth();               // 检测 OpenRouter OAuth 回调
    initTabs();                // 侧边栏 Tab 切换
    initStrategyCards();       // 策略选择卡片
    initTokenPresets();        // Token 预设按钮
    setupEstimateListeners();  // 费用预估监听
    initCustomModelToggle();   // 兼容旧占位（空函数）
    await loadModels();        // 加载模型列表 → 初始化 combo input
    await loadConfig();        // 加载配置 → 渲染 Provider 卡片
    await loadHistory();       // 加载历史记录
    setupButtons();            // 绑定所有静态按钮事件
    await checkApiStatus();    // 检查 API 状态
});
